import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import {
  getConversationMessages,
  getConversationMessageCount,
} from '@/lib/db-service';

/**
 * GET /api/admin/messages
 * 取得訊息列表（依 conversationId）
 * 
 * 查詢參數：
 * - conversationId: 對話 ID（必填）
 * - page: 頁碼（預設 1）
 * - limit: 每頁數量（預設 50）
 */
export async function GET(req: NextRequest) {
  try {
    // 確保資料庫已連接
    await connectDB();

    // 取得查詢參數
    const searchParams = req.nextUrl.searchParams;
    const conversationIdStr = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 驗證必要參數
    if (!conversationIdStr) {
      return NextResponse.json(
        { error: '缺少必要參數: conversationId' },
        { status: 400 }
      );
    }

    // 驗證 conversationId 格式
    let conversationId: Types.ObjectId;
    try {
      conversationId = new Types.ObjectId(conversationIdStr);
    } catch (error) {
      return NextResponse.json(
        { error: '無效的 conversationId 格式' },
        { status: 400 }
      );
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

    // 計算跳過的數量
    const skip = (page - 1) * limit;

    // 查詢訊息和總數
    const [messages, total] = await Promise.all([
      getConversationMessages(conversationId, limit, skip),
      getConversationMessageCount(conversationId),
    ]);

    // 將 Mongoose 文件轉換為純物件
    const messagesData = messages.map((msg) => ({
      _id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      userId: msg.userId,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      messages: messagesData,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error('取得訊息列表時發生錯誤:', error);
    return NextResponse.json(
      { error: '取得訊息列表時發生錯誤', details: error.message },
      { status: 500 }
    );
  }
}


