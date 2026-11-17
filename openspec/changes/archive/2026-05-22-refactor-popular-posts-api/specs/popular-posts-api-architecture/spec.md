## ADDED Requirements

### Requirement: 三層式架構分離 (Three-layer Architecture Separation)
系統必須針對 `popular-posts` API 實作乾淨的三層架構分離：
- **Handler**: `functions/popular-posts.ts` 必須負責接收 HTTP 請求並將請求委派。
- **Use Case**: `src/use-cases/getPopularPosts.ts` 必須處理業務邏輯與 Netlify Blobs 的快取機制。
- **Repository**: `src/repositories/analyticsRepository.ts` 必須負責呼叫 GA4 API 並取得資料。
(由於不再接受任何查詢參數，故無需 Schema 驗證層)

#### Scenario: 成功的 API 執行流程
- **WHEN** 客戶端呼叫 `/api/popular-posts` 端點時
- **THEN** Handler 必須交由 Use Case 處理，最後透過 `apiWrapper` 回傳標準格式的回應。

##### Example: 基本呼叫情境
- **GIVEN** 系統環境變數與 GA4 API 皆正常連線
- **WHEN** 客戶端請求 `/api/popular-posts`
- **THEN** 系統將回傳包含熱門文章資料的標準 JSON 成功回應格式

### Requirement: 結構化的 API 回應契約 (Structured API Response Contract)
API 端點必須回傳標準的 JSON 結構，並包裝在專案統一的成功回應格式內。內部的 `data` 必須「同時」包含 `month` 與 `allTime` 陣列，陣列內為文章路徑與瀏覽量。

#### Scenario: 請求熱門文章資料
- **WHEN** 處理對 API 的請求時
- **THEN** 回應的 `data` 物件必須同時包含 `month` 與 `allTime` 兩個陣列，無論有無帶入任何 URL 參數。

##### Example: 雙重時間範圍回應
- **GIVEN** GA4 資料中，本月 "/a" 頁面有 100 PV，所有時間 "/a" 頁面有 500 PV
- **WHEN** 發送請求
- **THEN** 回應中的 `data` JSON 必須如下：
  ```json
  {
    "month": [ { "path": "/a", "pv": 100 } ],
    "allTime": [ { "path": "/a", "pv": 500 } ]
  }
  ```

### Requirement: Netlify Blobs 快取與降級回退機制 (Netlify Blobs Caching and Fallback)
Use Case 層必須能動態產生 cache key（格式為：`popular:regex=<regex>:start=<start>:end=<end>`）。在 GA4 請求成功時將資料存入 `analytics-storage` Blobs 中；若 GA4 請求失敗，則必須降級 (fallback) 讀取 Blobs 中的快取資料。

#### Scenario: GA4 失敗且快取命中的回退情境
- **WHEN** GA4 客戶端連線失敗或拋出錯誤，且 Blobs 儲存庫內仍有備份快取時
- **THEN** Use Case 必須攔截錯誤，從 Blobs 提取備份，並成功回傳歷史快取資料。

#### Scenario: GA4 成功時的快取寫入
- **WHEN** 系統成功從 GA4 獲取資料
- **THEN** Use Case 必須將最新資料與時間戳記寫入 Blobs 快取中，並回傳這些最新資料給前端。
