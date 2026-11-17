<a href="https://forgetfulengineer.github.io/">
  <img src="https://forgetfulengineer.github.io/img/avatar.png" alt="Logo" width="80">
</a>

# google-analytics-data-api-netlify

這是一個基於 [Google Analytics Data API (GA4)](https://developers.google.com/analytics/devguides/reporting/data/v1?hl=zh_TW) 建立的無伺服器 REST API，專為靜態網站（如 Hexo 部落格）設計。

部署於 [Netlify Functions](https://docs.netlify.com/functions/overview/) (v2)，無需自建伺服器，提供輕量查詢端點：

- **全站與單頁瀏覽量 (`GET /api/pageviews`)**：查詢全站累積 PV / UV，或指定文章路徑（`path`）之 PV。
- **熱門文章排行榜 (`GET /api/popular-posts`)**：依文章路徑過濾並回傳近 30 天與全時段熱門文章列表。

**繁體中文** | [English](./README.en.md)

---

## 功能特色

- 🚀 **快速部署**：整合 GitHub 與 Netlify，Push 即自動建置部署，零維護成本。
- 📊 **瀏覽量 API**：支援全站/單頁瀏覽量查詢功能。
- 📊 **排行榜 API**：支援熱門文章排行榜查詢功能。
- ⚡ **CDN 邊緣快取**：啟用 Netlify Durable CDN Cache（`s-maxage=21600`，快取 6 小時），搭配 Netlify Blobs 備援機制，大幅節省 GA4 呼叫配額並提供極速回應。
- 🛡️ **安全防護與頻率限制**：內建 Rate Limit（100 req/60s，依 IP 與網域彙總限制）與 CORS 來源白名單防護。
- 🎛️ **靈活功能開關**：支援透過環境變數獨立開啟或關閉特定 API 端點。

---

## 快速部署

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 啟用 **Google Analytics Data API**
   - 建立服務帳號（Service Account），並下載憑證金鑰（JSON 檔案）
2. 前往 [Google Analytics](https://analytics.google.com/)
   - 進入「管理」→「資源存取管理」，將服務帳號電子郵件加入使用者（需至少具備「檢視者」權限）
   - 記下 GA4 的 **Property ID**（純數字）
3. Fork 此專案至你的 GitHub 帳號
4. 前往 [Netlify](https://app.netlify.com/) 建立新專案，連結剛剛 fork 的 GitHub 倉庫
5. 設定環境變數（Project configuration → Environment variables）

| 變數名稱 | 必填 | 預設值 | 說明 |
| :--- | :---: | :--- | :--- |
| `PROPERTYID` | **是** | 無 | Google Analytics 4 Property ID（純數字，例如 `123456789`） |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | **是** | 無 | Google Cloud 服務帳號金鑰完整 JSON 字串（整段內容複製，請勿公開） |
| `STARTDATE` | **是** | 無 | 全站統計開始日期，格式 `YYYY-MM-DD`（例如 `2023-12-31`） |
| `ENDDATE` | **是** | 無 | 全站統計結束日期，例如 `today` 或 `YYYY-MM-DD` |
| `ALLOWED_ORIGINS` | 否 | `*` | 允許 CORS 跨來源請求的網域清單（以逗號分隔，例如 `https://example.com,https://blog.example.com`）。未設定時允許所有來源；設定後自動允許該清單與本地開發環境（`http://localhost:*`） |
| `PAGEPATH_REGEX` | 否 | `^/` | 過濾網站文章頁的正規表達式（例如 `^/(posts|articles)/.+`），同時用於熱門文章排行榜與瀏覽量 API 的路徑驗證 |
| `ENABLE_PAGEVIEW` | 否 | `true` | 是否啟用瀏覽量 API（`/api/pageviews`）。設為 `false` 時呼叫該端點將回傳 404 |
| `ENABLE_POPULAR` | 否 | `true` | 是否啟用熱門文章 API（`/api/popular-posts`）。設為 `false` 時呼叫該端點將回傳 404 |

> 📖 詳細圖文部署流程，請參考：[【API】使用 Google Analytics Data API 架設網站 PV/UV 查詢 API](https://forgetfulengineer.github.io/Backend/API/Building-a-Traffic-API-with-GA-Data-API/)

---

## API 快速上手

所有端點 Base URL 格式如下：
```text
https://your-site.netlify.app/api
```

- **標準回應信封格式**：
  ```json
  {
    "code": "SUCCESS",
    "message": "Query successful",
    "data": { ... }
  }
  ```
- **CDN 快取**：Netlify 邊緣 CDN 快取 6 小時（`s-maxage=21600`）。在快取期限內重複請求不會消耗 GA4 呼叫額度。
- **頻率限制**：每個 IP 與網域在 60 秒內上限 100 次請求。

### 1. 取得瀏覽量與訪客數 (`GET /api/pageviews`)

- **端點路徑**：`/api/pageviews`
- **查詢參數**：
  - `path`（選填，string）：欲查詢的頁面路徑（如 `/posts/hello-world/`）。若未帶此參數則僅回傳全站累積數據。

#### 查詢全站數據
```bash
curl "https://your-site.netlify.app/api/pageviews"
```

成功回應範例 (200 OK)：
```json
{
  "code": "SUCCESS",
  "message": "Query successful",
  "data": {
    "site": {
      "pageviews": 12500,
      "activeUsers": 3200
    }
  }
}
```

#### 查詢特定頁面數據（前端 fetch 範例）
```javascript
fetch('https://your-site.netlify.app/api/pageviews?path=/posts/hello-world/')
  .then((res) => res.json())
  .then((res) => {
    console.log('全站 PV:', res.data.site.pageviews);
    console.log('單頁 PV:', res.data.page?.pageviews);
  });
```

成功回應範例 (200 OK)：
```json
{
  "code": "SUCCESS",
  "message": "Query successful",
  "data": {
    "site": {
      "pageviews": 12500,
      "activeUsers": 3200
    },
    "page": {
      "path": "/posts/hello-world/",
      "pageviews": 150
    }
  }
}
```

---

### 2. 取得熱門文章排行榜 (`GET /api/popular-posts`)

- **端點路徑**：`/api/popular-posts`
- **查詢參數**：無（依環境變數 `PAGEPATH_REGEX` 自動過濾文章路徑）

#### 呼叫範例
```bash
curl "https://your-site.netlify.app/api/popular-posts"
```

或使用前端 fetch：
```javascript
fetch('https://your-site.netlify.app/api/popular-posts')
  .then((res) => res.json())
  .then((res) => {
    console.log('近 30 天熱門文章:', res.data.month);
    console.log('全時段熱門文章:', res.data.allTime);
  });
```

成功回應範例 (200 OK)：
```json
{
  "code": "SUCCESS",
  "message": "Query successful",
  "data": {
    "month": [
      { "path": "/posts/docker-guide/", "pageviews": 850 },
      { "path": "/posts/mysql-index/", "pageviews": 620 }
    ],
    "allTime": [
      { "path": "/posts/git-cheatsheet/", "pageviews": 5400 },
      { "path": "/posts/docker-guide/", "pageviews": 4300 }
    ]
  }
}
```

---

## 常見問題與注意事項 (FAQ)

<details>
<summary><b>如何設定 CORS 跨來源限制？</b></summary>

- 預設未設定 `ALLOWED_ORIGINS` 時，API 回應標頭為 `Access-Control-Allow-Origin: *`，允許任意來源跨域呼叫。
- 若設定 `ALLOWED_ORIGINS`（如 `https://example.com,https://blog.example.com`），僅允許名單中的網域以及本地開發環境（`http://localhost:*`）。未在名單中的來源請求將收到 403 Forbidden 回應。
</details>

<details>
<summary><b>資料更新頻率與快取機制為何？</b></summary>

- API 回應標頭包含 `Netlify-CDN-Cache-Control`，會在 Netlify CDN 快取 6 小時（`s-maxage=21600`）。在快取有效期間，相同請求直接由 CDN 邊緣節點回傳，不會重複消耗 GA4 API 配額。
- GA4 API 呼叫成功時，系統會同步將數據寫入 Netlify Blobs（`analytics-storage`）。若 GA4 API 服務異常或配額耗盡，系統會自動自 Blobs 讀取備援快取回傳，確保服務不中斷。
</details>

<details>
<summary><b>如何暫時停用特定 API 端點？</b></summary>

- 若不需要使用特定功能（例如不需要熱門文章排行），可在 Netlify 環境變數將 `ENABLE_POPULAR` 設為 `false`。
- 停用後該端點將直接回傳 404 Not Found，避免不必要的資源讀取。
</details>

<details>
<summary><b>常見錯誤排查說明</b></summary>

- **400 Bad Request**：請求參數驗證失敗（例如 `path` 格式不符）。
- **403 Forbidden**：CORS 檢查失敗，請求來源網域未包含在 `ALLOWED_ORIGINS` 白名單內。
- **404 Not Found**：端點路徑不存在，或該功能在環境變數已被設為 `false` 停用。
- **405 Method Not Allowed**：僅支援 `GET` 與 `OPTIONS` 請求，使用其他 HTTP Method 會回傳此錯誤。
- **503 Service Unavailable**：GA4 API 呼叫失敗且 Netlify Blobs 無可用備援快取。
</details>