import { Client, validateSignature } from '@line/bot-sdk';
import crypto from 'crypto';

// Line Bot 配置
export const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// 延遲建立 Line Client 實例（避免建置時錯誤）
let _lineClient: Client | null = null;

// 取得 Line Client 實例（延遲建立，只在實際使用時才建立）
export function getLineClient(): Client {
  if (!_lineClient) {
    _lineClient = new Client({
      channelAccessToken: lineConfig.channelAccessToken,
    });
  }
  return _lineClient;
}

// 注意：不要直接導出 lineClient，因為會在模組載入時建立
// 請使用 getLineClient() 函數來取得 client 實例

// 驗證 webhook 簽名
export function verifyLineSignature(body: string, signature: string): boolean {
  if (!lineConfig.channelSecret) {
    return false;
  }
  
  const hash = crypto
    .createHmac('sha256', lineConfig.channelSecret)
    .update(body)
    .digest('base64');
  
  return hash === signature;
}

// 驗證環境變數
export function validateLineConfig(): void {
  if (!lineConfig.channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
  }
  if (!lineConfig.channelSecret) {
    throw new Error('LINE_CHANNEL_SECRET 環境變數未設定');
  }
}
