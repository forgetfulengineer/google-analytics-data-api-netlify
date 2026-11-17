## ADDED Requirements

### Requirement: 統一的成功回應封裝 (Unified Success Response Envelope)
系統必須將所有成功的回應包裝在一個標準的統一 JSON 封裝中。

#### Scenario: 標準成功的 GET 查詢
- **WHEN** GET 請求成功完成 handler 的執行
- **THEN** 系統必須回傳 HTTP 200 狀態碼，並帶有一個包含 code、message、data 和 meta 屬性的封裝。

##### Example: 成功的 GET 回應結構
- **GIVEN** 成功的資料 `{ "foo": "bar" }`
- **WHEN** 回傳回應時
- **THEN** 回應主體的 JSON 必須符合：
  ```json
  {
    "code": "SUCCESS",
    "message": "Query successful",
    "data": {
      "foo": "bar"
    },
    "meta": {
      "timestamp": 1716019200000
    }
  }
  ```

### Requirement: 統一的錯誤回應封裝 (Unified Error Response Envelope)
系統必須將所有錯誤的回應包裝在一個標準的統一 JSON 封裝中，並在適用時提供欄位驗證錯誤資訊。

#### Scenario: 查詢參數驗證失敗
- **WHEN** 輸入的查詢參數驗證失敗
- **THEN** 系統必須回傳 HTTP 400 狀態碼，並帶有標準錯誤封裝以及扁平化的欄位驗證錯誤。

##### Example: 驗證失敗回應結構
- **GIVEN** "path" 欄位的驗證錯誤為："Path must be a valid string"
- **WHEN** 回傳回應時
- **THEN** 回應主體的 JSON 必須符合：
  ```json
  {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "data": null,
    "errors": [
      {
        "field": "path",
        "reason": "Path must be a valid string"
      }
    ]
  }
  ```
