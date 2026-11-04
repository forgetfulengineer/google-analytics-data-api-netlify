## 1. Schema 與 Repository 基礎建設

- [x] 1.1 建立 Zod 驗證架構 `src/schemas/pageviews.schema.ts` 以實現 `Query Parameter Validation` 與滿足 `Interface / Data Shape`
  - **Behavior**: 定義 `PageviewsQuerySchema` 驗證請求參數中的 `path`。當傳入無效的 `path` (如非字串) 時，Zod 必須解析失敗。
  - **Verification**: 執行 `npx tsx scratch/test-pageviews-schema.ts` 驗證 schema 的解析，確保當輸入 `path` 為字串時解析成功，而輸入非字串時拋出 zod 驗證錯誤。
- [x] 1.2 實作 `src/repositories/analyticsRepository.ts` 以實現 `Dynamic GA4 Response Parsing` 並滿足 `Standardized GA4 Parsing in Repository` 設計決定
  - **Behavior**: 實作通用的 `parseGA4Report(report)` 函式，動態讀取 `dimensionHeaders` 與 `metricHeaders` 將 GA4 回傳對應為以 Header 名稱為 Key 的物件陣列，拋棄脆弱的陣列索引。
  - **Verification**: 撰寫暫存測試腳本 `scratch/test-analytics-repository.ts` 並執行 `npx tsx scratch/test-analytics-repository.ts`。當傳送 mock 的 GA4 Report 資料時，`parseGA4Report` 必須成功產出包含 `screenPageViews` 與 `activeUsers` 的 JavaScript 物件陣列。
- [x] 1.3 整合 `src/repositories/analyticsRepository.ts` 到 `Four-layer Architecture Separation` 架構以滿足 `4-Layer Architecture Separation for Pageviews API`
  - **Behavior**: 建立 `AnalyticsRepository` 介面，封裝 `fetchPageviews` 方法來向 GA4 發送批次查詢。
  - **Verification**: 執行 `npx tsx scratch/test-analytics-repository.ts`，確認 Repository 能正確回傳包含 `site` 與 `page` 規格的 Promise 資料。

## 2. Use Case 與 Dependency Injection 實作

- [x] 2.1 實作 `src/use-cases/getPageviews.ts` 以滿足 `Dependency Injection in Use Case` 、 `Netlify Blobs Caching and Fallback` 與 `Failure Modes` 容錯降級機制
  - **Behavior**: 實作工廠函式 `makeGetPageviews(repository)` 以接收 Repository 依賴。Use Case 必須負責快取鍵 `pageview:<path || 'total'>:start=<start>:end=<end>` 的建構，從 Netlify Blobs 快取中讀取或向 Repository 發送 GA4 查詢，並在寫入快取成功後回傳；當呼叫 GA4 失敗時，必須落入降級機制，嘗試回傳儲存的舊快取資料。
  - **Verification**: 執行 `npx tsx scratch/test-get-pageviews-usecase.ts` 執行單元測試，當 mock 的 Repository 拋出異常時，Use Case 必須成功回退並回傳暫存於 mock Blob 儲存層中的歷史資料。當 Repository 正常執行時，快取必須成功被更新寫入。

## 3. Handler 重構與整合測試

- [x] 3.1 重構無伺服器進入點 `functions/pageviews.ts` 以滿足 `Standardized Nested API Contract` 、 `Behavior` 、 `Structured API Response Contract` 、 `Acceptance Criteria` 與 `Scope Boundaries` 規範
  - **Behavior**: 將 `functions/pageviews.js` 改寫為 `functions/pageviews.ts`（並刪除原 `.js` 檔）。精簡 Handler 為僅限於 Zod 驗證、注入依賴至 Use Case，並將 API 回傳結構轉換為 nested 結構，最終透過 `apiWrapper` 的錯誤邊界安全回傳。
  - **Verification**: 執行 `netlify dev` 本地啟動 API，使用 `curl` 呼叫 `http://localhost:8888/api/pageviews` 必須回傳 status 200 與標準 nested JSON 回應：`{ "site": { "pageviews": 100, "activeUsers": 50 } }`。呼叫 `http://localhost:8888/api/pageviews?path=/about` 必須同時包含 `page` 物件。
