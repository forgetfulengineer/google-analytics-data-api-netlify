## Context

目前的 `utils/apiWrapper.ts` 負責統一管理 Netlify Functions 的 HTTP 請求處理流程，涵蓋 CORS 檢驗、OPTIONS 預檢、Method 驗證、Feature Flag 檢查、業務邏輯執行、全生命週期例外捕捉與標頭注入。
然而在先前的實作中存在三個流程與安全性問題：
1. `apiWrapper` 在最頂層直接調用 `getEnv()`，而 `getEnv()` 會強制執行 `EnvSchema.parse()`，校驗所有 GA4 必填變數（如 `PROPERTYID` 等）。這使得未配置 GA4 變數時，OPTIONS 預檢與 405/404 請求被錯誤地轉為 500 異常，且例外發生時 `corsOrigin` 尚未被正確解析，會以 `'*'` 回退，違反 CORS 來源控管原則。
2. 歷史決策 `refactor-extra-headers` 在 `apiWrapper` 的出口處對所有 Response 無差別注入 `extraHeaders`。當端點配置了 Durable CDN 快取標頭時，4xx、5xx 錯誤與 204 OPTIONS 回應都會被附加長達 6 小時的持久快取，造成暫時性上游故障跨 deploy 被 CDN 持續快取。
3. 當配置了 `ALLOWED_ORIGINS` 時，瀏覽器直接由網址列打開 URL、同源直接導覽或非瀏覽器工具（如 cURL）發起 GET 請求時，HTTP 標頭不含 `Origin`（`origin` 為空字串）。目前的 `checkOrigin` 因空字串不匹配白名單而直接回傳 403 Forbidden，導致本機以 `netlify dev` 測試時輸入 `localhost:8888/api/pageviews` 遭遇 403 阻擋。

## Goals / Non-Goals

**Goals:**
- 將 CORS 來源解析與系統環境變數驗證解耦，使 `apiWrapper` 不受 GA4 變數缺失影響，並在前置階段即完成正確的 `corsOrigin` 計算。
- 確保 OPTIONS 預檢、Method 驗證（405）與 Feature Flag 驗證（404）在呼叫業務邏輯 `handlerFn` 之前獨立完成。
- 限制 `extraHeaders`（含 CDN 快取標頭）僅在 2xx 成功回應時注入，所有錯誤回應與預檢回應絕不附加 CDN 快取標頭。
- 修正 Feature Flag 的空字串判定行為，採用 truthy fallback 避免意外停用端點。
- 支援無 Origin 標頭之直接存取（Direct Access），無 `Origin` 標頭時直接放行，避免誤判為非法跨來源存取。
- 全生命週期例外捕捉持續有效，當 `handlerFn` 因缺少必要環境變數而拋出 `ZodError` 時，使用已計算完畢的 `corsOrigin` 回傳 500 JSON。

**Non-Goals:**
- 不重構 `apiWrapper` 為全功能 Middleware Runner 模式。
- 不改變 `getEnv()` 本身的驗證邏輯與 `EnvSchema` 結構。
- 不修改各業務 handler（`pageviews.ts`、`popular-posts.ts`）內部的 Use Case 調用方式。

## Decisions

### 決策一：將 CORS 解析與環境變數解耦並前置 HTTP 閘門

**Supersedes**: fix-netlify-functions-html-error / API Wrapper 全生命週期錯誤攔截 (API Wrapper Full Lifecycle Try-Catch)

- **Rationale**: `apiWrapper` 只需知道允許的來源清單，不應依賴包含 GA4 憑證的完整 `getEnv()`。因此改用 `Netlify.env.get('ALLOWED_ORIGINS')` 獨立取得設定，於最前端計算出精確的 `corsOrigin`。在進入業務層之前，依序進行 Origin 檢查（403）、OPTIONS 預檢（204）、Method 檢查（405）與 Feature Flag 檢查（404）。
- **Alternatives Considered**: 曾考慮在 `envSchema.ts` 拆分出獨立的 `CorsEnvSchema`，但對於單一變數 `ALLOWED_ORIGINS` 而言直接呼叫 `Netlify.env.get()` 更加輕量且不增加額外抽象。

### 決策二：僅對成功回應選擇性注入 Extra Headers

**Supersedes**: refactor-extra-headers / 在 `apiWrapper` 的最終階段動態注入 Headers

- **Rationale**: 歷史決策對所有 Response 均注入 `extraHeaders`，但傳入的 headers 是具體端點的快取策略（包含 `Netlify-CDN-Cache-Control: public, durable, s-maxage=21600`）。只有 HTTP 200/2xx 的成功資料才應該被快取；4xx 用戶端錯誤、5xx 伺服器錯誤與 204 OPTIONS 預檢絕不能被 CDN 長時間快取。因此改為僅在 `successResponse` 產生後調用 `appendHeaders`。
- **Alternatives Considered**: 曾考慮讓呼叫端分別傳入 `successHeaders` 與 `errorHeaders`，但目前系統架構中所有錯誤回應均不應由 CDN 快取，預設錯誤無快取標頭為最安全防禦策略。

### 決策三：Feature Flag 採用 Truthy Fallback

- **Rationale**: 針對 `enableFlag` 檢查，原先的 `Netlify.env.get(enableFlag) ?? 'true'` 在環境變數被設定為空字串 `""` 時無法觸發 fallback，導致比較為 `false` 而誤回傳 404。改為 `(Netlify.env.get(enableFlag) || 'true').toLowerCase() === 'true'`，確保未設定或設為空字串時均預設啟用。
- **Alternatives Considered**: 保持現狀並要求外部維護者不可留空。此方式易因操作失誤引發線上故障，容錯度過低。

### 決策四：無 Origin 標頭請求視為 Direct Access 放行

- **Rationale**: 依據 WHATWG Fetch 與 W3C CORS 規範，CORS 僅防禦瀏覽器環境下的非同源腳本跨域存取。直接在瀏覽器輸入網址、同源導覽或一般 HTTP 客戶端不帶 `Origin` 標頭（`origin === ''`）。若在配置了 `ALLOWED_ORIGINS` 時直接阻擋無 Origin 請求，將破壞本機直接訪問與正常導覽。因此在 `utils/cors.ts` 實作 `if (!origin) return true;`，視為直接存取放行，且在 `utils/apiWrapper.ts` 針對無 origin 的請求不強制回傳跨域來源標頭。
- **Alternatives Considered**: 要求開發者在本機一律手動注入 Origin 標頭。此作法不符合 Web 正常運作體驗且違反標準 CORS 語意。

## Implementation Contract

- **Behavior**:
  - 當發送 OPTIONS 預檢請求時，即使 `PROPERTYID` 等 GA4 環境變數缺失，端點仍能立即回傳 HTTP 204，並帶有精確的 CORS 標頭與 `Access-Control-Max-Age: 86400`，且不包含任何 CDN 快取標頭。
  - 當發送非 GET 請求時（如 POST），端點回傳 HTTP 405，帶有精確 CORS 標頭，且不包含 CDN 快取標頭。
  - 當 Feature Flag 被關閉時，端點回傳 HTTP 404，帶有精確 CORS 標頭，且不包含 CDN 快取標頭；當 Feature Flag 為空字串時，端點維持啟用狀態。
  - 當請求不包含 `Origin` 標頭時（如瀏覽器網址列直接打開），即使配置了 `ALLOWED_ORIGINS` 白名單，系統亦判定為合法存取（Direct Access），順利回傳 200 OK。
  - 當業務層拋出 `AppError`（400/503 等）或環境變數 `ZodError`（500）時，端點回傳對應的標準 JSON 錯誤信封，帶有精確的 `Access-Control-Allow-Origin`，且不包含 `Netlify-CDN-Cache-Control` 與 `Netlify-Vary`。
  - 只有合法的 GET 成功查詢（200 OK）才會包含 `extraHeaders` 所指定的 CDN 快取標頭。
- **Interface / Data Shape**:
  - `apiWrapper(req: Request, context: unknown, options: ApiWrapperOptions): Promise<Response>` 簽章維持不變。
  - `checkOrigin(origin: string, allowedOrigins: string[] | null): boolean` 簽章維持不變。
- **Failure Modes**:
  - Origin 不合法（提供明確且非白名單之 Origin）：回傳 403 `CORS_FORBIDDEN`，無 CDN 快取。
  - Method 不支援：回傳 405 `METHOD_NOT_ALLOWED`，無 CDN 快取。
  - Flag 停用：回傳 404 `NOT_FOUND`，無 CDN 快取。
  - GA4 缺少必填變數：伺服器記錄 `[Config Error] Missing or invalid environment variable(s)`，對客戶端回傳 500 `INTERNAL_SERVER_ERROR`，套用正確 `corsOrigin`，無 CDN 快取。
- **Acceptance Criteria**:
  - 單元測試中驗證 OPTIONS 與 405 請求在缺少必要環境變數時不會回傳 500。
  - 單元測試中驗證錯誤回應（400、403、404、405、500）均不含有 `Netlify-CDN-Cache-Control` 標頭。
  - 單元測試中驗證空字串 Feature Flag 仍維持端點正常執行。
  - 單元測試中驗證當設定 `ALLOWED_ORIGINS` 時，無 `Origin` 標頭之請求順利通過驗證。
  - 所有既有測試與整合測試全數通過。
- **Scope Boundaries**:
  - 範圍限於 `utils/apiWrapper.ts`、`utils/cors.ts` 與其對應測試 `utils/apiWrapper.test.ts`、`utils/cors.test.ts`。
  - 不修改任何業務 logic、Repository、Client 與 Schema 定義。

## Risks / Trade-offs

- [測試行為變更風險] 既有測試中存在 `appends extra headers to handler-generated error responses`，此測試預期錯誤回應帶有快取標頭。
  → Mitigation: 反轉該測試斷言為 `does not append extra headers to error responses`，確保規格一致。
