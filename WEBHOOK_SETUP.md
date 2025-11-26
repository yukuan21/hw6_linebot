# Line Bot Webhook 設定步驟

## 你已經完成的部分 ✅

- ✅ 取得 ngrok URL（例如：`https://xxxx-xx-xx-xx-xx.ngrok.io`）
- ✅ ngrok 正在運行

## 接下來要做的步驟

### 步驟 1：確認開發伺服器正在運行

確保你的 Next.js 開發伺服器正在運行：

```bash
npm run dev
```

應該看到：
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

### 步驟 2：確認 Webhook URL 格式

你的完整 webhook URL 應該是：

```
https://你的ngrok網址.ngrok.io/api/webhook
```

例如：
- Ngrok URL：`https://abc123.ngrok.io`
- Webhook URL：`https://abc123.ngrok.io/api/webhook`

### 步驟 3：在 Line Developers Console 設定 Webhook

1. **登入 Line Developers Console**
   - 前往：https://developers.line.biz/console/
   - 登入你的帳號

2. **選擇你的 Channel**
   - 點擊你的 Provider
   - 選擇你的 Channel（Messaging API 類型）

3. **進入 Messaging API 設定**
   - 點擊 **「Messaging API」** 頁籤
   - 找到 **「Webhook URL」** 區塊

4. **設定 Webhook URL**
   - 在 **「Webhook URL」** 欄位中輸入：`https://你的ngrok網址.ngrok.io/api/webhook`
   - 點擊 **「Update」** 按鈕儲存

5. **驗證 Webhook**
   - 點擊 **「Verify」** 按鈕
   - 應該會顯示綠色的 **「Success」** 或 **「✓」** 標記
   - 如果失敗，請檢查：
     - ngrok 是否正在運行
     - 開發伺服器是否正在運行（`npm run dev`）
     - URL 格式是否正確（必須包含 `/api/webhook`）

6. **開啟 Webhook 功能**
   - 找到 **「Use webhook」** 開關
   - **將它開啟**（很重要！）

7. **關閉自動回覆**
   - 找到 **「Auto-reply messages」** 區塊
   - **將它關閉**（這樣 Bot 才會使用你的 webhook 邏輯）
   - 找到 **「Greeting messages」** 區塊（如果有）
   - **將它關閉**

### 步驟 4：測試 Webhook

1. **取得 Bot 的 QR Code**
   - 在 Line Developers Console 的 Channel 頁面
   - 找到 **「QR Code」** 區塊
   - 使用 Line App 掃描 QR Code 加入 Bot

2. **傳送測試訊息**
   - 打開 Line App
   - 找到你剛加入的 Bot
   - 傳送任何文字訊息（例如：「你好」）

3. **檢查回覆**
   - Bot 應該會回覆：「你說: [你的訊息]\n我收到你的訊息了！」

4. **檢查終端日誌**
   - 在運行 `npm run dev` 的終端視窗中
   - 你應該會看到：
     ```
     收到訊息: [你的訊息]
     使用者 ID: [使用者ID]
     ```

## 常見問題排查

### ❌ Webhook 驗證失敗

**可能原因：**
- ngrok 未運行 → 重新啟動 `ngrok http 3000`
- 開發伺服器未運行 → 執行 `npm run dev`
- URL 格式錯誤 → 確認包含 `/api/webhook`
- 環境變數未設定 → 檢查 `.env` 檔案

**解決方法：**
1. 確認兩個終端視窗都在運行：
   - 一個運行 `npm run dev`
   - 一個運行 `ngrok http 3000`
2. 檢查 webhook URL 是否可訪問：
   ```bash
   curl https://你的ngrok網址.ngrok.io/api/webhook
   ```
   應該會看到：`{"message":"Line Bot Webhook 端點運行中",...}`

### ❌ Bot 沒有回覆訊息

**可能原因：**
- 「Use webhook」未開啟
- 「Auto-reply messages」未關閉
- 環境變數中的 `LINE_CHANNEL_ACCESS_TOKEN` 錯誤
- Webhook 處理發生錯誤

**解決方法：**
1. 確認 Line Developers Console 中的設定：
   - 「Use webhook」：**開啟**
   - 「Auto-reply messages」：**關閉**
2. 檢查終端是否有錯誤訊息
3. 檢查 `.env` 檔案中的 `LINE_CHANNEL_ACCESS_TOKEN` 是否正確

### ❌ 收到 401 錯誤（簽名驗證失敗）

**可能原因：**
- `LINE_CHANNEL_SECRET` 設定錯誤

**解決方法：**
1. 檢查 `.env` 檔案中的 `LINE_CHANNEL_SECRET` 是否正確
2. 確認 Channel Secret 是否與 Line Developers Console 中的一致

## 成功標誌 ✅

當你看到以下情況時，表示設定成功：

- ✅ Webhook URL 驗證顯示「Success」
- ✅ Bot 可以回覆你的訊息
- ✅ 終端顯示收到的訊息日誌
- ✅ 沒有錯誤訊息

## 下一步

現在你的 Line Bot 已經成功串接了！接下來可以：

1. 整合 LLM API（OpenAI、Claude 等）
2. 實作更複雜的對話邏輯
3. 建立對話歷史記錄功能
4. 開發管理後台介面

