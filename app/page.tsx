'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  useEffect(() => {
    // 在客戶端動態獲取當前 URL
    const baseUrl = 
      process.env.NEXT_PUBLIC_BASE_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    setWebhookUrl(`${baseUrl}/api/webhook`);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Line Bot 系統</h1>
        <p className="text-lg text-gray-600 mb-8">
          智慧聊天機器人後端系統
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Webhook 端點</h2>
            <code className="text-sm">/api/webhook</code>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              請將此 URL 設定到 Line Developer Console 的 Webhook URL：
            </p>
            <code className="text-sm font-mono bg-white p-2 rounded block break-all">
              {webhookUrl || '載入中...'}
            </code>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h2 className="font-semibold mb-2">管理後台</h2>
            <p className="text-sm text-gray-700 mb-2">
              前往管理後台檢視對話紀錄：
            </p>
            <a 
              href="/admin" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              /admin
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}




