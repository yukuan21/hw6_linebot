import { NextRequest, NextResponse } from 'next/server';
import { lineClient, validateLineConfig } from '@/lib/line-config';
import type { RichMenu } from '@line/bot-sdk';

// 驗證配置
validateLineConfig();

// Rich Menu 配置
const richMenuConfig: RichMenu = {
  size: {
    width: 2500,
    height: 843,
  },
  selected: false,
  name: 'Travel Bot Menu',
  chatBarText: '選單',
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 833,
        height: 843,
      },
      action: {
        type: 'postback' as const,
        label: '熱門景點',
        data: 'popular_destinations',
        displayText: '查看熱門景點',
      },
    },
    {
      bounds: {
        x: 833,
        y: 0,
        width: 833,
        height: 843,
      },
      action: {
        type: 'postback' as const,
        label: '旅遊規劃',
        data: 'travel_planning',
        displayText: '開始規劃旅遊',
      },
    },
    {
      bounds: {
        x: 1666,
        y: 0,
        width: 834,
        height: 843,
      },
      action: {
        type: 'postback' as const,
        label: '美食推薦',
        data: 'food_recommendation',
        displayText: '尋找美食',
      },
    },
  ],
};

/**
 * 建立 Rich Menu
 */
export async function POST(req: NextRequest) {
  try {
    // 建立 Rich Menu
    const richMenuId = await lineClient.createRichMenu(richMenuConfig);
    console.log('✅ Rich Menu 建立成功，ID:', richMenuId);

    // 設定預設 Rich Menu
    await lineClient.setDefaultRichMenu(richMenuId);
    console.log('✅ 已設定為預設 Rich Menu');

    return NextResponse.json({
      success: true,
      richMenuId,
      message: 'Rich Menu 建立並設定成功',
    });
  } catch (error: any) {
    console.error('建立 Rich Menu 時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '建立 Rich Menu 失敗',
      },
      { status: 500 }
    );
  }
}

/**
 * 取得目前的 Rich Menu 列表
 */
export async function GET() {
  try {
    const richMenusResponse = await lineClient.getRichMenuList();
    // getRichMenuList 返回的是一個物件，包含 richmenus 陣列
    const richMenus = Array.isArray(richMenusResponse) 
      ? richMenusResponse 
      : (richMenusResponse as any).richmenus || richMenusResponse;
    
    return NextResponse.json({
      success: true,
      richMenus: richMenus,
    });
  } catch (error: any) {
    console.error('取得 Rich Menu 列表時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '取得 Rich Menu 列表失敗',
      },
      { status: 500 }
    );
  }
}

/**
 * 刪除所有 Rich Menu（用於清理）
 */
export async function DELETE() {
  try {
    const richMenusResponse = await lineClient.getRichMenuList();
    // getRichMenuList 返回的是一個物件，包含 richmenus 陣列
    const richMenus = Array.isArray(richMenusResponse) 
      ? richMenusResponse 
      : (richMenusResponse as any).richmenus || richMenusResponse;
    
    // 刪除所有 Rich Menu
    for (const richMenu of richMenus) {
      try {
        await lineClient.deleteRichMenu(richMenu.richMenuId);
        console.log(`✅ 已刪除 Rich Menu: ${richMenu.richMenuId}`);
      } catch (error) {
        console.error(`刪除 Rich Menu ${richMenu.richMenuId} 時發生錯誤:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: '已刪除所有 Rich Menu',
    });
  } catch (error: any) {
    console.error('刪除 Rich Menu 時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '刪除 Rich Menu 失敗',
      },
      { status: 500 }
    );
  }
}


