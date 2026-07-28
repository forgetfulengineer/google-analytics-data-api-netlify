# pageviews-api-architecture Specification

## Purpose

TBD - created by archiving change 'refactor-pageviews-api'. Update Purpose after archive.

## Requirements

### Requirement: Four-layer Architecture Separation
系統 MUST 針對 `pageviews` 端點實作乾淨的四層分離架構：
- **Handler**: `functions/pageviews.ts` SHALL 解析請求並驗證輸入。
- **Schema**: `src/schemas/pageviews.schema.ts` SHALL 定義 Zod 驗證規則。
- **Use Case**: `src/use-cases/getPageviews.ts` SHALL 包含快取與業務編排邏輯。
- **Repository**: `src/repositories/analyticsRepository.ts` SHALL 獲取並解析 GA4 資料。

#### Scenario: Successful execution flow
- **WHEN** 用戶端呼叫 pageviews API 端點
- **THEN** Handler SHALL 驗證參數，委派給 Use Case (此 Use Case 會從 Repository 獲取資料或傳回快取)，並透過 `apiWrapper` 回傳回應。


<!-- @trace
source: refactor-pageviews-api
updated: 2026-05-19
code:
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - src/repositories/analyticsRepository.ts
  - functions/pageviews.ts
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - src/schemas/pageviews.schema.ts
  - src/use-cases/getPageviews.ts
  - utils/apiWrapper.ts
  - package.json
tests:
  - functions/pageviews.test.ts
  - src/use-cases/getPageviews.test.ts
  - src/schemas/pageviews.schema.test.ts
  - src/repositories/analyticsRepository.test.ts
-->

---
### Requirement: Query Parameter Validation
Handler 層 MUST 在呼叫 Use Case 層之前，使用 Zod schema 驗證選用的查詢參數 `path`。

#### Scenario: Valid optional path
- **WHEN** 查詢參數包含有效路徑如 `?path=/blog-post` 並進行驗證
- **THEN** 解析 SHALL 成功並回傳 `{ path: "/blog-post" }`。

#### Scenario: Optional path parsing
- **WHEN** 查詢參數省略 `path` 或提供任意字串值時
- **THEN** 驗證 SHALL 成功，並回傳 `{}` 或 `{ path: "<provided string>" }`。


<!-- @trace
source: refactor-pageviews-api
updated: 2026-05-19
code:
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - src/repositories/analyticsRepository.ts
  - functions/pageviews.ts
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - src/schemas/pageviews.schema.ts
  - src/use-cases/getPageviews.ts
  - utils/apiWrapper.ts
  - package.json
tests:
  - functions/pageviews.test.ts
  - src/use-cases/getPageviews.test.ts
  - src/schemas/pageviews.schema.test.ts
  - src/repositories/analyticsRepository.test.ts
-->

---
### Requirement: Dynamic GA4 Response Parsing
Repository 層 MUST 實作一個輔助工具函式 `parseGA4Report`，根據 `dimensionHeaders` 與 `metricHeaders` 動態地將 GA4 API `batchRunReports` 的回應映射為標準的 JavaScript 物件。它 MUST NOT 使用任何寫死的陣列索引 (hardcoded array indices)。

#### Scenario: Parse multi-dimensional report dynamically
- **WHEN** Repository 解析一個具有動態標頭 (headers) 與資料列 (rows) 的報告回應時
- **THEN** 它 SHALL 回傳一個以標頭名稱作為 Key 的物件陣列，並將指標 (metrics) 數值自動轉換為 `number`。

##### Example: dynamic header mapping
- **GIVEN** 一個包含以下資料的報告：
  - `dimensionHeaders`: `[ { name: "pagePath" } ]`
  - `metricHeaders`: `[ { name: "screenPageViews" }, { name: "activeUsers" } ]`
  - `rows`: `[ { dimensionValues: [ { value: "/about" } ], metricValues: [ { value: "100" }, { value: "50" } ] } ]`
- **WHEN** 執行 `parseGA4Report`
- **THEN** 輸出結果 SHALL 為：
  ```json
  [
    {
      "pagePath": "/about",
      "screenPageViews": 100,
      "activeUsers": 50
    }
  ]
  ```


<!-- @trace
source: refactor-pageviews-api
updated: 2026-05-19
code:
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - src/repositories/analyticsRepository.ts
  - functions/pageviews.ts
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - src/schemas/pageviews.schema.ts
  - src/use-cases/getPageviews.ts
  - utils/apiWrapper.ts
  - package.json
tests:
  - functions/pageviews.test.ts
  - src/use-cases/getPageviews.test.ts
  - src/schemas/pageviews.schema.test.ts
  - src/repositories/analyticsRepository.test.ts
-->

---
### Requirement: Structured API Response Contract
端點必須回傳一個包裝在統一成功封裝中的標準巢狀 JSON 結構，其中包含 site 物件（全站指標）與選填的 page 物件（特定頁面指標）。

#### Scenario: 全站流量請求
- **WHEN** 省略查詢參數 path 時
- **THEN** API 回應的 `data` 必須包含全站指標並省略 `page` 鍵值。

##### Example: 全站回應結構
- **GIVEN** GA4 全站數據：pageviews = 1000, activeUsers = 500
- **WHEN** 發送不帶 path 參數的請求時
- **THEN** 回應主體的 JSON 必須符合：
  ```json
  {
    "code": "SUCCESS",
    "message": "Query successful",
    "data": {
      "site": {
        "pageviews": 1000,
        "activeUsers": 500
      }
    }
  }
  ```

#### Scenario: 特定頁面流量請求
- **WHEN** 提供查詢參數 path 時
- **THEN** API 回應的 `data` 必須同時包含全站指標與特定頁面指標。

##### Example: 特定頁面回應結構
- **GIVEN** GA4 全站數據：pageviews = 1000, activeUsers = 500；且 "/about" pageviews = 100
- **WHEN** 發送帶有查詢參數 `path=/about` 的請求時
- **THEN** 回應主體的 JSON 必須符合：
  ```json
  {
    "code": "SUCCESS",
    "message": "Query successful",
    "data": {
      "site": {
        "pageviews": 1000,
        "activeUsers": 500
      },
      "page": {
        "path": "/about",
        "pageviews": 100
      }
    }
  }
  ```


<!-- @trace
source: optimize-api-response-patterns
updated: 2026-05-21
code:
  - utils/response.ts
  - src/errors/AppError.ts
  - functions/pageviews.ts
  - utils/apiWrapper.ts
tests:
  - utils/response.test.ts
  - functions/pageviews.test.ts
  - src/errors/AppError.test.ts
-->

---
### Requirement: Netlify Blobs Caching and Fallback
Use Case 層 MUST 動態建構快取鍵，嘗試將成功的 GA4 回應儲存至 Netlify Blobs `analytics-storage` 中（鍵值格式為 `pageview:<path || 'total'>:start=<start>:end=<end>`），且當 GA4 請求失敗時 MUST 降級回退 (fallback) 至已快取的 JSON 資料。

#### Scenario: Cache hit on GA4 failure
- **WHEN** GA4 客戶端拋出錯誤，且 Blob 儲存庫中存在備援快取時
- **THEN** Use Case SHALL 捕獲錯誤、記錄日誌、從 Blob 儲存庫中檢索備份，並成功回傳快取的歷史資料。

#### Scenario: Cache write on success
- **WHEN** 成功獲取 GA4 資料時
- **THEN** Use Case SHALL 將最新資料與時間戳記更新寫入 Blob 儲存庫快取，並回傳最新的 fresh 資料。

<!-- @trace
source: refactor-pageviews-api
updated: 2026-05-19
code:
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - src/repositories/analyticsRepository.ts
  - functions/pageviews.ts
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - src/schemas/pageviews.schema.ts
  - src/use-cases/getPageviews.ts
  - utils/apiWrapper.ts
  - package.json
tests:
  - functions/pageviews.test.ts
  - src/use-cases/getPageviews.test.ts
  - src/schemas/pageviews.schema.test.ts
  - src/repositories/analyticsRepository.test.ts
-->
