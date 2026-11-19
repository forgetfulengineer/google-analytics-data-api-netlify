## 1. 核心實作（Implementation）

- [x] 1.1 在 `utils/apiWrapper.ts` 依據「決策一：將 CORS 解析與環境變數解耦並前置 HTTP 閘門」重構請求生命週期管線：以 `Netlify.env.get('ALLOWED_ORIGINS')` 獨立解析來源並計算 `corsOrigin`，將 Origin 檢查（403）、OPTIONS 預檢（204）、Method 檢查（405）前置於環境變數驗證之前，使「Schema 驗證層」僅在執行業務層 `handlerFn` 時處理 GA4 必填變數，並使「CORS Preflight Handling with Caching」在 GA4 變數缺失時仍能正確回傳 204；驗證方式：執行 `npx vitest run utils/apiWrapper.test.ts`。
- [x] 1.2 在 `utils/apiWrapper.ts` 依據「決策二：僅對成功回應選擇性注入 Extra Headers」重構標頭注入邏輯：實作「Selective CDN Cache Headers Injection」，僅對 200 成功回應附加 `extraHeaders`，4xx/5xx 與 204 回應絕不注入快取標頭；並依據「決策三：Feature Flag 採用 Truthy Fallback」將開關邏輯改為 `(Netlify.env.get(enableFlag) || 'true').toLowerCase() === 'true'`；驗證方式：執行 `npx vitest run utils/apiWrapper.test.ts`。

## 2. 測試規格更新與整合驗證（Testing and Verification）

- [x] 2.1 [after: 1.2] 在 `utils/apiWrapper.test.ts` 更新並擴充單元測試：將原本預期錯誤回應附加快取標頭的測試反轉為斷言錯誤回應不含 `Netlify-CDN-Cache-Control`，新增 OPTIONS/405 在缺少 GA4 變數時正常回傳的案例、空字串 Feature Flag 正常啟用的案例，以及 500 設定錯誤時套用精確 `corsOrigin` 的案例；驗證方式：執行 `npx vitest run utils/apiWrapper.test.ts` 全數通過。
- [x] 2.2 [after: 2.1] 執行全專案靜態檢查、型別檢查與完整測試套件，確保重構未破壞既有端點行為與 Clean Architecture 邊界；驗證方式：執行 `npx @biomejs/biome ci .`、`npx tsc --noEmit` 以及 `npm test` 全數通過。

## 3. 無 Origin 請求放行修正（Direct Access Support）

- [x] 3.1 在 `utils/cors.ts` 依據「決策四：無 Origin 標頭請求視為 Direct Access 放行」與「CORS Exact Match Validation」實作直接存取支援：當請求無 `origin` 標頭時直接判定為允許（`if (!origin) return true;`），並在 `utils/apiWrapper.ts` 調整 `corsOrigin` 處理直接存取請求；驗證方式：執行 `npx vitest run utils/cors.test.ts utils/apiWrapper.test.ts`。
- [x] 3.2 [after: 3.1] 在 `utils/cors.test.ts` 與 `utils/apiWrapper.test.ts` 新增測試驗證當設定 `ALLOWED_ORIGINS` 時無 `Origin` 標頭請求（如瀏覽器直接打開）能順利通過且回傳 200，並執行全專案靜態與整合測試；驗證方式：執行 `npx @biomejs/biome ci .`、`npx tsc --noEmit` 與 `npm test` 全數通過。
