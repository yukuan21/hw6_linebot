import { NextRequest, NextResponse } from 'next/server';
import { WebhookEvent, MessageEvent, TextMessage, PostbackEvent } from '@line/bot-sdk';
import { getLineClient, verifyLineSignature, validateLineConfig } from '@/lib/line-config';
import { generateResponse } from '@/lib/openai-service';
import { connectDB } from '@/lib/mongodb';
import { getOrCreateConversation, updateConversationMode } from '@/lib/db-service';
import {
  handlePopularDestinations,
  handleTravelPlanning,
  handleFoodRecommendation,
  handleMessageByMode,
} from '@/lib/bot-features';
import { ConversationMode } from '@/lib/models/Conversation';

// 處理 Line webhook 的 POST 請求
export async function POST(req: NextRequest) {
  // 驗證配置（在實際執行時才驗證，避免建置時錯誤）
  validateLineConfig();
  const lineClient = getLineClient();
  try {
    // 確保資料庫連接已建立（在處理訊息之前）
    try {
      await connectDB();
    } catch (dbError) {
      console.error('資料庫連接失敗:', dbError);
      // 如果資料庫連接失敗，仍然繼續處理（降級處理）
      // 但會在後續的 generateResponse 中再次嘗試連接
    }

    // 取得請求內容
    const body = await req.text();
    const signature = req.headers.get('x-line-signature');

    if (!signature) {
      return NextResponse.json(
        { error: '缺少 x-line-signature 標頭' },
        { status: 400 }
      );
    }

    // 驗證簽名
    if (!verifyLineSignature(body, signature)) {
      return NextResponse.json(
        { error: '簽名驗證失敗' },
        { status: 401 }
      );
    }

    // 解析事件
    const events: WebhookEvent[] = JSON.parse(body).events;

    // 先快速返回 200 回應給 Line，避免超時
    // 然後在背景處理事件
    Promise.all(
      events.map(async (event: WebhookEvent) => {
        const userId = event.source.userId || 'unknown';

        // 處理 Postback 事件（Rich Menu 按鈕點擊）
        if (event.type === 'postback') {
          const postbackEvent = event as PostbackEvent;
          const postbackData = postbackEvent.postback.data;
          
          console.log('收到 Postback 事件:', postbackData);
          console.log('使用者 ID:', userId);

          try {
            let response: string;

            switch (postbackData) {
              case 'popular_destinations':
                response = await handlePopularDestinations(userId);
                break;
              case 'travel_planning':
                response = await handleTravelPlanning(userId);
                break;
              case 'food_recommendation':
                response = await handleFoodRecommendation(userId);
                break;
              default:
                response = '抱歉，我不認識這個功能。';
            }

            // 回覆訊息
            await lineClient.replyMessage(postbackEvent.replyToken, {
              type: 'text',
              text: response,
            });
          } catch (error: any) {
            console.error('處理 Postback 事件時發生錯誤:', error);
            try {
              await lineClient.replyMessage(postbackEvent.replyToken, {
                type: 'text',
                text: '抱歉，處理您的請求時發生錯誤，請稍後再試。',
              });
            } catch (replyError) {
              console.error('回覆錯誤訊息時失敗:', replyError);
            }
          }
          return;
        }

        // 處理文字訊息事件
        if (event.type !== 'message' || event.message.type !== 'text') {
          return;
        }

        const messageEvent = event as MessageEvent;
        const textMessage = messageEvent.message as TextMessage;
        const userMessage = textMessage.text;

        console.log('收到訊息:', userMessage);
        console.log('使用者 ID:', userId);

        try {
          const conversation = await getOrCreateConversation(userId);
          
          // 檢查是否為 Rich Menu 觸發的特殊文字
          let currentMode: ConversationMode = conversation.currentMode || null;
          
          if (userMessage === '熱門景點' || userMessage === '查看熱門景點') {
            currentMode = 'popular_destinations';
            await updateConversationMode(conversation._id, currentMode);
            const response = await handlePopularDestinations(userId);
            await lineClient.replyMessage(messageEvent.replyToken, {
              type: 'text',
              text: response,
            });
            return;
          }
          
          if (userMessage === '旅遊規劃' || userMessage === '開始規劃旅遊') {
            currentMode = 'travel_planning';
            await updateConversationMode(conversation._id, currentMode);
            const response = await handleTravelPlanning(userId);
            await lineClient.replyMessage(messageEvent.replyToken, {
              type: 'text',
              text: response,
            });
            return;
          }
          
          if (userMessage === '美食推薦' || userMessage === '尋找美食') {
            currentMode = 'food_recommendation';
            await updateConversationMode(conversation._id, currentMode);
            const response = await handleFoodRecommendation(userId);
            await lineClient.replyMessage(messageEvent.replyToken, {
              type: 'text',
              text: response,
            });
            return;
          }

          // 檢查使用者是否在功能模式下
          if (currentMode) {
            try {
              // 如果在功能模式下，使用對應的功能處理函數
              const aiResponse = await handleMessageByMode(userId, userMessage, currentMode);
              await lineClient.replyMessage(messageEvent.replyToken, {
                type: 'text',
                text: aiResponse,
              });
            } catch (error: any) {
              // 如果功能處理函數拋出 SWITCH_TO_NORMAL_MODE 錯誤，切換到一般對話模式
              if (error.message === 'SWITCH_TO_NORMAL_MODE') {
                const aiResponse = await generateResponse(userId, userMessage);
                await lineClient.replyMessage(messageEvent.replyToken, {
                  type: 'text',
                  text: aiResponse,
                });
              } else {
                throw error; // 重新拋出其他錯誤
              }
            }
          } else {
            // 否則使用一般的對話回應
            const aiResponse = await generateResponse(userId, userMessage);
            await lineClient.replyMessage(messageEvent.replyToken, {
              type: 'text',
              text: aiResponse,
            });
          }
        } catch (error: any) {
          // 詳細的錯誤日誌（用於診斷）
          console.error('處理訊息時發生錯誤:');
          console.error('錯誤類型:', error?.constructor?.name);
          console.error('錯誤訊息:', error?.message);
          console.error('錯誤狀態碼:', error?.status || error?.response?.status || error?.statusCode);
          console.error('錯誤代碼:', error?.code);
          console.error('完整錯誤物件:', JSON.stringify(error, null, 2));
          
          // 錯誤處理與降級機制
          let errorMessage = '抱歉，我目前無法處理您的請求，請稍後再試。';
          
          // 優先檢查錯誤代碼（比狀態碼更精確）
          const errorCode = error?.code || error?.error?.code;
          const statusCode = error?.status || error?.response?.status || error?.statusCode;
          const errorMsg = String(error?.message || '').toLowerCase();
          
          // 1. 優先檢查配額相關錯誤（insufficient_quota 也是 429，但需要特殊處理）
          if (errorCode === 'insufficient_quota' || 
              error?.error?.code === 'insufficient_quota' ||
              errorMsg.includes('quota') || 
              errorMsg.includes('billing') ||
              errorMsg.includes('exceeded your current quota')) {
            errorMessage = '抱歉，服務配額已用盡。請前往 OpenAI 平台檢查帳號餘額，或聯繫管理員。';
          }
          // 2. 檢查 API Key 相關錯誤
          else if (errorCode === 'invalid_api_key' || 
                   errorMsg.includes('api key') || 
                   errorMsg.includes('authentication') ||
                   errorMsg.includes('invalid') ||
                   statusCode === 401 || 
                   statusCode === 403) {
            errorMessage = '抱歉，服務認證出現問題，請檢查 API Key 是否正確設定。';
          }
          // 3. 檢查速率限制（429 但不是配額問題）
          else if (statusCode === 429 || errorMsg.includes('rate limit')) {
            errorMessage = '抱歉，服務目前使用量較大，請稍候片刻後再試。';
          }
          // 4. 檢查服務不可用錯誤
          else if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) {
            errorMessage = '抱歉，OpenAI 服務暫時無法使用，請稍後再試。';
          }
          // 5. 檢查網路錯誤
          else if (errorCode === 'ECONNREFUSED' || 
                   errorCode === 'ETIMEDOUT' || 
                   errorCode === 'ENOTFOUND' ||
                   errorCode === 'ECONNRESET' ||
                   errorMsg.includes('network') ||
                   errorMsg.includes('timeout') ||
                   errorMsg.includes('connection') ||
                   errorMsg.includes('econnrefused') ||
                   errorMsg.includes('etimedout')) {
            errorMessage = '抱歉，網路連接出現問題，請檢查網路連線後再試。';
          }
          // 6. 檢查資料庫錯誤
          else if (errorMsg.includes('mongodb_uri') || 
                   errorMsg.includes('mongodb') ||
                   (errorMsg.includes('mongoose') && !errorMsg.includes('network')) ||
                   (errorCode === 'ECONNREFUSED' && errorMsg.includes('mongo'))) {
            errorMessage = '抱歉，資料庫服務暫時無法使用，請稍後再試。';
          }
          // 7. 檢查環境變數錯誤
          else if (errorMsg.includes('openai_api_key') || 
                   errorMsg.includes('環境變數') ||
                   errorMsg.includes('environment variable')) {
            errorMessage = '抱歉，服務設定有誤，請檢查 .env 檔案中的 OPENAI_API_KEY 是否正確設定。';
          }
          
          // 回覆錯誤訊息
          try {
            await lineClient.replyMessage(messageEvent.replyToken, {
              type: 'text',
              text: errorMessage,
            });
          } catch (replyError) {
            console.error('回覆錯誤訊息時失敗:', replyError);
          }
        }
      })
    ).catch((error) => {
      // 背景處理錯誤，不影響 HTTP 回應
      // 過濾掉 ECONNRESET 錯誤，因為這是正常的連接中斷
      if (error?.code !== 'ECONNRESET' && error?.message !== 'aborted') {
        console.error('背景處理事件時發生錯誤:', error);
      }
    });

    // 立即返回 200 回應，不等待事件處理完成
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook 錯誤:', error);
    return NextResponse.json(
      { error: '處理 webhook 時發生錯誤' },
      { status: 500 }
    );
  }
}

// GET 請求處理（用於測試）
export async function GET() {
  return NextResponse.json({
    message: 'Line Bot Webhook 端點運行中',
    timestamp: new Date().toISOString(),
  });
}

// HEAD 請求處理（Line 驗證 webhook 時使用）
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
