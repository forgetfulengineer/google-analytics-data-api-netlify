## 1. 簡化 Response Helpers

- [x] 1.1 移除 Response Helpers 中的 `extraHeaders`
  - **行為**: 修改 `utils/response.ts`，移除 `jsonResponse`, `successResponse`, `errorResponse` 函式的 `extraHeaders` 參數及內部設定 logic。
  - **驗證**: TypeScript 編譯通過（無型別錯誤，其他檔案呼叫這些函式時若有傳入 `extraHeaders` 會報錯，這是預期的，留到下一步處理）。

## 2. 集中 Header 注入邏輯

- [x] 2.1 在 `apiWrapper` 的最終階段動態注入 Headers
  - **行為**: 修改 `utils/apiWrapper.ts` 的 `apiWrapper` 函式，在 `try...catch` 區塊中，取得 `successResponse` 和 `errorResponse` 回傳的原生 `Response` 物件後，使用 `response.headers.set()` 動態注入 `extraHeaders`。確保提早阻擋（如 403, 404, 405, OPTIONS 204）的 response 不帶這些 cache headers。
  - **驗證**: 執行本地伺服器 (`netlify dev`)，使用 `curl -I http://localhost:8888/api/pageviews` 預期 HTTP 200 且回應包含 `Netlify-CDN-Cache-Control` 標頭。發送 `curl -X POST http://localhost:8888/api/pageviews -I` 預期 HTTP 405 且**不包含** `Netlify-CDN-Cache-Control`。
