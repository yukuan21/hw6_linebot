import OpenAI from 'openai';
import {
  getOrCreateConversation,
  saveMessage,
  getConversationMessages,
  clearUserConversations,
} from './db-service';
import { ConversationMode } from './models/Conversation';

// OpenAI 配置
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
};

// 驗證環境變數
export function validateOpenAIConfig(): void {
  if (!openaiConfig.apiKey) {
    throw new Error('OPENAI_API_KEY 環境變數未設定');
  }
}

// 建立 OpenAI Client 實例
export const openaiClient = new OpenAI({
  apiKey: openaiConfig.apiKey,
});

// 旅遊規劃助理的 system prompt
const SYSTEM_PROMPT = `你是一位專業且友善的旅遊規劃助理。你的特質包括：
- 專業：能夠提供實用的旅遊建議和資訊
- 友善親切：對話輕鬆自然，讓使用者感到舒適
- 熱情：對旅遊充滿熱忱，樂於分享旅遊知識
- 細心：會仔細考慮使用者的預算、地點、時間等需求

當使用者提出預算要求或旅遊地點時，你應該：
1. 仔細聆聽使用者的需求（預算、地點、時間、興趣等）
2. 提供具體且實用的旅遊建議
3. 考慮預算限制，推薦符合預算的選項
4. 可以詢問更多細節來提供更精準的建議
5. 保持熱情且專業的語氣

請用繁體中文回覆，並保持友善且專業的態度。`;

// 對話歷史限制：保留最近 10 輪對話（每輪包含 user 和 assistant 訊息，共 20 則）
const MAX_CONVERSATION_MESSAGES = 20;

/**
 * 產生 AI 回應
 * @param userId - 使用者 ID（用於管理對話歷史）
 * @param userMessage - 使用者訊息
 * @returns AI 回應文字
 */
export async function generateResponse(
  userId: string,
  userMessage: string
): Promise<string> {
  try {
    // 驗證配置
    validateOpenAIConfig();

    // 取得或建立使用者的對話
    const conversation = await getOrCreateConversation(userId);

    // 儲存使用者訊息到資料庫
    await saveMessage(conversation._id, userId, 'user', userMessage);

    // 從資料庫讀取對話歷史（限制為最近 20 則訊息，包含剛剛儲存的使用者訊息）
    // 讀取 MAX_CONVERSATION_MESSAGES + 1 以確保包含最新的使用者訊息
    const dbMessages = await getConversationMessages(
      conversation._id,
      MAX_CONVERSATION_MESSAGES + 1
    );

    // 轉換為 OpenAI API 格式的訊息陣列
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ];

    // 將資料庫中的訊息轉換為 OpenAI API 格式（只包含 user 和 assistant，不包含 system）
    // 由於查詢已經按時間正序排列，直接轉換即可
    for (const msg of dbMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // 限制訊息歷史長度（保留最近 10 輪對話，即 20 則訊息）
    // 如果超過限制，只保留最後 20 則（不包含 system prompt）
    if (messages.length > MAX_CONVERSATION_MESSAGES + 1) {
      // 保留 system prompt + 最近 20 則訊息
      messages.splice(1, messages.length - MAX_CONVERSATION_MESSAGES - 1);
    }

    // 呼叫 OpenAI API（優化：減少 max_tokens 以加快回應速度）
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300, // 減少 token 數量以加快回應
    });

    // 取得 AI 回應
    const aiResponse =
      completion.choices[0]?.message?.content || '抱歉，我無法產生回應。';

    // 儲存 AI 回應到資料庫
    await saveMessage(conversation._id, userId, 'assistant', aiResponse);

    return aiResponse;
  } catch (error) {
    console.error('OpenAI API 錯誤:', error);
    throw error;
  }
}

/**
 * 清除指定使用者的對話歷史
 * @param userId - 使用者 ID
 */
export async function clearConversationHistory(userId: string): Promise<void> {
  await clearUserConversations(userId);
  console.log(`✅ 已清除使用者 ${userId} 的對話歷史`);
}

// 熱門景點查詢的 system prompt（用於識別地區）
const POPULAR_DESTINATIONS_PROMPT = `你是一位專業且友善的旅遊資訊助理，專門協助使用者查詢熱門旅遊景點。

**重要：你現在處於「熱門景點查詢」功能模式中。** 使用者已經點擊了「熱門景點」按鈕，你的任務是幫助他們查詢特定地區的熱門旅遊景點。

你的任務是：
1. **從使用者的訊息中識別地區名稱**（例如：台灣、日本、墾丁、花蓮、台北、司徒加特、巴黎、東京等）
   - 如果使用者說「墾丁」，代表他想查詢墾丁地區的熱門景點
   - 如果使用者說「我想看花蓮的」，代表他想查詢花蓮地區的熱門景點
   - 如果使用者說「都可以」或「隨便」，代表他想查詢全台熱門景點
2. **如果無法從訊息中識別地區**，主動詢問：「您想查詢哪個地區的熱門景點呢？例如：台灣、日本、墾丁等」
3. **不要提供一般性的旅遊建議**，你的唯一任務是幫助使用者查詢熱門景點列表

請用繁體中文回覆，保持友善、引導式的對話風格。`;

// 熱門景點推薦的 system prompt（用於推薦特定地點的景點）
const POPULAR_DESTINATIONS_RECOMMENDATION_PROMPT = `你是一位專業的旅遊資訊助理，專門推薦特定地區的熱門旅遊景點。

**任務：** 使用者想查詢「{REGION}」地區的熱門旅遊景點。請為該地區推薦 10 個最熱門、最值得一遊的旅遊景點。

**要求：**
1. 只推薦該地區的景點，不要推薦其他地區
2. 推薦真實存在且知名的景點
3. 按照熱門程度排序（最熱門的在前）
4. 每個景點用一行列出，格式：景點名稱
5. 只列出景點名稱，不要添加描述、地址或其他資訊
6. 如果該地區是城市，推薦該城市的知名景點
7. 如果該地區是國家，推薦該國家的知名景點或城市

**輸出格式：**
請直接列出 10 個景點名稱，每行一個，例如：
1. 景點一
2. 景點二
3. 景點三
...

請用繁體中文回覆。`;

// 旅遊規劃的 system prompt
const TRAVEL_PLANNING_PROMPT = `你是一位專業且友善的旅遊規劃助理。你的特質包括：
- 專業：能夠提供實用的旅遊建議和資訊
- 友善親切：對話輕鬆自然，讓使用者感到舒適
- 熱情：對旅遊充滿熱忱，樂於分享旅遊知識
- 細心：會仔細考慮使用者的預算、地點、時間等需求

**重要：你現在處於「旅遊規劃」功能模式中。** 使用者已經點擊了「旅遊規劃」按鈕，你的任務是幫助他們規劃完整的旅遊行程。

你需要收集以下資訊來提供完整的旅遊規劃：
1. 地點：想去哪裡旅遊
2. 預算：旅遊預算範圍
3. 天數：預計旅遊幾天
4. 人數：幾個人去
5. 興趣類型：喜歡什麼類型的活動（文化、自然、美食、購物等）
6. 出發時間：什麼時候出發

當使用者提供資訊時，你應該：
1. **仔細聆聽使用者的需求，記住他們之前提供的所有資訊**
2. 如果資訊不足，主動詢問缺少的項目（例如：「請問您想去哪裡旅遊呢？」、「您的預算是多少？」、「預計旅遊幾天？」）
3. **絕對不要重複詢問已經提供的資訊**，要記住對話歷史中的資訊
4. 當所有必要資訊收集完成後，提供詳細的行程規劃（包含景點、住宿、交通、餐飲建議）
5. 保持熱情且專業的語氣

**記住：你是在進行旅遊規劃對話，要根據使用者提供的資訊逐步完善行程規劃，而不是提供一般性的旅遊建議。**

請用繁體中文回覆，並保持友善且專業的態度。`;

// 美食推薦的 system prompt
const FOOD_RECOMMENDATION_PROMPT = `你是一位專業且友善的美食推薦助理。你的特質包括：
- 專業：能夠提供實用的美食建議和餐廳資訊
- 友善親切：對話輕鬆自然，讓使用者感到舒適
- 熱情：對美食充滿熱忱，樂於分享美食知識
- 細心：會仔細考慮使用者的預算、地點、飲食偏好等需求

**重要：你現在處於「美食推薦」功能模式中。** 使用者已經點擊了「美食推薦」按鈕，你的任務是幫助他們找到最適合的美食和餐廳。

你需要收集以下資訊來提供完整的美食推薦：
1. 地點：想在哪個地區尋找美食
2. 預算：用餐預算範圍
3. 飲食偏好：喜歡什麼類型的料理（中式、日式、西式、泰式、韓式等）
4. 用餐人數：幾個人用餐
5. 用餐時間：早餐、午餐、晚餐或下午茶

當使用者提供資訊時，你應該：
1. **仔細聆聽使用者的需求，記住他們之前提供的所有資訊**
2. 如果資訊不足，主動詢問缺少的項目（例如：「請問您想在哪個地區尋找美食？」、「您的預算範圍是？」、「有什麼飲食偏好嗎？」）
3. **絕對不要重複詢問已經提供的資訊**，要記住對話歷史中的資訊
4. 當所有必要資訊收集完成後，提供具體的美食推薦和餐廳建議（包含價格、特色、地址等）
5. 保持熱情且專業的語氣

**記住：你是在進行美食推薦對話，要根據使用者提供的資訊逐步完善推薦，而不是提供一般性的美食建議。**

請用繁體中文回覆，並保持友善且專業的態度。`;

/**
 * 使用 LLM 推薦特定地區的熱門景點
 * @param region - 地區名稱
 * @returns 推薦的景點列表（純文字，每行一個景點）
 */
export async function recommendDestinationsByLLM(
  region: string
): Promise<string> {
  try {
    validateOpenAIConfig();

    const prompt = POPULAR_DESTINATIONS_RECOMMENDATION_PROMPT.replace(
      '{REGION}',
      region
    );

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: `請推薦 ${region} 地區的 10 個熱門旅遊景點。`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const recommendations =
      completion.choices[0]?.message?.content || '無法取得推薦景點。';

    return recommendations;
  } catch (error) {
    console.error('LLM 推薦景點時發生錯誤:', error);
    throw error;
  }
}

/**
 * 產生熱門景點查詢的回應（用於識別地區）
 * @param userId - 使用者 ID
 * @param userMessage - 使用者訊息
 * @returns AI 回應文字和提取的地區資訊（如果有的話）
 */
export async function generatePopularDestinationsResponse(
  userId: string,
  userMessage: string
): Promise<{ response: string; region?: string }> {
  try {
    validateOpenAIConfig();

    const conversation = await getOrCreateConversation(userId);
    await saveMessage(conversation._id, userId, 'user', userMessage);

    const dbMessages = await getConversationMessages(
      conversation._id,
      MAX_CONVERSATION_MESSAGES + 1
    );

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: POPULAR_DESTINATIONS_PROMPT,
      },
    ];

    for (const msg of dbMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    if (messages.length > MAX_CONVERSATION_MESSAGES + 1) {
      messages.splice(1, messages.length - MAX_CONVERSATION_MESSAGES - 1);
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiResponse =
      completion.choices[0]?.message?.content || '抱歉，我無法產生回應。';

    await saveMessage(conversation._id, userId, 'assistant', aiResponse);

    // 嘗試從使用者訊息中提取地區資訊
    const regionKeywords = ['台灣', '日本', '墾丁', '花蓮', '台東', '宜蘭', '南投', '阿里山', '日月潭', '九份', '淡水', '台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '雲林', '嘉義', '台南', '高雄', '屏東'];
    let extractedRegion: string | undefined;
    
    for (const keyword of regionKeywords) {
      if (userMessage.includes(keyword)) {
        extractedRegion = keyword;
        break;
      }
    }

    return { response: aiResponse, region: extractedRegion };
  } catch (error) {
    console.error('OpenAI API 錯誤:', error);
    throw error;
  }
}

/**
 * 產生旅遊規劃的回應
 * @param userId - 使用者 ID
 * @param userMessage - 使用者訊息
 * @returns AI 回應文字
 */
export async function generateTravelPlanningResponse(
  userId: string,
  userMessage: string
): Promise<string> {
  try {
    validateOpenAIConfig();

    const conversation = await getOrCreateConversation(userId);
    await saveMessage(conversation._id, userId, 'user', userMessage);

    const dbMessages = await getConversationMessages(
      conversation._id,
      MAX_CONVERSATION_MESSAGES + 1
    );

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: TRAVEL_PLANNING_PROMPT,
      },
    ];

    for (const msg of dbMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    if (messages.length > MAX_CONVERSATION_MESSAGES + 1) {
      messages.splice(1, messages.length - MAX_CONVERSATION_MESSAGES - 1);
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300, // 減少 token 數量以加快回應
    });

    const aiResponse =
      completion.choices[0]?.message?.content || '抱歉，我無法產生回應。';

    await saveMessage(conversation._id, userId, 'assistant', aiResponse);

    return aiResponse;
  } catch (error) {
    console.error('OpenAI API 錯誤:', error);
    throw error;
  }
}

/**
 * 產生美食推薦的回應
 * @param userId - 使用者 ID
 * @param userMessage - 使用者訊息
 * @returns AI 回應文字
 */
export async function generateFoodRecommendationResponse(
  userId: string,
  userMessage: string
): Promise<string> {
  try {
    validateOpenAIConfig();

    const conversation = await getOrCreateConversation(userId);
    await saveMessage(conversation._id, userId, 'user', userMessage);

    const dbMessages = await getConversationMessages(
      conversation._id,
      MAX_CONVERSATION_MESSAGES + 1
    );

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: FOOD_RECOMMENDATION_PROMPT,
      },
    ];

    for (const msg of dbMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    if (messages.length > MAX_CONVERSATION_MESSAGES + 1) {
      messages.splice(1, messages.length - MAX_CONVERSATION_MESSAGES - 1);
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300, // 減少 token 數量以加快回應
    });

    const aiResponse =
      completion.choices[0]?.message?.content || '抱歉，我無法產生回應。';

    await saveMessage(conversation._id, userId, 'assistant', aiResponse);

    return aiResponse;
  } catch (error) {
    console.error('OpenAI API 錯誤:', error);
    throw error;
  }
}

