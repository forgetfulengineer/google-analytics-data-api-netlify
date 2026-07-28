## Why

目前的 Netlify Functions (`pageviews.js` 與 `popular-posts.js`) 將路由參數解析、GA4 API 呼叫邏輯與快取備援機制混合在同一檔案中，導致程式碼難以維護與獨立測試。為了解決這些痛點並遵循 `@netlify-functions-api-architecture` 最佳實踐，我們需要建立分層架構的基礎建設，並為後續全面轉換為 TypeScript `.ts` 鋪路。

## What Changes

- **建立分層架構目錄**：新增 `src/schemas/`、`src/errors/` 與 `src/infrastructure/`，作為後續業務邏輯分離的基礎。
- **統一錯誤處理機制**：建立 `src/errors/AppError.ts` 及其子類別 (例如 `ValidationError`, `UpstreamError`)，以便在 API 層統一處理錯誤狀態碼。
- **引入 TypeScript 與 Zod 驗證**：在 `src/schemas/` 建立參數驗證層，使用 Zod 處理 HTTP query 參數與環境變數驗證，並推導型別，取代原先的純 JavaScript 實作。
- **基礎設施層遷移**：將 `utils/analyticsClient.js` 遷移至 `src/infrastructure/analyticsClient.ts`，確保與 GA4 的連線以 Singleton 模式封裝在對應的分層中。
- **建置工具支援**：設定專案支援編譯 `.ts` 檔案，為接下來重構 `pageviews` 與 `popular-posts` 端點提供型別支援環境。

## Non-Goals (optional)

- 本提案不會直接重構 `functions/pageviews.js` 與 `functions/popular-posts.js` 的業務邏輯（這將在後續獨立的提案中處理）。
- 不改變既有的 CDN 快取策略 (`Netlify-CDN-Cache-Control` 與 `Netlify-Vary`)。
- 不改變原有的 Netlify Blobs 快取備援機制邏輯。

## Capabilities

### New Capabilities

- `api-architecture-foundation`: 定義分層架構的基礎模組（Zod Schema 驗證與 Typed Errors），以及設定 TypeScript 開發環境的基礎建設。
- `ga4-infrastructure-client`: 封裝 GA4 API 連線的 Infrastructure 層，負責初始化 `@google-analytics/data` 客戶端並處理認證異常。

### Modified Capabilities

(none)

## Impact

- 影響的架構與檔案:
  - New: `src/errors/AppError.ts`
  - New: `src/infrastructure/analyticsClient.ts`
  - New: `tsconfig.json`
  - Removed: `utils/analyticsClient.js`
  - Modified: `package.json`
