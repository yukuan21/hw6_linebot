# OpenAI API Key 取得指南

這份文件將引導你完成 OpenAI API Key 的取得與設定。

## 前置準備

1. **OpenAI 帳號**：你需要一個 OpenAI 帳號才能取得 API Key
2. **付款方式**：OpenAI 需要綁定付款方式（信用卡）才能使用 API（即使是免費額度也需要）

## 第一步：註冊/登入 OpenAI 帳號

### 1.1 前往 OpenAI 平台

1. 開啟瀏覽器，前往 [OpenAI Platform](https://platform.openai.com/)
2. 如果你還沒有帳號，點擊 **「Sign up」** 註冊
3. 如果已有帳號，點擊 **「Log in」** 登入

### 1.2 註冊新帳號（如果需要的話）

1. 輸入你的 Email 地址
2. 設定密碼
3. 驗證 Email（檢查你的信箱並點擊驗證連結）
4. 完成註冊流程

## 第二步：設定付款方式

⚠️ **重要**：即使你想使用免費額度，OpenAI 仍需要你綁定付款方式。不過別擔心，新帳號通常有 $5 的免費額度可以使用。

### 2.1 前往 Billing 設定

1. 登入後，點擊右上角的個人頭像
2. 選擇 **「Settings」** 或 **「Billing」**
3. 或直接前往：https://platform.openai.com/account/billing

### 2.2 新增付款方式

1. 點擊 **「Add payment method」** 或 **「Add credit card」**
2. 輸入你的信用卡資訊
3. 完成驗證流程

> **注意**：OpenAI 可能會先進行小額驗證（通常會立即退還），這是正常的驗證流程。

## 第三步：建立 API Key

### 3.1 前往 API Keys 頁面

1. 點擊右上角的個人頭像
2. 選擇 **「API keys」**
3. 或直接前往：https://platform.openai.com/api-keys

### 3.2 建立新的 API Key

1. 點擊 **「Create new secret key」** 按鈕
2. 輸入一個名稱（例如：「Line Bot Key」）來識別這個 API Key
3. 點擊 **「Create secret key」**

### 3.3 複製並保存 API Key

⚠️ **非常重要**：API Key 只會顯示一次！請務必立即複製並妥善保存。

1. 複製顯示的 API Key（格式類似：`sk-...`）
2. 將它保存到安全的地方（例如：密碼管理器、文字檔）
3. 點擊 **「Done」** 完成

> **安全提醒**：
> - 不要將 API Key 分享給他人
> - 不要將 API Key 上傳到公開的 Git 倉庫
> - 如果 API Key 洩露，請立即刪除並建立新的

## 第四步：設定到專案中

### 4.1 建立或編輯 .env 檔案

在專案根目錄（與 `package.json` 同一層）建立或編輯 `.env` 檔案：

```bash
# 如果還沒有 .env 檔案，可以複製 env.example
cp env.example .env
```

### 4.2 加入 OpenAI API Key

開啟 `.env` 檔案，加入你的 API Key：

```env
# Line Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=你的 Channel Access Token
LINE_CHANNEL_SECRET=你的 Channel Secret
LINE_USER_ID=你的 User ID

# OpenAI 設定
OPENAI_API_KEY=sk-你的API Key在這裡

# 伺服器設定
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4.3 確認 .env 檔案已加入 .gitignore

確保 `.env` 檔案不會被上傳到 Git：

檢查 `.gitignore` 檔案中是否有：

```
.env
.env*.local
```

如果沒有，請加入這些規則。

## 第五步：驗證設定

### 5.1 重新啟動開發伺服器

```bash
npm run dev
```

### 5.2 測試 API Key

1. 在 Line 中傳送訊息給你的 Bot
2. 如果 Bot 能夠正常回應，表示 API Key 設定成功
3. 如果出現錯誤，檢查：
   - API Key 是否正確複製（沒有多餘的空格）
   - `.env` 檔案是否在正確的位置
   - 開發伺服器是否已重新啟動

## 常見問題

### Q1: 需要付費嗎？

A: OpenAI 提供免費額度（新帳號通常有 $5），但需要綁定付款方式。超過免費額度後才會收費。GPT-3.5-turbo 的費用相對便宜，$5 額度可以進行相當多的對話。

### Q2: API Key 遺失了怎麼辦？

A: 如果 API Key 遺失或洩露：
1. 前往 API Keys 頁面
2. 找到對應的 API Key
3. 點擊 **「Delete」** 刪除舊的 Key
4. 建立新的 API Key
5. 更新 `.env` 檔案中的 `OPENAI_API_KEY`

### Q3: 如何查看 API 使用量？

A: 前往 [Usage](https://platform.openai.com/usage) 頁面可以查看：
- 當前使用量
- 剩餘額度
- 使用歷史

### Q4: 如何設定使用限制？

A: 前往 [Limits](https://platform.openai.com/account/limits) 頁面可以設定：
- 每分鐘請求數限制
- 每月使用金額限制

### Q5: 出現 "insufficient_quota" 錯誤？

A: 這表示你的帳號額度已用盡。解決方法：
1. 前往 Billing 頁面檢查餘額
2. 如果需要，可以增加付款額度
3. 或等待下個計費週期重置

## 安全建議

1. **不要分享 API Key**：API Key 就像密碼一樣，不要分享給任何人
2. **使用環境變數**：永遠使用 `.env` 檔案儲存 API Key，不要寫死在程式碼中
3. **定期輪換**：定期更換 API Key 可以提高安全性
4. **監控使用量**：定期檢查 API 使用量，避免異常使用
5. **設定使用限制**：在 OpenAI 平台設定使用限制，避免意外超支

## 相關連結

- [OpenAI Platform](https://platform.openai.com/)
- [OpenAI API 文件](https://platform.openai.com/docs)
- [API Keys 管理](https://platform.openai.com/api-keys)
- [使用量查詢](https://platform.openai.com/usage)
- [計費設定](https://platform.openai.com/account/billing)

## 下一步

設定好 API Key 後，你可以：

1. 測試 Line Bot 的旅遊規劃功能
2. 根據需求調整 system prompt（在 `lib/openai-service.ts` 中）
3. 整合資料庫來持久化對話歷史
4. 建立管理後台來監控對話

祝你開發順利！🎉

