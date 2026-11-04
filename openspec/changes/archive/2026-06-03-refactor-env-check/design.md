## Context

目前專案透過 `utils/envCheck.ts` 以字串陣列檢查必填環境變數。當環境變數遺漏時，會由 `utils/apiWrapper.ts` 攔截並回傳 500 錯誤。但這種做法無法給予 Handler 型別推斷，導致 `functions/pageviews.ts` 與 `functions/popular-posts.ts` 必須使用 `!`（Non-null Assertion）來告訴 TypeScript 該變數一定存在。
專案中已有 `src/schemas/envSchema.ts` 定義了 Zod Schema，可以完全取代字串檢查，並提供強型別支援。
（註：專案的 Netlify Blobs 讀寫時機為 GA4 呼叫成功時寫入作 warm cache，失敗時讀取 fallback，其 cache key 格式一般為對應端點參數之 hash。此重構不會變更 Blobs 邏輯與 CORS 策略，CORS 策略依然依賴 `ALLOWED_ORIGINS`。）

## Goals / Non-Goals

**Goals:**
- 以 Zod (`src/schemas/envSchema.ts`) 統一專案環境變數的驗證。
- 在各個 Netlify Functions Handler 移除所有環境變數相關的 `!` 斷言。
- 採用 Fail Fast 策略，不在 apiWrapper 捕捉環境變數錯誤。

**Non-Goals:**
- 不更動 CDN 快取標頭傳遞邏輯。
- 不更動 Blobs 快取存取邏輯。
- 不修改既有 endpoint 的 response JSON schema。

## Decisions

### 1. 使用 ZodSchema 做全域環境變數驗證
**Rationale**: 將 `process.env` 交給 Zod 解析並 export 出 `env` 物件，能讓全專案共享強型別的環境變數。這取代了 `utils/envCheck.ts`。

### 2. 採用 Fail Fast 策略，不在 apiWrapper 捕捉環境變數錯誤
**Rationale**: 環境變數屬於系統層級設定。將缺少哪些變數的資訊暴露給 API 呼叫方不僅多餘，且有資訊洩漏（Information Disclosure）的資安疑慮。改為在 `envSchema.ts` 載入時直接執行 `parse`，若失敗則模組無法啟動，Netlify 平台會自動回傳標準 500 錯誤，開發者可直接在後端日誌看到 ZodError 的詳細欄位。因此 `apiWrapper.ts` 不需負責攔截環境設定錯誤。

## Implementation Contract

- **Behavior**: 使用者與呼叫端在正常情況下不會感受到變化。若遺漏環境變數，API 會回傳標準 500 錯誤，不再附帶缺少的變數名稱。
- **Interface / data shape**: `functions/pageviews.ts` 與 `functions/popular-posts.ts` 將改為引入 `src/schemas/envSchema.ts` 中的 `env` 物件，並讀取屬性（如 `env.PROPERTYID`）。
- **Failure modes**: 當 Zod 驗證失敗時，會在模組載入階段（Top-level）直接拋出 ZodError。API 將由平台回傳 generic 500 錯誤，詳細的錯誤欄位資訊僅留存於 Server Logs。
- **Acceptance criteria**:
  - `utils/envCheck.ts` 被徹底刪除。
  - `functions/pageviews.ts` 與 `functions/popular-posts.ts` 中不再出現 `process.env.PROPERTYID!` 這樣的 `!` 斷言。
  - 本地測試時，拔除 `.env` 的 `PROPERTYID`，呼叫 API 應收到 HTTP 500 及錯誤訊息。
- **Scope boundaries**: 僅修改環境變數驗證與型別綁定部分，其餘業務邏輯（GA4 API 呼叫、CORS、Cache）保持原樣。

## Risks / Trade-offs

- [Risk] 若某個 API endpoint 並不依賴某變數，但該變數在 `envSchema.ts` 被設為 required，該 API 也會掛掉。
  → Mitigation: 確保 `envSchema.ts` 定義的 required 都是全域核心變數（如 `PROPERTYID`、`GOOGLE_APPLICATION_CREDENTIALS_JSON`、`STARTDATE`、`ENDDATE`）。因為目前的端點都需要這些參數，這個風險極低。
