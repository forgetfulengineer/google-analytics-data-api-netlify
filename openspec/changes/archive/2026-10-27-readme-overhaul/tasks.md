## 1. 重寫 README.md（繁體中文）

- [x] 1.1 重寫專案標題、簡介與功能特色區塊（`README.md`）：簡介須涵蓋兩支 API（`pageviews` + `popular-posts`），功能特色須包含 CDN 快取、Rate Limit、功能開關、CORS 限制。驗證：文件中不包含舊版描述（`.js`、`handler`、Node.js 舊述），且特色列表至少涵蓋上述四項新機制。

- [x] 1.2 重寫快速部署章節（`README.md`）：環境變數表格擴充為 7 個（`PROPERTYID`、`GOOGLE_APPLICATION_CREDENTIALS_JSON`、`STARTDATE`、`ENDDATE`、`ALLOWED_ORIGINS`、`ENABLE_PAGEVIEW`/`ENABLE_POPULAR`、`PAGEPATH_REGEX`），分必填與選填欄位，說明預設值與用途。驗證：表格包含所有 7 個環境變數，與 `src/schemas/envSchema.ts` 及 `.env.example` 一致。

- [x] 1.3 撰寫 API 通用說明區塊（`README.md`）：涵蓋 Base URL 組成方式（`https://your-site.netlify.app/api/...`）、標準成功回應信封 `{ code, message, data }`、CDN 快取行為（`s-maxage=21600`）、Rate Limit（100 req/60s per IP+domain）。明確依循 Quick Start 導向，僅說明核心機制，不展開所有 HTTP 錯誤碼 Schema。驗證：所述格式與 `utils/response.ts` 的 `successResponse` 函式輸出結構一致。

- [x] 1.4 撰寫 `GET /api/pageviews` 快速上手區塊（`README.md`）：包含用途、HTTP Method、路徑、常用 query parameter `path`（選填，string）、Happy Path 200 成功回應 JSON 片段（`data.site.pageviews`、`data.site.activeUsers`；帶 path 時追加 `data.page.path`、`data.page.pageviews`）、fetch 呼叫範例。驗證：路徑為 `/api/pageviews`（與 `functions/pageviews.ts` 一致），回應欄位與 `src/repositories/analyticsRepository.ts` 的 `PageviewsResponse` 介面一致，且不展開 4xx/5xx 錯誤信封，不提及 Swagger 預留或建置中字樣。

- [x] 1.5 撰寫 `GET /api/popular-posts` 快速上手區塊（`README.md`）：包含用途、HTTP Method、路徑、無 query parameter、Happy Path 200 成功回應 JSON 片段（`data.month[]` 與 `data.allTime[]`，各含 `path` 和 `pageviews`）、fetch 呼叫範例。驗證：路徑為 `/api/popular-posts`（與 `functions/popular-posts.ts` 一致），回應欄位與 `src/repositories/analyticsRepository.ts` 的 `PopularPostsResponse` 介面一致，且不展開錯誤信封，不提及 Swagger 預留或建置中字樣。

- [x] 1.6 移除舊「API 使用方式」與「補充說明」章節，新增 FAQ / 注意事項區塊（`README.md`）：使用 `<details>` 折疊，涵蓋 CORS 設定說明、功能開關用法、資料更新頻率（CDN 快取 6 小時 + Blobs fallback）、常見問題排查（如 403 CORS 阻擋）。驗證：文件中不存在 `## API 使用方式` 或 `## 補充說明` 標題；FAQ 中 CORS 行為描述與 `utils/cors.ts` 的 `checkOrigin` 邏輯一致。

- [x] 1.7 移除所有舊版路徑與 demo URL（`README.md`）：搜尋並確認文件中不再包含 `/.netlify/functions/pageview`、`ga-api-demo`、舊版扁平回應格式（`"pv"`、`"uv"`、`"pageViews"`）。驗證：在完成後的 `README.md` 中 grep 上述字串，結果為零。

## 2. 同步重寫 README.en.md（英文）

- [x] 2.1 重寫 README.en.md 全部內容，使其與 README.md 在章節結構、技術資訊、API 快速上手範例、環境變數及 FAQ 方面完全一致（`README.en.md`）。使用自然的技術英文，不包含中文標題，不提及 Swagger 預留或建置中字樣。驗證：兩份文件的 API 路徑、環境變數名稱、成功回應 JSON 結構完全相同；英文版不包含中文標題（如 `#### 範例`）。

- [x] 2.2 移除 README.en.md 中所有舊版路徑與 demo URL：確認不包含 `/.netlify/functions/pageview`、`ga-api-demo`、舊版扁平回應格式。驗證：在完成後的 `README.en.md` 中 grep 上述字串，結果為零。

## 3. 最終驗證

- [x] 3.1 交叉驗證兩份 README 的一致性：比對中英文版的 API 清單（路徑、method、參數、成功回應結構）、環境變數表格、部署步驟、FAQ 內容，確認技術資訊無差異，且兩者均無 Swagger 預告文字或冗餘錯誤信封。驗證：逐項比對 API 路徑數量、環境變數數量，中英文版完全吻合。

- [x] 3.2 驗證 Markdown 格式正確性：確認標題層級連續（不跳級）、程式碼區塊語言標記正確（`json` 而非 `json json`）、內部錨點連結可用、外部連結有效。驗證：Markdown 中不存在 ````json json```` 標記；所有章節連結指向存在的標題。

