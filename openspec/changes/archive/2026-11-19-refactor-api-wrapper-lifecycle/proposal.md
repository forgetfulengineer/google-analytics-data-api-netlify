## Summary

重構 `utils/apiWrapper.ts` 的請求生命週期管線，將 CORS 來源判定與業務層環境變數解析（`getEnv()`）徹底解耦，嚴格限制 `extraHeaders`（含 Durable CDN 快取標頭）僅注入於 2xx 成功回應，並支援無 Origin 標頭之直接存取（Direct Access），防止暫時性錯誤被 CDN 持久快取與本機瀏覽器直接造訪被誤擋。

## Motivation

1. **生命週期時序與過早驗證（Finding 1）**：
   現行 `apiWrapper.ts` 在最前端呼叫 `getEnv()` 驗證所有 GA4 必要變數（`PROPERTYID`、`STARTDATE` 等）。當環境變數尚未配置或缺失時，連 OPTIONS 預檢請求、非 GET 請求（405）或端點被功能開關停用（404）時，皆會被 `ZodError` 攔截為 500 設定錯誤。更嚴重的是，此時 catch 區塊內的 `corsOrigin` 仍為初始值 `'*'`，繞過了設定的 `ALLOWED_ORIGINS` 白名單。
2. **錯誤回應被 CDN 長時間快取（Finding 2）**：
   歷史實作在最終階段透過 `appendHeaders` 無差別對所有 Response 注入 `extraHeaders`。但傳入的 `CACHE_HEADERS` 包含 `Netlify-CDN-Cache-Control: public, durable, s-maxage=21600`。這導致 403、404、405、500/503 以及 204 OPTIONS 皆會被快取長達 6 小時。一旦發生暫時性 GA4 斷線（503），Netlify CDN 會持久快取該錯誤且跨 deploy 存活，造成嚴重的服務可用性障礙。
3. **空字串 Feature Flag 誤停用端點（Finding 3）**：
   `Netlify.env.get(enableFlag) ?? 'true'` 僅在 `null`/`undefined` 時 fallback，若環境變數配置為空字串 `""`，會導致條件判定為 `false`，意外將端點關閉並回傳 404。
4. **無 Origin 標頭請求被 403 誤擋（Direct Access Issue）**：
   依據 Fetch 規範，瀏覽器網址列直接打開 URL 時不附帶 `Origin` 標頭（`origin` 為空字串）。當配置了 `ALLOWED_ORIGINS` 時，空字串因不匹配白名單與 localhost 正則而被 `checkOrigin` 判定為非法並回傳 403，導致本機以 `netlify dev` 測試時在瀏覽器輸入 `localhost:8888/api/pageviews` 會直接遭遇 403。

## Proposed Solution

1. **CORS 與系統環境變數驗證解耦**：
   - `apiWrapper` 不呼叫 `getEnv()`，改以 `Netlify.env.get('ALLOWED_ORIGINS')` 獨立讀取並計算 `corsOrigin`。
   - 請求進入後立即依序執行：Origin 驗證（403）、OPTIONS 預檢（204）、HTTP Method 檢查（405）、Feature Flag 檢查（404）。
   - 業務層所需的完整環境變數校驗留待 `handlerFn` 執行時才觸發。若因變數缺失拋出 `ZodError`，外層 catch 攔截後使用已算好的 `corsOrigin` 回傳 500 JSON，絕不回退為 `'*'`。
2. **選擇性標頭注入（Selective Header Injection）**：
   - 僅在 `handlerFn` 成功完成（200 OK）時調用 `appendHeaders` 注入 `extraHeaders`（包含 `Netlify-CDN-Cache-Control` 與 `Netlify-Vary`）。
   - 所有 4xx、5xx 錯誤與 204 OPTIONS 預檢回應，絕不附加任何 CDN 快取標頭。
3. **Feature Flag 容錯性修正**：
   - 改採 Truthy Fallback 語法：`(Netlify.env.get(enableFlag) || 'true').toLowerCase() === 'true'`。
4. **無 Origin 請求放行（Direct Access Support）**：
   - 遵循 CORS 標準，在 `utils/cors.ts` 增加 `if (!origin) return true;`，將無 `Origin` 標頭的直接請求視為 Direct Access 放行。
   - 在 `utils/apiWrapper.ts` 中調整 `corsOrigin`，當請求不帶 Origin 時，不強制發出跨域來源標頭（或設為預設 `*`）。
5. **測試規格校準**：
   - 包含錯誤回應不附加快取標頭、缺少 GA4 變數時 OPTIONS/405 正常回傳，以及無 Origin 請求直接放行的各項驗證。

## Impact

- Affected specs: api-architecture-foundation
- Affected code:
  - Modified: utils/apiWrapper.ts, utils/apiWrapper.test.ts, utils/cors.ts, utils/cors.test.ts
  - New:
  - Removed:
