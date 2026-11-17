## 1. 錯誤類別與回應模組重構 (Core Error and Response Refactoring)

- [x] 1.1 在 `src/errors/AppError.ts` 實作「決策一：在 AppError 核心類別引入機器可讀錯誤碼 code 欄位」，使所有自訂錯誤均包含 `code` 屬性。驗證方式：執行編譯並以單元測試確認 `AppError` 實例帶有預設的 `INTERNAL_SERVER_ERROR`，且 `ValidationError`、`NotFoundError`、`UpstreamError` 分別帶有正確的狀態碼與錯誤碼。
- [x] 1.2 在 `src/errors/AppError.ts` 實作「決策二：將 ValidationError 的 details 物件扁平化為 errors 陣列」，確保 `ValidationError` 將原始 of `details` 物件自動解析並映射為扁平化的 `errors` 屬性（型別為 `{ field: string; reason: string }[]`）。驗證方式：建立暫時測試或以單元測試確認 `ValidationError` 實例的 `errors` 欄位結構完全符合預期。
- [x] 1.3 重構 `utils/response.js` 以支援 `統一的成功回應封裝 (Unified Success Response Envelope)` 與 `統一的錯誤回應封裝 (Unified Error Response Envelope)` 標準化錯誤輸出，實作 `jsonResponse`、`successResponse` 及 `errorResponse`，使其皆回傳 `{ code, message, data, meta?, errors? }` 格式。驗證方式：撰寫測試程式載入並呼叫此共用模組，檢查成功回應與錯誤回應之 JSON 根節點屬性是否完整且格式正確。

## 2. 共用 API 封裝器與端點適配 (Wrapper and Endpoint Integration)

- [x] 2.1 在 `utils/apiWrapper.js` 實作「決策三：重構 apiWrapper.js 作為唯一的 Response 邊界與 CORS 守衛」以及「型別化錯誤處理 (Typed Error Handling)」，確保所有的錯誤分支與正常返回皆經由 `successResponse` 和 `errorResponse` 包裝輸出。驗證方式：確認攔截器（開關、環境變數與 CORS）在觸發時皆回傳 HTTP 狀態碼與標準化錯誤袋，且主 Handler 能順利回傳統一的成功包裝。

## 3. 單元測試調整與驗證 (Test Validation)

- [x] 3.1 調整 `functions/pageviews.test.ts` 的測試斷言，配合 `pageviews-api-architecture` 中的 `Structured API Response Contract` 標準，更新所有測試的預期回傳值結構。驗證方式：執行 `npx vitest run functions/pageviews.test.ts`，確認全數測試綠燈通過，無任何斷言失敗。
