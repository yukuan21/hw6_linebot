import { Client, validateSignature } from '@line/bot-sdk';
import crypto from 'crypto';

// Line Bot 配置
export const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// 建立 Line Client 實例
export const lineClient = new Client({
  channelAccessToken: lineConfig.channelAccessToken,
});

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
