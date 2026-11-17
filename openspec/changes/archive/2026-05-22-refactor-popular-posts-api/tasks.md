## 1. Repository Layer

- [x] 1.1 **Repository Implementation**: 擴充 `src/repositories/analyticsRepository.ts`，新增 `fetchPopularPosts` 函式，並複用 `parseGA4Report` 來回傳資料（滿足「三層式架構分離 (Three-layer Architecture Separation)」與「拆分為三層式架構與移除 Schema 層」決策）。驗證方式：撰寫 repository 測試，確認 `fetchPopularPosts` 回傳結構符合「結構化的 API 回應契約 (Structured API Response Contract)」。

## 2. Use Case Layer

- [x] 2.1 **Cache and Fallback Logic**: 建立 `src/use-cases/getPopularPosts.ts`（實作「Netlify Blobs 快取與降級回退機制 (Netlify Blobs Caching and Fallback)」及「Blobs 讀寫時機與 Cache Key 變更」決策）。實作 `makeGetPopularPosts`，使用 `popular:regex=${pagePathRegex}:start=${startDate}:end=${endDate}` 產生 Blobs cache key；在 GA4 成功時寫入，失敗時降級讀取，若無快取則拋出 `UpstreamError`。驗證方式：撰寫 use case 測試，利用 mock 模擬 GA4 失敗與 Blobs fallback 情境，驗證資料與 error 機制。

## 3. Handler Layer & Cleanup

- [x] 3.1 **Endpoint Handler Refactoring**: 建立 `functions/popular-posts.ts` 取代舊版邏輯。此層將委派給 Use Case，並使用 `apiWrapper` 回傳「結構化的 API 回應契約 (Structured API Response Contract)」格式的固定雙時段資料，確保「移除現有 CDN 的 Netlify-Vary」決策與 CORS 行為被正確執行。驗證方式：新增 `functions/popular-posts.test.ts`，驗證 HTTP 200, 503（UpstreamError）的情境均有正確的回應。
- [x] 3.2 **Legacy Cleanup**: 刪除舊版的 `functions/popular-posts.js`。驗證方式：執行指令確認找不到檔案，且測試腳本確認新 endpoint 的所有整合測試通過。

## 4. Verification

- [x] 4.1 **Regression Test on Pageviews**: 執行 `pageviews` API 的現有測試，確保 `analyticsRepository.ts` 等共用邏輯的修改未影響其他服務。驗證方式：執行單元測試包含 `pageviews` 並確認皆順利通過。
