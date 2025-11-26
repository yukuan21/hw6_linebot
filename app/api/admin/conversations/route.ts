import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAllConversations, searchMessages } from '@/lib/db-service';

/**
 * GET /api/admin/conversations
 * 取得對話列表（支援篩選和分頁）
 * 
 * 查詢參數：
 * - userId: 依使用者 ID 篩選
 * - startDate: 開始時間（ISO 字串）
 * - endDate: 結束時間（ISO 字串）
 * - search: 對話標題或內容搜尋
 * - page: 頁碼（預設 1）
 * - limit: 每頁數量（預設 20）
 */
export async function GET(req: NextRequest) {
  try {
    // 確保資料庫已連接
    await connectDB();

    // 取得查詢參數
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 解析日期
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: '無效的開始日期格式' },
          { status: 400 }
        );
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: '無效的結束日期格式' },
          { status: 400 }
        );
      }
    }

    // 驗證分頁參數
    if (page < 1) {
      return NextResponse.json(
        { error: '頁碼必須大於 0' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: '每頁數量必須在 1-100 之間' },
        { status: 400 }
      );
    }

    // 如果有搜尋關鍵字，返回符合的訊息列表；否則返回對話列表
    if (search) {
      // 搜尋訊息
      const result = await searchMessages({
        userId,
        startDate,
        endDate,
        search,
        page,
        limit,
      });

      // 將 Mongoose 文件轉換為純物件
      const messages = result.messages.map((msg) => ({
        _id: msg._id.toString(),
        conversationId: msg.conversationId.toString(),
        userId: msg.userId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
      }));

      return NextResponse.json({
        messages, // 返回訊息列表
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        isSearch: true, // 標記這是搜尋結果
      });
    } else {
      // 查詢對話
      const result = await getAllConversations({
        userId,
        startDate,
        endDate,
        search,
        page,
        limit,
      });

      // 將 Mongoose 文件轉換為純物件
      const conversations = result.conversations.map((conv) => ({
        _id: conv._id.toString(),
        userId: conv.userId,
        title: conv.title,
        messageCount: conv.messageCount,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
      }));

      return NextResponse.json({
        conversations,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        isSearch: false, // 標記這不是搜尋結果
      });
    }
  } catch (error: any) {
    console.error('取得對話列表時發生錯誤:', error);
    return NextResponse.json(
      { error: '取得對話列表時發生錯誤', details: error.message },
      { status: 500 }
    );
  }
}

