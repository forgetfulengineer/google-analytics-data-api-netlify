## Why

目前專案在 `src/lib/env.ts` 中使用頂層 `EnvSchema.parse(rawEnv)` 於模組載入階段立即驗證環境變數，且 `utils/apiWrapper.ts` 僅在 `handlerFn` 外層設置 `try...catch`，未包覆 CORS 驗證與前置流程。當環境變數缺失、格式錯誤或前置流程拋出例外時，錯誤會在 Function Handler 執行前或穿透 Wrapper 拋出，導致 Netlify 平台接管錯誤處理並回傳預設的 HTML 錯誤頁面（`Content-Type: text/html`），違反 REST API 回傳統一 JSON 錯誤回應的契約。

## What Changes

- **修改 `src/lib/env.ts`**：
  - 將頂層立即解析改為延遲解析函式 `getEnv(): Env`，首次呼叫時驗證並快取結果。
  - 新增 `resetEnv(): void` 提供測試隔離重置快取功能。
  - 移除頂層 `export const env = EnvSchema.parse(...)`。
- **修改 `utils/apiWrapper.ts`**：
  - 將整個請求處理生命週期（包含 Origin 解析、CORS 驗證、OPTIONS 預檢、Method 檢查、Feature Flag 檢查與 handler 執行）完全置於最外層的 `try...catch` 區塊中。
  - 於 Wrapper 內部透過 `getEnv()` 取得環境設定；並以 `err instanceof ZodError` 嚴格判定環境變數驗證錯誤，於伺服器端輸出明確的缺漏變數名稱日誌，其餘錯誤輸出標準 API error。
  - 對外一律回傳 HTTP 500 JSON 錯誤回應（`INTERNAL_SERVER_ERROR`），絕不向客戶端暴露內部錯誤細節或堆疊資訊。
- **修改 `src/schemas/pageviews.schema.ts`**：
  - 移除模組頂層對 `env` 的靜態引用，改於 `refine()` 驗證時動態透過 `getEnv()` 取得 `PAGEPATH_REGEX`，解除 Schema 模組載入期的環境依賴。
- **修改 `functions/pageviews.ts`、`functions/popular-posts.ts` 與 `src/infrastructure/analyticsClient.ts`**：
  - 移除頂層靜態 `env` 物件匯入，改為於 Handler 內部或函式呼叫點調用 `getEnv()`。
- **更新測試套件**：
  - 更新 `src/lib/env.test.ts`、`src/schemas/pageviews.schema.test.ts`、`utils/apiWrapper.test.ts` 及各 function 測試，以符合延遲解析機制，並驗證環境變數缺失時 API 正確回傳 JSON 錯誤回應而非拋出未捕捉例外。
  - 單元測試中的 mock 環境變數改為顯式宣告強型別常數（賦予 `undefined` 等固定值），杜絕透過 `process.env` 讀取外部環境，確保測試完全隔離與確定性。

## Non-Goals (optional)

- 不更換既有的 Zod 驗證庫或變更 `EnvSchema` 欄位契約。
- 不實作本機專用 fallback 或繞過 `Netlify.env.get()` 規範。
- 不保證攔截平台層級不可控錯誤（如 Node.js 語法錯誤、記憶體不足 OOM、平台請求逾時 Timeout 或邊緣 CDN 故障）。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `env-config`: 將環境變數驗證時機由模組載入期立即驗證調整為呼叫 `getEnv()` 時延遲驗證並快取，確保在模組匯入時不拋出例外，支援安全啟動。
- `api-architecture-foundation`: 廢除「環境變數驗證失敗由平台處理」的不當行為；要求 `apiWrapper` 將全流程納入錯誤捕捉邊界，所有伺服器設定與執行期例外皆回傳符合規格之 HTTP 500 JSON 錯誤回應。

## Impact

- Affected specs: `env-config`, `api-architecture-foundation`
- Affected code:
  - Modified:
    - functions/pageviews.ts
    - functions/popular-posts.ts
    - src/infrastructure/analyticsClient.ts
    - src/lib/env.test.ts
    - src/lib/env.ts
    - src/schemas/pageviews.schema.test.ts
    - src/schemas/pageviews.schema.ts
    - tests/functions/function-config.test.ts
    - tests/functions/pageviews.test.ts
    - tests/functions/popular-posts.test.ts
    - utils/apiWrapper.test.ts
    - utils/apiWrapper.ts
  - New: (none)
  - Removed: (none)
- Compatibility: 維持既有 API 成功與錯誤回應格式契約，向下相容；修正既有錯誤情境下非預期之 HTML 回應。
