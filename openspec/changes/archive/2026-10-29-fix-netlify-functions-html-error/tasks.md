## 1. 環境變數延遲解析與單例快取重構

- [x] 1.1 實作「延遲環境變數驗證與單例快取 (Lazy Env Evaluation and Singleton Cache)」以滿足「Environment Configuration Schema」規格：修改 `src/lib/env.ts`，實作 `getEnv(): Env` 於首次調用時自 `Netlify.env.get()` 讀取並以 `EnvSchema.parse()` 驗證環境變數且快取結果，並提供 `resetEnv(): void` 清除快取；確保在模組載入期不拋出未捕捉之 ZodError 例外。驗證方式：在未設定環境變數時執行 `node -e "import('./src/lib/env.ts')"` 成功載入不噴錯，且調用 `getEnv()` 時拋出 ZodError。
- [x] 1.2 更新 `src/lib/env.test.ts` 以覆蓋 `getEnv()` 延遲驗證、快取復用與 `resetEnv()` 重置行為，並驗證缺少必填變數時調用 `getEnv()` 正確拋出 ZodError。驗證方式：執行 `rtk npx vitest run src/lib/env.test.ts` 全數通過。

## 2. 查詢參數 Schema 與呼叫端解耦

- [x] 2.1 實作「查詢參數 Schema 與靜態環境變數解耦 (Query Schema Decoupling from Static Env)」：修改 `src/schemas/pageviews.schema.ts`，移除模組頂層對 `env` 的靜態引用，改在 `refine()` 驗證執行期動態調用 `getEnv()` 取得 `PAGEPATH_REGEX`，解除 Schema 載入時對環境變數的強依賴。驗證方式：執行 `rtk npx vitest run src/schemas/pageviews.schema.test.ts` 在未注入 GA4 環境變數下直接通過測試。 [after: 1.1]
- [x] 2.2 更新呼叫端改用 `getEnv()`：修改 `src/infrastructure/analyticsClient.ts`、`functions/pageviews.ts` 與 `functions/popular-posts.ts`，移除頂層靜態 `env` 物件匯入，改於函式/Handler 內部調用 `getEnv()` 取得憑證與設定。驗證方式：執行 `rtk npx vitest run tests/functions/popular-posts.test.ts tests/functions/function-config.test.ts` 全數通過。 [after: 1.1]

## 3. API Wrapper 全生命週期錯誤攔截與整合驗證

- [x] 3.1 實作「API Wrapper 全生命週期錯誤攔截 (API Wrapper Full Lifecycle Try-Catch)」以實現「Schema 驗證層」規格修正：修改 `utils/apiWrapper.ts`，將 Origin 讀取、CORS 白名單檢查、OPTIONS 預檢、Method 驗證、Feature Flag 檢查與 `getEnv()` 調用完整包入外層 `try...catch`；當環境變數驗證失敗時，伺服器端必須使用 `console.error` 明確記錄缺失或無效的環境變數名稱，而對外一律由 catch 區塊回傳標準 HTTP 500 JSON `{ "code": "INTERNAL_SERVER_ERROR", "message": "Internal Server Error", "data": null }`，設定 `Content-Type: application/json`，杜絕 Netlify HTML 錯誤頁且不洩漏機敏細節。驗證方式：執行 `rtk npx vitest run utils/apiWrapper.test.ts` 通過所有案例。 [after: 2.1, 2.2]
- [x] 3.2 實作「單元測試環境 Mock 隔離 (Hermetic Unit Test Environment Mocks)」：於 `utils/apiWrapper.test.ts` 與 `tests/functions/pageviews.test.ts` 新增測試案例，模擬環境變數缺少必填變數（如未設定 `PROPERTYID`）情境下呼叫 API endpoint，斷言伺服器端 `console.error` 明確包含缺失欄位名稱，並斷言 API 回傳 HTTP 500 與 JSON 結構，且 Content-Type 為 `application/json`，body 絕無敏感資訊與堆疊，且不拋出未捕捉例外；mock 資料全面去環境依賴並採強型別宣告。驗證方式：執行 `rtk npx vitest run tests/functions/pageviews.test.ts utils/apiWrapper.test.ts` 全數通過。 [after: 3.1]
- [x] 3.3 執行全專案自動化整合檢查：執行完整的單元測試套件、程式碼風格檢查與型別檢查，確保既有成功查詢、CORS 驗證、快取標頭與錯誤處理無回歸問題。驗證方式：執行 `rtk npm test` 與 `rtk npm run ci` 全數通過（PASS，0 errors）。 [after: 3.2]
