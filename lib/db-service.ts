import { Types } from 'mongoose';
import { connectDB } from './mongodb';
import Conversation, { IConversation, ConversationMode } from './models/Conversation';
import Message, { IMessage, MessageRole } from './models/Message';

/**
 * 取得或建立使用者的當前對話
 * 如果使用者沒有對話，則建立一個新的對話
 * @param userId - LINE 使用者 ID
 * @returns Conversation 文件
 */
export async function getOrCreateConversation(
  userId: string
): Promise<IConversation> {
  // 確保資料庫已連接
  await connectDB();

  // 嘗試取得使用者最新的對話
  let conversation = await Conversation.findOne({ userId })
    .sort({ updatedAt: -1 }) // 取得最新的對話
    .exec();

  // 如果沒有對話，建立新的對話
  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      title: '', // 可以根據第一則訊息自動生成標題
      messageCount: 0,
    });
    console.log(`✅ 為使用者 ${userId} 建立新對話: ${conversation._id}`);
  }

  return conversation;
}

/**
 * 建立新的對話會話
 * @param userId - LINE 使用者 ID
 * @returns 新建立的 Conversation 文件
 */
export async function createNewConversation(
  userId: string
): Promise<IConversation> {
  // 確保資料庫已連接
  await connectDB();

  const conversation = await Conversation.create({
    userId,
    title: '',
    messageCount: 0,
  });

  console.log(`✅ 為使用者 ${userId} 建立新對話: ${conversation._id}`);
  return conversation;
}

/**
 * 儲存訊息到資料庫
 * @param conversationId - 對話 ID
 * @param userId - LINE 使用者 ID
 * @param role - 訊息角色（user, assistant, system）
 * @param content - 訊息內容
 * @returns 儲存的 Message 文件
 */
export async function saveMessage(
  conversationId: Types.ObjectId,
  userId: string,
  role: MessageRole,
  content: string
): Promise<IMessage> {
  // 確保資料庫已連接
  await connectDB();

  // 建立並儲存訊息
  const message = await Message.create({
    conversationId,
    userId,
    role,
    content,
    timestamp: new Date(),
  });

  // 更新對話的訊息計數和更新時間
  await Conversation.findByIdAndUpdate(conversationId, {
    $inc: { messageCount: 1 }, // 增加訊息計數
    updatedAt: new Date(), // 更新最後更新時間
  });

  return message;
}

/**
 * 取得對話的訊息歷史
 * @param conversationId - 對話 ID
 * @param limit - 限制返回的訊息數量（預設為 20，即最近 10 輪對話）
 * @param skip - 跳過的訊息數量（用於分頁）
 * @returns 訊息陣列（依時間順序排列）
 */
export async function getConversationMessages(
  conversationId: Types.ObjectId,
  limit: number = 20,
  skip: number = 0
): Promise<IMessage[]> {
  // 確保資料庫已連接
  await connectDB();

  // 查詢訊息，依時間倒序排列（新到舊），然後取最新的 N 則，最後反轉為舊到新
  const messages = await Message.find({ conversationId })
    .sort({ timestamp: -1 }) // 改為倒序排列（新到舊）
    .skip(skip)
    .limit(limit)
    .exec();

  // 反轉陣列，讓它變成舊到新的順序（OpenAI API 需要按時間順序）
  return messages.reverse();
}

/**
 * 取得對話的訊息總數
 * @param conversationId - 對話 ID
 * @returns 訊息總數
 */
export async function getConversationMessageCount(
  conversationId: Types.ObjectId
): Promise<number> {
  // 確保資料庫已連接
  await connectDB();

  const count = await Message.countDocuments({ conversationId }).exec();
  return count;
}

/**
 * 取得使用者的所有對話
 * @param userId - LINE 使用者 ID
 * @returns 對話陣列（依更新時間倒序排列）
 */
export async function getUserConversations(
  userId: string
): Promise<IConversation[]> {
  // 確保資料庫已連接
  await connectDB();

  const conversations = await Conversation.find({ userId })
    .sort({ updatedAt: -1 }) // 最新的在前
    .exec();

  return conversations;
}

/**
 * 清除指定對話的所有訊息
 * @param conversationId - 對話 ID
 */
export async function clearConversationMessages(
  conversationId: Types.ObjectId
): Promise<void> {
  // 確保資料庫已連接
  await connectDB();

  // 刪除所有訊息
  await Message.deleteMany({ conversationId }).exec();

  // 重置對話的訊息計數
  await Conversation.findByIdAndUpdate(conversationId, {
    messageCount: 0,
  });

  console.log(`✅ 已清除對話 ${conversationId} 的所有訊息`);
}

/**
 * 清除指定使用者的所有對話和訊息
 * @param userId - LINE 使用者 ID
 */
export async function clearUserConversations(userId: string): Promise<void> {
  // 確保資料庫已連接
  await connectDB();

  // 取得使用者的所有對話
  const conversations = await Conversation.find({ userId }).exec();

  // 刪除所有對話的訊息
  const conversationIds = conversations.map((conv) => conv._id);
  if (conversationIds.length > 0) {
    await Message.deleteMany({
      conversationId: { $in: conversationIds },
    }).exec();
  }

  // 刪除所有對話
  await Conversation.deleteMany({ userId }).exec();

  console.log(`✅ 已清除使用者 ${userId} 的所有對話和訊息`);
}

/**
 * 取得所有對話（支援篩選和分頁）
 * @param options - 查詢選項
 * @returns 對話陣列和總數
 */
export interface GetAllConversationsOptions {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetAllConversationsResult {
  conversations: IConversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllConversations(
  options: GetAllConversationsOptions = {}
): Promise<GetAllConversationsResult> {
  // 確保資料庫已連接
  await connectDB();

  const {
    userId,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
  } = options;

  // 建立查詢條件
  const query: any = {};

  // 依使用者 ID 篩選
  if (userId) {
    query.userId = userId;
  }

  // 依時間範圍篩選
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = startDate;
    }
    if (endDate) {
      query.createdAt.$lte = endDate;
    }
  }

  // 計算跳過的數量
  const skip = (page - 1) * limit;

  // 如果沒有搜尋條件，直接查詢對話
  if (!search) {
    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Conversation.countDocuments(query).exec(),
    ]);

    return {
      conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 如果有搜尋條件，需要搜尋訊息內容
  // 先找到包含搜尋關鍵字的訊息對應的對話 ID
  const messageQuery: any = {
    content: { $regex: search, $options: 'i' }, // 不區分大小寫
  };

  // 如果指定了時間範圍，也套用到訊息查詢
  if (startDate || endDate) {
    messageQuery.timestamp = {};
    if (startDate) {
      messageQuery.timestamp.$gte = startDate;
    }
    if (endDate) {
      messageQuery.timestamp.$lte = endDate;
    }
  }

  // 如果指定了使用者 ID，也套用到訊息查詢
  if (userId) {
    messageQuery.userId = userId;
  }

  // 找到符合條件的訊息，取得對話 ID
  const matchingMessages = await Message.find(messageQuery)
    .select('conversationId')
    .exec();

  const conversationIds = [
    ...new Set(
      matchingMessages.map((msg) => msg.conversationId.toString())
    ),
  ];

  // 如果沒有找到符合的訊息，返回空結果
  if (conversationIds.length === 0) {
    return {
      conversations: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  // 建立對話查詢（包含對話 ID 列表，以及標題搜尋）
  const conversationQuery: any = {
    $or: [
      { _id: { $in: conversationIds.map((id) => new Types.ObjectId(id)) } },
      { title: { $regex: search, $options: 'i' } },
    ],
  };

  // 合併其他篩選條件
  if (userId) {
    conversationQuery.userId = userId;
  }
  if (startDate || endDate) {
    conversationQuery.createdAt = {};
    if (startDate) {
      conversationQuery.createdAt.$gte = startDate;
    }
    if (endDate) {
      conversationQuery.createdAt.$lte = endDate;
    }
  }

  const [conversations, total] = await Promise.all([
    Conversation.find(conversationQuery)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Conversation.countDocuments(conversationQuery).exec(),
  ]);

  return {
    conversations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 搜尋訊息（依內容關鍵字）
 * @param options - 查詢選項
 * @returns 訊息陣列和總數
 */
export interface SearchMessagesOptions {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search: string; // 必填
  page?: number;
  limit?: number;
}

export interface SearchMessagesResult {
  messages: IMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function searchMessages(
  options: SearchMessagesOptions
): Promise<SearchMessagesResult> {
  // 確保資料庫已連接
  await connectDB();

  const {
    userId,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50,
  } = options;

  // 建立訊息查詢條件
  const messageQuery: any = {
    content: { $regex: search, $options: 'i' }, // 不區分大小寫
  };

  // 如果指定了時間範圍，也套用到訊息查詢
  if (startDate || endDate) {
    messageQuery.timestamp = {};
    if (startDate) {
      messageQuery.timestamp.$gte = startDate;
    }
    if (endDate) {
      messageQuery.timestamp.$lte = endDate;
    }
  }

  // 如果指定了使用者 ID，也套用到訊息查詢
  if (userId) {
    messageQuery.userId = userId;
  }

  // 計算跳過的數量
  const skip = (page - 1) * limit;

  // 查詢符合條件的訊息
  const [messages, total] = await Promise.all([
    Message.find(messageQuery)
      .sort({ timestamp: -1 }) // 最新的在前
      .skip(skip)
      .limit(limit)
      .exec(),
    Message.countDocuments(messageQuery).exec(),
  ]);

  return {
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 更新對話的 currentMode
 * @param conversationId - 對話 ID
 * @param mode - 功能模式
 */
export async function updateConversationMode(
  conversationId: Types.ObjectId,
  mode: ConversationMode
): Promise<void> {
  await connectDB();
  await Conversation.findByIdAndUpdate(conversationId, { currentMode: mode });
}

/**
 * 取得熱門旅遊景點
 * @param region - 可選的地區參數（如「台灣」、「墾丁」等）
 * @param limit - 返回的景點數量（預設為 10）
 * @returns 熱門景點列表及其搜尋次數
 */
export interface PopularDestination {
  name: string;
  count: number;
}

export async function getPopularDestinations(
  region?: string,
  limit: number = 10
): Promise<PopularDestination[]> {
  await connectDB();

  // 常見台灣景點關鍵字列表
  const commonDestinations = [
    '墾丁', '花蓮', '台東', '宜蘭', '南投', '阿里山', '日月潭', '清境', '九份', '淡水',
    '台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '雲林', '嘉義', '台南', '高雄', '屏東',
    '太魯閣', '七星潭', '東海岸', '綠島', '蘭嶼', '小琉球', '澎湖', '金門', '馬祖',
    '陽明山', '北投', '西門町', '信義區', '士林', '大稻埕', '貓空',
    '合歡山', '武嶺', '玉山', '雪山', '奇萊', '能高',
  ];

  // 建立查詢條件：只查詢使用者訊息（role='user'）
  const query: any = {
    role: 'user',
  };

  // 如果指定了地區，在訊息內容中搜尋該地區相關的關鍵字
  if (region) {
    // 建立地區相關的關鍵字列表
    const regionKeywords: string[] = [];
    
    // 根據地區名稱，找出相關的景點關鍵字
    const regionLower = region.toLowerCase();
    for (const dest of commonDestinations) {
      if (dest.includes(region) || region.includes(dest)) {
        regionKeywords.push(dest);
      }
    }
    
    // 如果沒有找到相關關鍵字，直接使用地區名稱
    if (regionKeywords.length === 0) {
      regionKeywords.push(region);
    }

    // 使用正則表達式搜尋包含這些關鍵字的訊息
    query.content = {
      $regex: regionKeywords.join('|'),
      $options: 'i', // 不區分大小寫
    };
  }

  // 查詢所有符合條件的使用者訊息
  const messages = await Message.find(query).select('content').exec();

  // 統計每個景點的出現次數
  const destinationCounts: Record<string, number> = {};

  for (const msg of messages) {
    const content = msg.content;
    
    // 檢查訊息內容中是否包含任何景點關鍵字
    for (const dest of commonDestinations) {
      if (content.includes(dest)) {
        destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
      }
    }
  }

  // 轉換為陣列並排序
  const destinations: PopularDestination[] = Object.entries(destinationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count) // 按次數降序排列
    .slice(0, limit); // 只取前 N 個

  // 如果統計結果不足，提供預設的熱門景點列表
  if (destinations.length < limit) {
    const defaultDestinations: PopularDestination[] = [
      { name: '墾丁', count: 0 },
      { name: '花蓮', count: 0 },
      { name: '台東', count: 0 },
      { name: '宜蘭', count: 0 },
      { name: '南投', count: 0 },
      { name: '阿里山', count: 0 },
      { name: '日月潭', count: 0 },
      { name: '九份', count: 0 },
      { name: '淡水', count: 0 },
      { name: '太魯閣', count: 0 },
    ];

    // 合併統計結果和預設列表，避免重複
    const existingNames = new Set(destinations.map(d => d.name));
    for (const defaultDest of defaultDestinations) {
      if (!existingNames.has(defaultDest.name) && destinations.length < limit) {
        destinations.push(defaultDest);
      }
    }
  }

  return destinations;
}
