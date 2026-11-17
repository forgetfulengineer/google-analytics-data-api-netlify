## Context

目前 `google-analytics-data-api-netlify` 專案的架構將 HTTP 解析、業務邏輯與第三方 API 連線（GA4）全部寫在 Netlify Functions (`functions/*.js`) 內。為了提高測試性與可維護性，並為全面採用 TypeScript 做準備，本提案將建立分層架構（Layered Architecture）的基礎設施，包含基礎資料夾結構、共用的錯誤類別、Zod 驗證層，以及 GA4 連線的 Infrastructure 單例 (Singleton)。

## Goals / Non-Goals

**Goals:**

- 建立 `src/schemas/`、`src/errors/` 與 `src/infrastructure/` 目錄。
- 建立統一的錯誤處理類別 (`AppError` 及其子類別)，讓 HTTP 回應狀態碼與錯誤類型解耦。
- 使用 Zod 定義可重複使用的環境變數與查詢參數 Schema。
- 將 GA4 SDK 客戶端初始化邏輯遷移至 `src/infrastructure/analyticsClient.ts`，確保以單例模式運作。
- 設定 TypeScript 編譯環境，以便在後續提案中使用 `.ts` 取代 JSDoc 來進行型別檢查。

**Non-Goals:**

- 本階段不重構現有端點 (`pageviews.js`, `popular-posts.js`) 的內部業務邏輯。
- 不改變既有的 Blob 快取鍵 (Cache Key) 格式或備援邏輯機制。
- 不改變 `Netlify-CDN-Cache-Control` 或 `Cache-Control` 等 HTTP 標頭設定。

## Decisions

### 1. 建立基於 Zod 的型別驗證層

使用 Zod 來解析環境變數（模組載入時）以及驗證 HTTP 請求參數（請求時）。Zod 能夠在 runtime 進行資料驗證，同時自動推導出 TypeScript 型別 (`z.infer`)，讓我們的基礎架構享有最安全的型別防護。

### 2. 定義統一的 AppError 類別

在 `src/errors/AppError.ts` 建立基礎的 `AppError` 類別（繼承內建的 `Error`），並加入 `statusCode` 屬性。同時建立 `ValidationError` (400)、`NotFoundError` (404) 與 `UpstreamError` (503) 等子類別。這樣後續的 `apiWrapper.js` 只要捕捉到 `AppError`，就能自動回傳正確的 HTTP 狀態碼與錯誤格式。

### 3. 將 GA4 客戶端隔離至 Infrastructure 層

將原本在 `utils/analyticsClient.js` 的邏輯遷移到 `src/infrastructure/analyticsClient.ts`。在此層級中，我們會讀取環境變數、解析 Service Account JSON，並使用模組級別的單例 (Module-level singleton) 來實例化 `BetaAnalyticsDataClient`，避免在 Lambda 暖開機 (Warm start) 時重複建立連線。

### 4. TypeScript 基礎設定

新增 `tsconfig.json` 並設定 `package.json`，讓專案支援 TypeScript 編譯。我們將保留原先使用 ESM 與 esbuild 的機制。

## Implementation Contract

- **Behavior**:
  - `AppError` 必須能被正確實例化，並帶有預設的 `statusCode` 與 `message`。
  - `src/infrastructure/analyticsClient.ts` 必須匯出一個 `getAnalyticsClient()` 函式，並且無論呼叫多少次，都只會回傳同一個 `BetaAnalyticsDataClient` 實例。
- **Interface / Data Shape**:
  - 錯誤結構：當拋出 `ValidationError` 時，物件須包含 `details` 屬性以描述驗證失敗的欄位。
- **Failure modes**:
  - 若 `GOOGLE_APPLICATION_CREDENTIALS_JSON` 環境變數缺失或格式錯誤，`getAnalyticsClient()` 必須在第一次呼叫時明確拋出錯誤，避免靜默失敗 (Silent failure)。
  - Netlify Blobs 讀寫時機維持現狀：成功取得 GA4 資料時寫入 Blob 作為 warm cache；發生例外錯誤時，從 Blob 讀取對應的 Cache Key (`pageview:path:start:end` 或 `popular:type:regex:start:end`) 作為 fallback 備援。
- **Acceptance criteria**:
  - 能夠成功透過 `tsc --noEmit` 檢查 `src/` 目錄下的 TypeScript 檔案而沒有型別錯誤。
  - 執行 Netlify 本地測試 (netlify dev) 時，既有的 `pageviews` 與 `popular-posts` 依然能透過舊有路徑或過渡性的引入正常運作，CORS 策略 (allowedOrigins 行為) 維持不變（由 `utils/cors.js` 提供）。
- **Scope boundaries**:
  - 新增基礎設施檔案 (In scope)。
  - 既有 `functions/*.js` 內部的大規模改寫 (Out of scope，保留至後續提案)。

## Risks / Trade-offs

- [Risk] 引入 TypeScript 可能導致現有部署管線出現編譯錯誤。 → Mitigation: 確保 `netlify.toml` 的編譯指令能正確處理 `.ts` 檔案，並且在完全重構舊檔案之前，允許 TypeScript 與 JavaScript 檔案共存。
