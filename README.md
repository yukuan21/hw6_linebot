# Line Bot 智慧聊天機器人系統

這是一個整合 Line Messaging API 的智慧聊天機器人系統，使用 Next.js 和 TypeScript 開發。

## 快速開始

- 📖 [本地開發設定指南](SETUP.md)
- 🚀 [Vercel 部署指南](VERCEL_DEPLOYMENT.md) - **推薦閱讀**
- 🔗 [Webhook 設定說明](WEBHOOK_SETUP.md)
- 🗄️ [MongoDB 設定說明](MONGODB_SETUP.md)
- 🤖 [OpenAI 設定說明](OPENAI_SETUP.md)
- 📊 [管理後台說明](ADMIN_PANEL.md)

## 專案結構

- `app/api/webhook/route.ts` - Line Bot webhook 端點
- `app/api/admin/` - 管理後台 API 端點
- `app/admin/page.tsx` - 管理後台介面
- `lib/line-config.ts` - Line Bot 配置檔案
- `lib/openai-service.ts` - OpenAI LLM 服務
- `lib/db-service.ts` - 資料庫服務
- `app/page.tsx` - 首頁（顯示 webhook URL）

## 設定步驟

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `env.example` 檔案並重新命名為 `.env`：

```bash
cp env.example .env
```

編輯 `.env` 檔案，填入你的 Line Bot 資訊：

```
LINE_CHANNEL_ACCESS_TOKEN=你的 Channel Access Token
LINE_CHANNEL_SECRET=你的 Channel Secret
LINE_USER_ID=你的 User ID
OPENAI_API_KEY=你的 OpenAI API Key
MONGODB_URI=你的 MongoDB Atlas 連接字串
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

詳細的環境變數設定請參考 [env.example](env.example) 檔案。

### 3. 啟動開發伺服器

```bash
npm run dev
```

伺服器會運行在 `http://localhost:3000`

### 4. 設定 Line Webhook URL

1. 前往 [Line Developers Console](https://developers.line.biz/console/)
2. 選擇你的 Channel
3. 在 "Messaging API" 頁籤中，找到 "Webhook URL"
4. 輸入你的 webhook URL：
   - 本地測試：使用 `ngrok` 等工具將 `http://localhost:3000/api/webhook` 對外開放
   - 或使用部署的 URL：`https://your-domain.com/api/webhook`
5. 點擊 "Verify" 驗證 webhook
6. 開啟 "Use webhook"

### 5. 測試

1. 在 Line 中搜尋你的 Bot
2. 加入好友
3. 傳送訊息測試

## 本地開發時使用 ngrok（推薦）

如果你需要在本地測試 webhook，可以使用 ngrok：

```bash
# 安裝 ngrok
npm install -g ngrok

# 啟動本地開發伺服器
npm run dev

# 在另一個終端視窗，啟動 ngrok
ngrok http 3000
```

ngrok 會提供一個公開的 URL（例如：`https://xxxx.ngrok.io`），將此 URL + `/api/webhook` 設定到 Line Developer Console。

## 功能說明

### Webhook 端點 (`/api/webhook`)

- **POST**: 接收 Line 訊息事件
- **GET**: 測試端點是否運行

### 管理後台 (`/admin`)

- 檢視對話紀錄
- 搜尋和篩選功能
- 即時更新對話列表
- 查看訊息詳情

### 已實作功能

- ✅ Line Bot 基本功能（接收訊息、回覆、Rich Menu）
- ✅ LLM 整合（OpenAI GPT-3.5-turbo）
- ✅ 對話脈絡維持（保留最近 10 輪對話）
- ✅ 資料庫整合（MongoDB Atlas）
- ✅ 管理後台（檢視對話、篩選、即時更新）
- ✅ 錯誤處理與降級機制
- ✅ LLM 配額與速率限制處理
- ✅ 進階篩選功能（使用者、日期、搜尋）

## 部署

### 部署到 Vercel（推薦）

詳細的部署步驟請參考 [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)。

快速步驟：
1. 將程式碼推送到 GitHub
2. 在 Vercel 建立新專案並連接 GitHub 儲存庫
3. 設定環境變數
4. 部署並更新 Line Webhook URL

### 本地開發

如需在本地開發，請參考 [SETUP.md](SETUP.md) 和 [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md)。




