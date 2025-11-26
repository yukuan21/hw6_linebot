import {
  getOrCreateConversation,
  updateConversationMode,
  getPopularDestinations,
} from './db-service';
import {
  generatePopularDestinationsResponse,
  generateTravelPlanningResponse,
  generateFoodRecommendationResponse,
  recommendDestinationsByLLM,
} from './openai-service';
import { ConversationMode } from './models/Conversation';

/**
 * 處理熱門景點查詢功能
 * @param userId - 使用者 ID
 * @param userMessage - 使用者訊息（可選，如果是初次點擊按鈕則為空）
 * @returns 回應文字
 */
export async function handlePopularDestinations(
  userId: string,
  userMessage?: string
): Promise<string> {
  try {
    const conversation = await getOrCreateConversation(userId);
    
    // 如果是初次點擊按鈕（沒有 userMessage），發送引導訊息
    if (!userMessage) {
      await updateConversationMode(conversation._id, 'popular_destinations');
      return '您想查詢哪個地區的熱門景點呢？例如：台灣、日本、墾丁、花蓮等\n\n請直接告訴我想查詢的地區名稱！';
    }

    // 使用 LLM 識別地區資訊
    const { response, region } = await generatePopularDestinationsResponse(
      userId,
      userMessage
    );

    // 如果 LLM 回應中已經包含了引導訊息，直接返回
    if (response.includes('您想查詢') || response.includes('哪個地區')) {
      return response;
    }

    // 檢查用戶輸入是否真的像地區名稱
    // 如果包含疑問詞、動詞等，可能不是要查詢地區，而是其他問題
    const questionKeywords = ['哪裡', '什麼', '如何', '怎麼', '為什麼', '在哪', '在哪裡', '他', '她', '它', '這個', '那個', '哪個'];
    const isQuestion = questionKeywords.some(keyword => userMessage.includes(keyword));
    
    // 如果看起來像問題而不是地區名稱，清除功能模式並返回 null
    // 讓 webhook 使用一般對話模式處理
    if (isQuestion) {
      await updateConversationMode(conversation._id, null);
      // 返回特殊標記，讓 webhook 知道要使用一般對話
      throw new Error('SWITCH_TO_NORMAL_MODE');
    }

    // 如果 LLM 提取到地區資訊，使用 LLM 推薦該地區的熱門景點
    if (region) {
      try {
        const llmRecommendations = await recommendDestinationsByLLM(region);
        
        // 格式化 LLM 推薦的景點
        let result = `📊 ${region} 地區的熱門旅遊景點：\n\n`;
        
        // 解析 LLM 推薦的景點列表
        const lines = llmRecommendations.split('\n').filter(line => line.trim());
        let index = 1;
        
        for (const line of lines) {
          // 移除行首的數字（如果有）
          const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').trim();
          if (cleanLine && index <= 10) {
            result += `${index}. ${cleanLine}\n`;
            index++;
          }
        }
        
        // 成功返回熱門景點後，清除功能模式，讓後續對話回到一般模式
        await updateConversationMode(conversation._id, null);
        
        return result;
      } catch (error) {
        console.error('LLM 推薦景點時發生錯誤:', error);
        return `📊 ${region} 地區的熱門旅遊景點：\n\n抱歉，目前無法取得該地區的景點資訊。請稍後再試或查詢其他地區。`;
      }
    }

    // 如果 LLM 沒有提取到地區資訊，嘗試直接將使用者輸入當作地區名稱
    // 這可以處理一些 LLM 無法識別但確實是地區名稱的情況
    if (userMessage.length <= 20 && !userMessage.includes('？') && !userMessage.includes('?')) {
      try {
        const llmRecommendations = await recommendDestinationsByLLM(userMessage);
        
        // 格式化 LLM 推薦的景點
        let result = `📊 ${userMessage} 地區的熱門旅遊景點：\n\n`;
        
        // 解析 LLM 推薦的景點列表
        const lines = llmRecommendations.split('\n').filter(line => line.trim());
        let index = 1;
        
        for (const line of lines) {
          // 移除行首的數字（如果有）
          const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').trim();
          if (cleanLine && index <= 10) {
            result += `${index}. ${cleanLine}\n`;
            index++;
          }
        }
        
        // 成功返回熱門景點後，清除功能模式，讓後續對話回到一般模式
        await updateConversationMode(conversation._id, null);
        
        return result;
      } catch (error) {
        console.error('LLM 推薦景點時發生錯誤:', error);
        return `📊 ${userMessage} 地區的熱門旅遊景點：\n\n抱歉，目前無法取得該地區的景點資訊。請稍後再試或查詢其他地區。`;
      }
    }

    // 如果都沒有匹配，返回 LLM 的回應（可能是引導訊息）
    return response;
  } catch (error) {
    console.error('處理熱門景點查詢時發生錯誤:', error);
    throw error;
  }
}

/**
 * 處理旅遊規劃功能
 * @param userId - 使用者 ID
 * @param userMessage - 使用者訊息（可選，如果是初次點擊按鈕則為空）
 * @returns 回應文字
 */
export async function handleTravelPlanning(
  userId: string,
  userMessage?: string
): Promise<string> {
  try {
    const conversation = await getOrCreateConversation(userId);
    
    // 如果是初次點擊按鈕（沒有 userMessage），發送歡迎訊息
    if (!userMessage) {
      await updateConversationMode(conversation._id, 'travel_planning');
      return '🌟 歡迎使用旅遊規劃助手！\n\n我可以幫您規劃完美的旅遊行程。請告訴我以下資訊：\n\n📍 想去哪裡旅遊？\n💰 預算範圍？\n📅 預計旅遊幾天？\n👥 幾個人去？\n🎯 喜歡什麼類型的活動？（文化、自然、美食、購物等）\n\n您可以一次告訴我所有資訊，或逐步回答我的問題！';
    }

    // 使用 LLM 進行旅遊規劃對話
    return await generateTravelPlanningResponse(userId, userMessage);
  } catch (error) {
    console.error('處理旅遊規劃時發生錯誤:', error);
    throw error;
  }
}

/**
 * 處理美食推薦功能
 * @param userId - 使用者 ID
 * @param userMessage - 使用者訊息（可選，如果是初次點擊按鈕則為空）
 * @returns 回應文字
 */
export async function handleFoodRecommendation(
  userId: string,
  userMessage?: string
): Promise<string> {
  try {
    const conversation = await getOrCreateConversation(userId);
    
    // 如果是初次點擊按鈕（沒有 userMessage），發送歡迎訊息
    if (!userMessage) {
      await updateConversationMode(conversation._id, 'food_recommendation');
      return '🍽️ 歡迎使用美食推薦功能！\n\n我可以幫您找到最適合的美食和餐廳。請告訴我以下資訊：\n\n📍 想在哪個地區尋找美食？\n💰 用餐預算範圍？\n🍜 喜歡什麼類型的料理？（中式、日式、西式、泰式、韓式等）\n👥 幾個人用餐？\n⏰ 用餐時間？（早餐、午餐、晚餐、下午茶）\n\n您可以一次告訴我所有資訊，或逐步回答我的問題！';
    }

    // 使用 LLM 進行美食推薦對話
    return await generateFoodRecommendationResponse(userId, userMessage);
  } catch (error) {
    console.error('處理美食推薦時發生錯誤:', error);
    throw error;
  }
}

/**
 * 根據功能模式處理訊息
 * @param userId - 使用者 ID
 * @param userMessage - 使用者訊息
 * @param mode - 功能模式
 * @returns 回應文字
 */
export async function handleMessageByMode(
  userId: string,
  userMessage: string,
  mode: ConversationMode
): Promise<string> {
  switch (mode) {
    case 'popular_destinations':
      return await handlePopularDestinations(userId, userMessage);
    case 'travel_planning':
      return await handleTravelPlanning(userId, userMessage);
    case 'food_recommendation':
      return await handleFoodRecommendation(userId, userMessage);
    default:
      throw new Error(`未知的功能模式: ${mode}`);
  }
}

