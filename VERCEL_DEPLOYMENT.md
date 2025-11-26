# Vercel 部署指南

本指南將協助您將 Line Bot Webhook 後端和管理後台部署到 Vercel。

## 目錄

- [前置準備](#前置準備)
- [步驟一：準備 GitHub 儲存庫](#步驟一準備-github-儲存庫)
- [步驟二：在 Vercel 建立專案](#步驟二在-vercel-建立專案)
- [步驟三：設定環境變數](#步驟三設定環境變數)
- [步驟四：部署專案](#步驟四部署專案)
- [步驟五：更新 Line Webhook URL](#步驟五更新-line-webhook-url)
- [步驟六：驗證部署](#步驟六驗證部署)
- [常見問題](#常見問題)

---

## 前置準備

在開始部署之前，請確保您已經準備好以下項目：

1. **GitHub 帳號**：用於存放程式碼
2. **Vercel 帳號**：前往 [vercel.com](https://vercel.com) 註冊（可使用 GitHub 帳號登入）
3. **Line Bot 憑證**：
   - Channel Access Token
   - Channel Secret
   - User ID（可選）
4. **OpenAI API Key**：用於 LLM 功能
5. **MongoDB Atlas 連接字串**：用於資料庫儲存

---

## 步驟一：準備 GitHub 儲存庫

### 1.1 確保程式碼已推送到 GitHub

如果您的程式碼尚未推送到 GitHub，請執行以下步驟：

```bash
# 初始化 Git（如果尚未初始化）
git init

# 添加所有檔案
git add .

# 提交變更
git commit -m "準備部署到 Vercel"

# 在 GitHub 建立新儲存庫後，添加遠端儲存庫
git remote add origin https://github.com/你的使用者名稱/hw6.git

# 推送到 GitHub
git push -u origin main
```

### 1.2 確認 .gitignore 已正確設定

確保 `.gitignore` 檔案包含以下內容，避免將敏感資訊推送到 GitHub：

```
.env
.env*.local
.vercel
node_modules
```

---

## 步驟二：在 Vercel 建立專案

### 2.1 登入 Vercel

1. 前往 [vercel.com](https://vercel.com)
2. 使用 GitHub 帳號登入（推薦）或建立新帳號

### 2.2 建立新專案

1. 登入後，點擊 **「Add New...」** → **「Project」**
2. 選擇您的 GitHub 儲存庫（`hw6`）
3. 如果找不到儲存庫，點擊 **「Import Git Repository」** 並授權 Vercel 存取您的 GitHub

### 2.3 設定專案

在專案設定頁面：

- **Framework Preset**：選擇 **Next.js**（應該會自動偵測）
- **Root Directory**：保持為 `./`（如果專案在根目錄）
- **Build Command**：`npm run build`（預設值，通常不需要修改）
- **Output Directory**：`.next`（預設值，通常不需要修改）
- **Install Command**：`npm install`（預設值，通常不需要修改）

**先不要點擊 Deploy！** 我們需要先設定環境變數。

---

## 步驟三：設定環境變數

在 Vercel 專案設定中，需要設定以下環境變數：

### 3.1 進入環境變數設定頁面

在專案設定頁面，找到 **「Environment Variables」** 區塊。

### 3.2 添加環境變數

點擊 **「Add」** 按鈕，逐一添加以下環境變數：

#### Line Bot 設定

```
名稱：LINE_CHANNEL_ACCESS_TOKEN
值：你的 Channel Access Token
環境：Production, Preview, Development（全部勾選）
```

```
名稱：LINE_CHANNEL_SECRET
值：你的 Channel Secret
環境：Production, Preview, Development（全部勾選）
```

```
名稱：LINE_USER_ID
值：你的 User ID（可選）
環境：Production, Preview, Development（全部勾選）
```

#### OpenAI 設定

```
名稱：OPENAI_API_KEY
值：你的 OpenAI API Key
環境：Production, Preview, Development（全部勾選）
```

#### MongoDB 設定

```
名稱：MONGODB_URI
值：你的 MongoDB Atlas 連接字串
格式：mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
環境：Production, Preview, Development（全部勾選）
```

#### 伺服器設定

```
名稱：NEXT_PUBLIC_BASE_URL
值：https://your-project.vercel.app（部署後會自動產生，可以先留空或使用預設值）
環境：Production, Preview, Development（全部勾選）
```

**注意**：`NEXT_PUBLIC_BASE_URL` 在首次部署後，您需要回到這裡更新為實際的 Vercel URL。

### 3.3 重要提醒

- **不要**在環境變數值中包含引號（`"` 或 `'`）
- 確保所有環境變數都已正確設定，特別是 `MONGODB_URI` 和 `OPENAI_API_KEY`
- 環境變數設定後，需要重新部署才會生效

---

## 步驟四：部署專案

### 4.1 開始部署

1. 確認所有環境變數都已設定完成
2. 點擊 **「Deploy」** 按鈕
3. Vercel 會開始建置和部署您的專案

### 4.2 等待部署完成

部署過程通常需要 1-3 分鐘，您可以在 Vercel 儀表板看到部署進度：

- **Building**：正在建置專案
- **Deploying**：正在部署到 Vercel 的 CDN
- **Ready**：部署完成

### 4.3 取得部署 URL

部署完成後，您會看到：

- **Production URL**：`https://your-project.vercel.app`
- **Preview URL**：`https://your-project-git-main.vercel.app`（用於預覽分支）

**複製 Production URL**，稍後會用到。

---

## 步驟五：更新 Line Webhook URL

### 5.1 更新 Vercel 環境變數

1. 回到 Vercel 專案設定頁面
2. 找到 `NEXT_PUBLIC_BASE_URL` 環境變數
3. 將值更新為您的 Production URL（例如：`https://your-project.vercel.app`）
4. 點擊 **「Save」**
5. **重要**：需要重新部署才能讓環境變數生效
   - 前往 **「Deployments」** 頁籤
   - 找到最新的部署
   - 點擊 **「Redeploy」** → **「Redeploy」**

### 5.2 更新 Line Developer Console

1. 前往 [Line Developers Console](https://developers.line.biz/console/)
2. 選擇您的 Channel
3. 進入 **「Messaging API」** 頁籤
4. 找到 **「Webhook URL」** 區塊
5. 輸入您的 webhook URL：
   ```
   https://your-project.vercel.app/api/webhook
   ```
6. 點擊 **「Update」** 儲存
7. 點擊 **「Verify」** 按鈕驗證 webhook（應該會顯示 Success）
8. **重要**：確保 **「Use webhook」** 開關已開啟

### 5.3 設定 MongoDB Atlas 網路存取

為了讓 Vercel 能夠連接到 MongoDB Atlas，您需要：

1. 前往 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 進入您的專案
3. 點擊 **「Network Access」**（網路存取）
4. 點擊 **「Add IP Address」**
5. 選擇 **「Allow Access from Anywhere」**（允許從任何地方存取）
   - 或添加 `0.0.0.0/0` 到 IP 白名單
6. 點擊 **「Confirm」**

**注意**：允許從任何地方存取在生產環境中是可以接受的，因為 MongoDB Atlas 已經有身份驗證保護。

---

## 步驟六：驗證部署

### 6.1 檢查首頁

1. 訪問您的 Production URL：`https://your-project.vercel.app`
2. 確認首頁正常顯示
3. 確認 webhook URL 正確顯示

### 6.2 檢查 Webhook 端點

1. 訪問：`https://your-project.vercel.app/api/webhook`
2. 應該會看到 JSON 回應：
   ```json
   {
     "message": "Line Bot Webhook 端點運行中",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

### 6.3 檢查管理後台

1. 訪問：`https://your-project.vercel.app/admin`
2. 確認管理後台可以正常載入
3. 確認可以查看對話紀錄（如果有資料）

### 6.4 測試 Line Bot

1. 在 Line App 中找到您的 Bot
2. 傳送測試訊息
3. 確認 Bot 可以正常回覆
4. 確認訊息已儲存到資料庫（可在管理後台查看）

---

## 常見問題

### Q1: 部署失敗，顯示建置錯誤

**可能原因：**
- 環境變數未正確設定
- 程式碼有語法錯誤
- 依賴套件安裝失敗

**解決方法：**
1. 檢查 Vercel 部署日誌中的錯誤訊息
2. 確認所有環境變數都已設定
3. 在本地執行 `npm run build` 測試建置是否成功
4. 確認 `package.json` 中的依賴套件版本正確

### Q2: Webhook 驗證失敗

**可能原因：**
- Webhook URL 不正確
- Vercel 部署尚未完成
- 環境變數 `NEXT_PUBLIC_BASE_URL` 未正確設定

**解決方法：**
1. 確認 Webhook URL 格式正確：`https://your-project.vercel.app/api/webhook`
2. 確認 Vercel 部署狀態為 **Ready**
3. 確認 `NEXT_PUBLIC_BASE_URL` 環境變數已設定並重新部署
4. 檢查 `/api/webhook` GET 端點是否可以正常訪問

### Q3: MongoDB 連接失敗

**可能原因：**
- MongoDB Atlas 網路存取設定不正確
- `MONGODB_URI` 環境變數格式錯誤
- MongoDB 帳號密碼錯誤

**解決方法：**
1. 確認 MongoDB Atlas 允許從任何 IP 存取（`0.0.0.0/0`）
2. 確認 `MONGODB_URI` 格式正確，不包含引號
3. 確認 MongoDB 使用者名稱和密碼正確
4. 檢查 Vercel 部署日誌中的 MongoDB 連接錯誤訊息

### Q4: OpenAI API 呼叫失敗

**可能原因：**
- `OPENAI_API_KEY` 環境變數未設定或錯誤
- OpenAI API 配額用盡
- 網路連線問題

**解決方法：**
1. 確認 `OPENAI_API_KEY` 環境變數已正確設定
2. 檢查 OpenAI 帳號餘額和配額
3. 查看 Vercel 部署日誌中的錯誤訊息
4. 確認錯誤處理機制正常運作（應該會顯示友善的錯誤訊息）

### Q5: 管理後台無法載入資料

**可能原因：**
- MongoDB 連接失敗
- API 路由錯誤
- 資料庫中沒有資料

**解決方法：**
1. 確認 MongoDB 連接正常
2. 檢查瀏覽器開發者工具的 Network 標籤，查看 API 請求是否成功
3. 確認 `/api/admin/conversations` 和 `/api/admin/messages` 端點可以正常訪問
4. 確認資料庫中已有對話資料

### Q6: 環境變數更新後沒有生效

**解決方法：**
1. 環境變數更新後，必須重新部署才會生效
2. 前往 **「Deployments」** 頁籤
3. 點擊最新部署的 **「⋯」** 選單
4. 選擇 **「Redeploy」**

### Q7: 如何查看部署日誌？

1. 在 Vercel 專案頁面
2. 點擊 **「Deployments」** 頁籤
3. 選擇特定的部署
4. 點擊 **「View Function Logs」** 或 **「View Build Logs」**

### Q8: 如何設定自訂網域？

1. 在 Vercel 專案設定頁面
2. 進入 **「Domains」** 頁籤
3. 輸入您的網域
4. 按照指示設定 DNS 記錄
5. 等待 DNS 傳播完成（通常需要幾分鐘到幾小時）

---

## 後續維護

### 自動部署

Vercel 會自動監控您的 GitHub 儲存庫，當您推送新的程式碼到 `main` 分支時，會自動觸發新的部署。

### 手動重新部署

如果需要手動重新部署：

1. 前往 Vercel 專案頁面
2. 點擊 **「Deployments」** 頁籤
3. 找到要重新部署的版本
4. 點擊 **「⋯」** 選單
5. 選擇 **「Redeploy」**

### 監控和日誌

- **Function Logs**：查看 serverless functions 的執行日誌
- **Analytics**：查看網站流量和分析
- **Speed Insights**：查看網站效能指標

---

## 總結

完成以上步驟後，您的 Line Bot 應該已經成功部署到 Vercel：

- ✅ Webhook 後端：`https://your-project.vercel.app/api/webhook`
- ✅ 管理後台：`https://your-project.vercel.app/admin`
- ✅ 首頁：`https://your-project.vercel.app`

如果遇到任何問題，請參考 [Vercel 文件](https://vercel.com/docs) 或檢查部署日誌。

祝部署順利！🎉

