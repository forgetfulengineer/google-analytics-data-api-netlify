<a href="https://forgetfulengineer.github.io/">
  <img src="https://forgetfulengineer.github.io/img/avatar.png" alt="Logo" width="80">
</a>

# google-analytics-data-api-netlify

這是一個基於 [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1?hl=zh_TW) 建立的查詢 API，適合靜態網站使用，可查詢：

- 全站累積 PV（Page Views）與 UV（Unique Visitors）
- 特定頁面（path）的 PV

此 API 使用 [Netlify Functions](https://docs.netlify.com/functions/overview/) 架設，無需額外伺服器

**繁體中文** | [English](./README.en.md)

---

## 功能特色

- 🚀 **快速部署**：整合 GitHub + Netlify，自動部署 API
- 🔧 **彈性查詢**：可查詢整站 PV/UV 或指定頁面 PV
- 📅 **可設定日期範圍**：支援自訂起始與結束查詢時間
- ☁️ **無伺服器支援**：適用於無後端的純靜態網站

## 快速部屬

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
  - 啟用 `Google Analytics Data API`
  - 建立服務帳號，下載金鑰（JSON）
2. 前往 [Google Analytics](https://analytics.google.com/)
  - 將服務帳號加入 GA 資源存取管理
  - 取得 GA 的 Property ID
3. Fork 此專案至你的 GitHub 帳號
4. 前往 [Netlify](https://app.netlify.com/) 建立新專案，連結剛剛 fork 的 GitHub 倉庫
5. 設定環境變數（Site Settings → Environment Variables）

    | 名稱 | 說明 |
    |------|------|
    | `PROPERTYID` | GA Property ID |
    | `GOOGLE_APPLICATION_CREDENTIALS_JSON` | GA 服務帳號金鑰內容（請勿公開） |
    | `STARTDATE` | 開始統計的日期，如 `2023-12-31` |
    | `ENDDATE` | 結束統計的日期，如 `today` |

> 詳細部屬流程，請查看 [【API】使用 Google Analytics Data API 架設網站 PV/UV 查詢 API](https://forgetfulengineer.github.io/Backend/API/Building-a-Traffic-API-with-GA-Data-API/)

## API 使用方式

### 參數說明

| 參數名稱 | 是否必填 | 說明 | 範例 |
|----------|----------|------|------|
| `path` | 否 | 欲查詢的單篇頁面路徑 | `/Backend/MySQL/DQL-Execution-Order/` |

### 查詢全站 PV/UV

GET `https://{your-site}.netlify.app/.netlify/functions/pageview`

回傳格式

```json json
{
  "pv": string,
  "uv": string
}
```

#### 範例

GET `https://ga-api-demo.netlify.app/.netlify/functions/pageview`

回傳格式

```json json
{
  "pv": "8888",
  "uv": "1234"
}
```

### 查詢特定路徑 PV

GET `https://{your-site}.netlify.app/.netlify/functions/pageview?path={your-path}`

回傳格式

```json json
{
  "pv": string,
  "uv": string,
  "path": string,
  "pageViews": string
}
```

#### 範例

GET `https://ga-api-demo.netlify.app/.netlify/functions/pageview?path=/Backend/MySQL/DQL-Execution-Order/`

回傳格式

```json json
{
  "pv": "8888",
  "uv": "1234",
  "path": "/Backend/MySQL/DQL-Execution-Order/",
  "pageViews": "100"
}
```

## 補充說明

- 部署在 [Netlify Functions](https://docs.netlify.com/functions/overview/)，採用 Node.js 撰寫，並且 `.js` 檔案會被 Netlify 包裝成可被呼叫的 API 端點（Function Endpoint），當收到請求時，自動呼叫匯出的 `handler` 函式，不需要額外設定伺服器或手動執行函式。
- 使用 npm 的 [`@google-analytics/data`](https://www.npmjs.com/package/@google-analytics/data) 套件串接 [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1?hl=zh_TW)，使用套件的 [`batchRunReports`](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/batchRunReports?hl=zh-tw) 搭配環境變數讀取設定來查詢 GA 的資料。
- 使用 `async/await` 語法來處理非同步資料請求。`await` 可暫停函式執行直到 `Promise` 結果回傳，讓程式接近同步流程。
- 回應中包含 HTTP 標頭 `{ 'Access-Control-Allow-Origin': '*' }`，用來允許跨來源請求（CORS），這樣能夠從不同網域（例如部署在 GitHub Pages 的前端網站）向此 API 發送請求，否則瀏覽器會因同源政策（Same-Origin Policy）而阻擋請求。