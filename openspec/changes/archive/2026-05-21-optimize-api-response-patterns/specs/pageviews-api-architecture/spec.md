## MODIFIED Requirements

### Requirement: Structured API Response Contract
端點必須回傳一個包裝在統一成功封裝中的標準巢狀 JSON 結構，其中包含 site 物件（全站指標）與選填的 page 物件（特定頁面指標）。

#### Scenario: 全站流量請求
- **WHEN** 省略查詢參數 path 時
- **THEN** API 回應的 `data` 必須包含全站指標並省略 `page` 鍵值。

##### Example: 全站回應結構
- **GIVEN** GA4 全站數據：pv = 1000, uv = 500
- **WHEN** 發送不帶 path 參數的請求時
- **THEN** 回應主體的 JSON 必須符合：
  ```json
  {
    "code": "SUCCESS",
    "message": "Query successful",
    "data": {
      "site": {
        "pageviews": 1000,
        "visitors": 500
      }
    }
  }
  ```

#### Scenario: 特定頁面流量請求
- **WHEN** 提供查詢參數 path 時
- **THEN** API 回應的 `data` 必須同時包含全站指標與特定頁面指標。

##### Example: 特定頁面回應結構
- **GIVEN** GA4 全站數據：pv = 1000, uv = 500；且 "/about" 頁面數據：pv = 100, uv = 50
- **WHEN** 發送帶有查詢參數 `path=/about` 的請求時
- **THEN** 回應主體的 JSON 必須符合：
  ```json
  {
    "code": "SUCCESS",
    "message": "Query successful",
    "data": {
      "site": {
        "pageviews": 1000,
        "visitors": 500
      },
      "page": {
        "pageviews": 100,
        "visitors": 50
      }
    }
  }
  ```
