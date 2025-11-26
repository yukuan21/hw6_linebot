# Ngrok 設定指南

## 錯誤原因說明

當你執行 `ngrok http 3000` 時，出現以下錯誤：

```
ERROR: authentication failed: Usage of ngrok requires a verified account and authtoken.
```

**錯誤原因**：
- Ngrok 從 2023 年起，要求所有使用者必須註冊帳號並設定 authtoken
- 這是為了安全性考量，防止未授權的使用
- 你還沒有在本地設定 authtoken，所以無法使用

## 解決步驟

### 步驟 1：註冊 Ngrok 帳號（如果還沒有）

1. 前往：https://dashboard.ngrok.com/signup
2. 使用 Email 或 GitHub/Google 帳號註冊
3. 完成 Email 驗證（如果需要）

### 步驟 2：取得 Authtoken

1. 登入 Ngrok Dashboard：https://dashboard.ngrok.com/get-started/your-authtoken
2. 你會看到一個 authtoken，格式類似：`2xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **複製這個 authtoken**（只會顯示一次，請妥善保存）

### 步驟 3：設定 Authtoken

在你的終端執行以下命令（將 `<你的authtoken>` 替換成步驟 2 複製的 token）：

```bash
ngrok config add-authtoken <你的authtoken>
```

例如：
```bash
ngrok config add-authtoken 2xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 步驟 4：驗證設定

執行以下命令確認設定成功：

```bash
ngrok config check
```

如果看到類似以下訊息，表示設定成功：
```
Authtoken saved to configuration file: /Users/你的用戶名/Library/Application Support/ngrok/ngrok.yml
```

### 步驟 5：啟動 Ngrok

現在可以正常啟動 ngrok 了：

```bash
ngrok http 3000
```

你應該會看到類似以下的輸出：

```
Session Status                online
Account                       你的Email (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxx-xx-xx-xx-xx.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

## 快速指令參考

```bash
# 設定 authtoken
ngrok config add-authtoken <你的authtoken>

# 檢查設定
ngrok config check

# 啟動隧道
ngrok http 3000

# 停止隧道
按 Ctrl + C
```

## 注意事項

- Authtoken 只需要設定一次，之後會保存在配置檔案中
- 免費帳號有使用限制，但對開發測試足夠使用
- Ngrok 提供的 URL 在每次啟動時可能不同（除非使用固定域名）




