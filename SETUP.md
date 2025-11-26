# Line Bot 串接設定指南

這份文件將引導你完成 Line Bot 的串接設定。

## 前置準備

1. **Line Developers Console 帳號**：前往 [Line Developers](https://developers.line.biz/) 註冊
2. **建立 Provider 和 Channel**：已在 Line Developers Console 建立 Channel

## 第一步：取得 Line Bot 憑證

### 1.1 取得 Channel Access Token

1. 登入 [Line Developers Console](https://developers.line.biz/console/)
2. 選擇你的 Provider
3. 選擇你的 Channel（Messaging API 類型）
4. 進入 **「Messaging API」** 頁籤
5. 找到 **「Channel access token」** 區塊
6. 點擊 **「Issue」** 按鈕產生 Channel Access Token
7. 複製產生的 Token（只會顯示一次，請妥善保存）

### 1.2 取得 Channel Secret

1. 在同一個 Channel 頁面
2. 進入 **「Basic settings」** 頁籤
3. 找到 **「Channel secret」** 欄位
4. 點擊 **「Issue」** 或直接複製顯示的 Secret

## 第二步：設定環境變數

### 2.1 建立 .env 檔案

在專案根目錄建立 `.env` 檔案（複製 `env.example`）：

```bash
cp env.example .env
```

### 2.2 編輯 .env 檔案

開啟 `.env` 檔案，填入你的 Line Bot 資訊：

```env
LINE_CHANNEL_ACCESS_TOKEN=你的 Channel Access Token
LINE_CHANNEL_SECRET=你的 Channel Secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 第三步：安裝依賴並啟動

### 3.1 安裝依賴

```bash
npm install
```

### 3.2 啟動開發伺服器

```bash
npm run dev
```

伺服器會運行在 `http://localhost:3000`

## 第四步：設定 Webhook URL

### ⚠️ 為什麼不能用 localhost:3000？

**重要說明**：Line 的伺服器需要從**網際網路**訪問你的 webhook，但 `localhost:3000` 只能在你的**本機電腦**上訪問。Line 的伺服器無法連接到你的電腦的 `localhost`，所以需要一個**公開的 HTTPS URL**。

### 4.1 本地測試的解決方案

你需要使用一個「隧道工具」來將 `localhost:3000` 暴露到網際網路上。以下是幾個免費的選項：

#### 方案 A：使用 ngrok（推薦，穩定）

**優點**：穩定、功能完整  
**缺點**：需要註冊帳號（免費）

1. **註冊 ngrok 帳號並取得 authtoken**：
   - 前往：https://dashboard.ngrok.com/signup
   - 註冊後，到：https://dashboard.ngrok.com/get-started/your-authtoken
   - 複製你的 authtoken

2. **安裝並設定 ngrok**：

```bash
# 安裝 ngrok（如果尚未安裝）
brew install ngrok

# 設定 authtoken
ngrok config add-authtoken <你的authtoken>
```

3. **啟動 ngrok**：

在另一個終端視窗執行：

```bash
ngrok http 3000
```

4. **複製 ngrok 提供的 URL**：

ngrok 會顯示類似以下的資訊：

```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok.io -> http://localhost:3000
```

複製 `https://xxxx-xx-xx-xx-xx.ngrok.io` 這個 URL。

#### 方案 B：使用 Cloudflare Tunnel（免費，無需註冊）

**優點**：完全免費、無需註冊、由 Cloudflare 提供  
**缺點**：設定稍複雜

1. **安裝 cloudflared**：

```bash
brew install cloudflared
```

2. **啟動隧道**：

```bash
cloudflared tunnel --url http://localhost:3000
```

3. **複製提供的 URL**（例如：`https://xxxx.trycloudflare.com`）

#### 方案 C：使用 localtunnel（簡單快速）

**優點**：不需要註冊、簡單快速  
**缺點**：URL 每次都不一樣、可能不穩定

1. **安裝 localtunnel**：

```bash
npm install -g localtunnel
```

2. **啟動隧道**：

```bash
lt --port 3000
```

3. **複製提供的 URL**（例如：`https://xxxx.loca.lt`）

#### 方案 D：直接部署到雲端（生產環境推薦）

如果不想使用隧道工具，可以直接部署到：
- **Vercel**（Next.js 官方推薦，免費）
- **Railway**
- **Render**

部署後會獲得一個永久的 HTTPS URL。

### 4.2 在 Line Developers Console 設定 Webhook

**無論使用哪個方案，接下來的步驟都一樣**：

1. 確保你的開發伺服器正在運行（`npm run dev`）
2. 確保隧道工具正在運行（ngrok、cloudflared 或 localtunnel）
3. 複製隧道提供的 **HTTPS URL**

1. 回到 [Line Developers Console](https://developers.line.biz/console/)
2. 選擇你的 Channel
3. 進入 **「Messaging API」** 頁籤
4. 找到 **「Webhook URL」** 區塊
5. 輸入你的 webhook URL（在隧道 URL 後面加上 `/api/webhook`）：
   - 使用 ngrok：`https://xxxx-xx-xx-xx-xx.ngrok.io/api/webhook`
   - 使用 Cloudflare：`https://xxxx.trycloudflare.com/api/webhook`
   - 使用 localtunnel：`https://xxxx.loca.lt/api/webhook`
   - 或使用部署的 URL：`https://your-domain.com/api/webhook`
6. 點擊 **「Update」** 儲存
7. 點擊 **「Verify」** 按鈕驗證 webhook（應該會顯示 Success）
8. **重要**：開啟 **「Use webhook」** 開關

### 4.3 關閉自動回覆

在 **「Messaging API」** 頁籤中，找到 **「Auto-reply messages」** 區塊，將其關閉，這樣 Bot 才會使用你的 webhook 邏輯。

## 第五步：測試 Bot

### 5.1 加入 Bot 為好友

1. 在 Line Developers Console 的 Channel 頁面
2. 找到 **「QR Code」** 區塊
3. 使用 Line App 掃描 QR Code 加入 Bot

### 5.2 傳送測試訊息

1. 打開 Line App
2. 找到你剛加入的 Bot
3. 傳送任何文字訊息
4. Bot 應該會回覆：「你說: [你的訊息]\n我收到你的訊息了！」

### 5.3 檢查日誌

在終端視窗中，你應該能看到：

```
收到訊息: [你的訊息]
使用者 ID: [使用者ID]
```

## 常見問題

### Q: 為什麼一定要用 HTTPS？不能用 HTTP 嗎？

A: Line 的 webhook **必須使用 HTTPS**，這是安全性要求。所有隧道工具（ngrok、cloudflared、localtunnel）都會自動提供 HTTPS URL，所以直接使用即可。

### Q: ngrok 需要註冊嗎？

A: 是的，ngrok 從 2023 年起要求註冊免費帳號並設定 authtoken 才能使用。如果你不想註冊，可以使用 **Cloudflare Tunnel**（方案 B）或 **localtunnel**（方案 C），它們都不需要註冊。

## 常見問題

### Q: Webhook 驗證失敗？

A: 檢查以下項目：
- `.env` 檔案中的 `LINE_CHANNEL_SECRET` 是否正確
- Webhook URL 是否正確設定（必須是 HTTPS，且包含 `/api/webhook`）
- 隧道工具（ngrok/cloudflared/localtunnel）是否正在運行
- 開發伺服器（`npm run dev`）是否正常運行

### Q: Bot 沒有回覆訊息？

A: 檢查以下項目：
- 是否開啟了「Use webhook」開關
- 是否關閉了「Auto-reply messages」
- 檢查終端是否有錯誤訊息
- 確認 `LINE_CHANNEL_ACCESS_TOKEN` 是否正確設定

### Q: 收到 401 錯誤？

A: 這表示簽名驗證失敗，請確認：
- `LINE_CHANNEL_SECRET` 是否正確
- Webhook URL 是否正確設定

## 下一步

現在你已經成功串接 Line Bot 了！接下來可以：

1. 整合 LLM API（如 OpenAI、Claude 等）
2. 實作更複雜的對話邏輯
3. 建立對話歷史記錄
4. 開發管理後台

