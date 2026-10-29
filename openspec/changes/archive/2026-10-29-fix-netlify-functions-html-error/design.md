## Context

本專案 `google-analytics-data-api-netlify` 為部署於 Netlify Functions 的 REST API。目前系統在 `src/lib/env.ts` 中使用頂層 `EnvSchema.parse(rawEnv)` 於模組載入時立即執行驗證，且 `utils/apiWrapper.ts` 僅包覆了 `handlerFn`，使得前置流程與環境變數驗證失敗時直接拋出例外，導致 Netlify 平台回傳預設 HTML 錯誤頁面而非合約規定的 JSON 錯誤回應。

## Goals / Non-Goals

**Goals:**

- 消除模組載入期的例外拋出，確保在缺少或無效環境變數時模組載入不中斷。
- 確保所有進入 API Wrapper 的 HTTP 請求在發生伺服器或設定錯誤時，回傳合規的 HTTP 500 JSON 錯誤回應，杜絕 Netlify HTML 錯誤頁。
- 當環境變數缺失時，在伺服器端輸出明確指出缺失變數名稱的錯誤日誌，並以嚴格的 `err instanceof ZodError` 作為判斷標準，避免其他例外被誤判為 Config Error。
- 保護伺服器內部機敏資料，錯誤回應不得向客戶端暴露 env 變數名稱、值、Zod 詳細 issue 或 stack trace。
- 解除純單元測試對 GA4 環境變數與執行環境 `process.env` 的非必要依賴，測試 mock 採顯式與強型別隔離。

**Non-Goals:**

- 不改動既有成功的 API 回應 JSON 結構與各 endpoint 業務邏輯。
- 不重構現有的 Zod schema 驗證規則或新增外部依賴。
- 不保證攔截平台層級強制中斷的非應用層錯誤（如 OOM、超時 504、語法解析失敗）。

## Decisions

### 延遲環境變數驗證與單例快取 (Lazy Env Evaluation and Singleton Cache)

**Supersedes**: refactor-env-access / 職責分離（Schema vs Runtime Env）

將 `src/lib/env.ts` 改為匯出 `getEnv(): Env` 函式與 `resetEnv(): void`。在首次呼叫 `getEnv()` 時自 `Netlify.env.get()` 取得變數並以 `EnvSchema.parse()` 驗證，成功後快取至單例變數；測試時可呼叫 `resetEnv()` 清除快取。

### API Wrapper 全生命週期錯誤攔截 (API Wrapper Full Lifecycle Try-Catch)

**Supersedes**: refactor-env-check / 啟動時的環境變數驗證

將 `utils/apiWrapper.ts` 內的所有前置處理（Origin 解析、CORS 驗證、OPTIONS 預檢、Method 檢查、Feature Flag 檢查）與 `handlerFn` 執行全面納入最外層的單一 `try...catch` 區塊。
任何未處理例外均由外層 catch 攔截：
1. **Config Error 精確分流**：嚴格使用 `err instanceof ZodError` 作為判定依據（禁止結構性鴨子型別），於伺服器端以 `console.error` 詳細記錄具體缺失或格式不合規的環境變數名稱（如 `[Config Error] Missing or invalid environment variable(s): PROPERTYID`）；非 ZodError 的例外則一律輸出標準 `console.error('API error:', err)`。
2. **安全回應**：對客戶端一律回傳標準 HTTP 500 JSON 錯誤回應（`code: INTERNAL_SERVER_ERROR`），設定 `Content-Type: application/json`，嚴格禁止向客戶端暴露任何環境變數名稱、Zod 錯誤細節或堆疊資訊。

### 查詢參數 Schema 與靜態環境變數解耦 (Query Schema Decoupling from Static Env)

將 `src/schemas/pageviews.schema.ts` 移除頂層對 `env` 的靜態匯入，改於 `refine()` 驗證執行期動態調用 `getEnv()`。這能使模組在載入階段保持完全純粹，解除純單元測試對 GA4 環境變數的綁定。

### 單元測試環境 Mock 隔離 (Hermetic Unit Test Environment Mocks)

單元測試中的 `mockGetEnv` 應提供顯式且具備 `Env` 型別的確定資料（如預設顯式指定 `PAGEPATH_REGEX: undefined`、`ALLOWED_ORIGINS: undefined`），禁止讀取執行環境中的 `process.env`，避免測試行為受本機或 CI 的環境變數污染。個別測試案例（如 CORS 白名單）一律透過 `mockReturnValueOnce` 顯式覆蓋所需欄位。

## Implementation Contract

- **Behavior**: 當伺服器缺少必填環境變數（如未配置 `PROPERTYID`）時呼叫 `/api/pageviews` 或 `/api/popular-posts`，客戶端取得 HTTP 500 JSON 回應，而非 Netlify 預設 HTML 錯誤頁面。同時伺服器端輸出明確的缺漏變數錯誤日誌。
- **Interface / Data Shape**:
  - `getEnv(): Env`
  - `resetEnv(): void`
  - 錯誤 JSON 結構：
    ```json
    {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "Internal Server Error",
      "data": null
    }
    ```
- **Failure Modes**:
  - 環境變數缺少/型別錯誤：`getEnv()` 拋出 ZodError，由 `apiWrapper` 的 `err instanceof ZodError` 精確攔截，於伺服器端輸出明確記錄缺少變數名稱的日誌（`console.error`），對客戶端僅回傳 500 JSON。
  - 前置請求處理（CORS/Headers/Flags）異常或 Handler 例外：由 `apiWrapper` 攔截，輸出 `API error:`，對外回傳 500 JSON。
- **Acceptance Criteria**:
  - `npm test`（`vitest run`）所有測試全數 PASS。
  - 當環境變數缺失時呼叫 handler，伺服器日誌（`console.error`）明確包含缺少之變數名稱（如 `PROPERTYID`），客戶端收到 HTTP 500，且 `res.headers.get('content-type')` 包含 `application/json`，body 不暴露機敏資訊。
- **Scope Boundaries**:
  - In Scope: `src/lib/env.ts`、`utils/apiWrapper.ts`、`src/schemas/pageviews.schema.ts`、`functions/pageviews.ts`、`functions/popular-posts.ts`、`src/infrastructure/analyticsClient.ts` 及對應測試套件。
  - Out of Scope: 修改 GA4 報表查詢邏輯、修改 Netlify Blobs 儲存架構、新增 API 路由或更動外部回應合約。

## Risks / Trade-offs

- [Trade-off: 首次請求延遲增加] → 解析與驗證移至首次請求時執行，但因有單例快取，僅第一次請求增加微秒級 Zod 解析開銷。
- [Risk: 測試之間環境變數污染] → 提供 `resetEnv()` 並在測試 setup/afterEach 中呼叫，確保測試隔離性；mock 資料一律顯式給定，杜絕 `process.env` 污染。
