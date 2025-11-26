# MongoDB Atlas 設定指南

這份文件將引導你完成 MongoDB Atlas 的設定，用於持久化儲存 Line Bot 的對話記錄。

## 前置準備

1. **MongoDB Atlas 帳號**：如果還沒有，請前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 註冊（免費層即可）

## 第一步：建立 MongoDB Atlas 叢集

### 1.1 註冊並登入 MongoDB Atlas

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. 使用 Email 或 Google/GitHub 帳號註冊
3. 完成註冊後登入

### 1.2 建立免費叢集

1. 登入後，點擊 **「Build a Database」** 或 **「Create」**
2. 選擇 **「FREE」** 方案（M0 Sandbox）
3. 選擇雲端提供商和區域（建議選擇離你最近的區域）
4. 為叢集命名（例如：`line-bot-cluster`）
5. 點擊 **「Create Deployment」**

### 1.3 設定資料庫使用者

1. 在「Security」>「Database Access」頁面
2. 點擊 **「Add New Database User」**
3. 選擇 **「Password」** 認證方式
4. 輸入使用者名稱和密碼（請妥善保存）
5. 設定使用者權限為 **「Atlas Admin」** 或 **「Read and write to any database」**
6. 點擊 **「Add User」**

### 1.4 設定網路訪問白名單

1. 在「Security」>「Network Access」頁面
2. 點擊 **「Add IP Address」**
3. 為了方便開發，可以選擇：
   - **「Allow Access from Anywhere」**（選擇此選項會顯示 `0.0.0.0/0`）
   - 或手動輸入你的 IP 位址
4. 點擊 **「Confirm」**

⚠️ **注意**：允許從任何地方訪問（`0.0.0.0/0`）僅適合開發階段。生產環境請設定特定的 IP 位址。

## 第二步：取得連接字串

### 2.1 取得連接字串

1. 在 MongoDB Atlas 儀表板，點擊 **「Connect」** 按鈕（在你的叢集旁邊）
2. 選擇 **「Connect your application」**
3. 選擇驅動程式為 **「Node.js」**，版本選擇最新的穩定版本
4. 複製顯示的連接字串，格式類似：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 2.2 替換連接字串中的佔位符

將連接字串中的：
- `<username>` 替換為你在步驟 1.3 設定的資料庫使用者名稱
- `<password>` 替換為你在步驟 1.3 設定的密碼
- 在連接字串的最後（`?retryWrites=true&w=majority` 之前）添加資料庫名稱，例如：`/line-bot-db`

完整範例：
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/line-bot-db?retryWrites=true&w=majority
```

## 第三步：設定環境變數

### 3.1 更新 .env 檔案

1. 在專案根目錄找到 `.env` 檔案（如果沒有，複製 `env.example`）
2. 添加 MongoDB 連接字串：

```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/line-bot-db?retryWrites=true&w=majority
```

⚠️ **重要**：
- 請確保密碼中的特殊字元經過 URL 編碼（例如：`@` 要編碼為 `%40`）
- 不要在連接字串前後添加引號
- 請妥善保管連接字串，不要提交到公開的 Git 儲存庫

### 3.2 驗證設定

重新啟動開發伺服器：

```bash
npm run dev
```

如果設定正確，應該會在終端看到：
```
✅ MongoDB 連接成功
```

如果出現錯誤，請檢查：
1. 連接字串格式是否正確
2. 使用者名稱和密碼是否正確
3. IP 白名單是否已設定
4. 網路連接是否正常

## 第四步：測試資料庫功能

### 4.1 測試對話儲存

1. 在 Line 中向 Bot 發送訊息
2. 檢查 MongoDB Atlas 儀表板：
   - 進入「Database」>「Browse Collections」
   - 應該會看到 `conversations` 和 `messages` 兩個集合
   - 點擊集合可以看到儲存的對話和訊息記錄

### 4.2 檢查資料結構

**conversations 集合**包含：
- `_id`: 對話 ID
- `userId`: LINE 使用者 ID
- `createdAt`: 建立時間
- `updatedAt`: 更新時間
- `title`: 對話標題（可選）
- `messageCount`: 訊息數量

**messages 集合**包含：
- `_id`: 訊息 ID
- `conversationId`: 關聯的對話 ID
- `userId`: LINE 使用者 ID
- `role`: 訊息角色（user/assistant/system）
- `content`: 訊息內容
- `timestamp`: 訊息時間

## 常見問題

### Q: 連接失敗，顯示 "authentication failed"
**A:** 檢查使用者名稱和密碼是否正確，並確認密碼中的特殊字元已正確編碼。

### Q: 連接失敗，顯示 "IP not whitelisted"
**A:** 確認你的 IP 位址已添加到 MongoDB Atlas 的網路訪問白名單中。

### Q: 無法看到資料庫和集合
**A:** 
1. 確保已發送過訊息並產生對話記錄
2. 在「Browse Collections」中點擊「Load Sample Dataset」（如果是第一次使用，可能需要先載入示例資料）
3. 確認資料庫名稱正確

### Q: 如何清除測試資料？
**A:** 在 MongoDB Atlas 儀表板中，可以手動刪除集合或使用 MongoDB Compass 等工具。或在程式碼中調用 `clearUserConversations` 函數。

## 安全建議

1. **生產環境**：
   - 使用環境變數管理連接字串，不要硬編碼
   - 設定特定的 IP 白名單，不要使用 `0.0.0.0/0`
   - 定期更換資料庫密碼

2. **連接字串安全**：
   - 不要將 `.env` 檔案提交到 Git
   - 在 `.gitignore` 中確保已包含 `.env`
   - 使用不同的資料庫使用者帳號區分開發和生產環境

## 下一步

設定完成後，你的 Line Bot 現在可以：
- ✅ 持久化儲存所有對話記錄
- ✅ 在伺服器重啟後保留對話歷史
- ✅ 支援多使用者同時使用
- ✅ 查詢和分析對話資料

如需更多資訊，請參考：
- [MongoDB Atlas 官方文檔](https://docs.atlas.mongodb.com/)
- [Mongoose 官方文檔](https://mongoosejs.com/docs/)

