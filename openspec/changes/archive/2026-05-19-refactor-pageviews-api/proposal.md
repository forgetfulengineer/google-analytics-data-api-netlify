## Why

目前的 `pageviews` API (`functions/pageviews.js`) 存在高度耦合的技術債。HTTP 請求處理、快取邏輯與 GA4 取資料邏輯全部混在一個巨大的 Handler 中，導致無法獨立撰寫單元測試，且對於 GA4 回傳資料的解析高度依賴脆弱的陣列索引（hardcode array index）。我們需要將其重構為符合專案 `@/netlify-functions-api-architecture` 規範的四層式架構，並將對外輸出的 API 結構標準化為更具語意、更容易擴充的格式。

## What Changes

- **架構分層重構**：將 `pageviews.js` 的邏輯嚴格拆分為四層：Handler (`functions/`), Schema (`src/schemas/`), Use Case (`src/use-cases/`), Repository (`src/repositories/`)。
- **內部資料標準化**：在 Repository 層新增通用的 GA4 回傳解析器 (`parseGA4Report`)，動態根據 `dimensionHeaders` 與 `metricHeaders` 將結果轉換為 JavaScript 物件陣列，徹底捨棄陣列索引。
- **(BREAKING) API 回傳結構重構**：廢除舊有容易混淆的 `{ pv, uv, pageViews }` 結構，改為具備自我解釋能力的 JSON：
  ```json
  {
    "site": { "pageviews": 100, "activeUsers": 50 },
    "page": { "path": "/about", "pageviews": 10 }
  }
  ```
  *(註：若無傳入 `path` 參數，則不會回傳 `page` 物件)*
- **輸入驗證強化**：在 Handler 層新增 Zod Schema 以驗證 `path` 參數。

## Non-Goals (optional)

## Capabilities

### New Capabilities

- `pageviews-api-architecture`: 規範 `pageviews` API 的四層式架構職責分配、Repository 內部標準化解析器（`parseGA4Report`）的行為，以及全新的語意化對外 API 回傳結構。

### Modified Capabilities

(none)

## Impact

- 受影響 of API: `/api/pageviews` (回傳結構發生 Breaking Change)
- 影響的程式碼檔案：
  - Modified: `functions/pageviews.js` (即將轉為 `.ts`，並精簡為 Handler)
  - New: `src/schemas/pageviews.schema.ts`
  - New: `src/use-cases/getPageviews.ts`
  - New: `src/repositories/analyticsRepository.ts`
