## ADDED Requirements

### Requirement: 型別化錯誤處理 (Typed Error Handling)
系統必須提供一個統一的型別化錯誤處理機制，將內部錯誤對應到特定的 HTTP 狀態碼與回應格式。

#### Scenario: 驗證失敗
- **WHEN** 請求的查詢參數無法通過 Zod schema 驗證
- **THEN** 系統拋出 `ValidationError`，並對應到 HTTP 400 狀態碼

##### Example: 驗證錯誤回應
- **GIVEN** 一個包含無效參數 `?type=invalid` 的請求
- **WHEN** 系統驗證參數時
- **THEN** 回應內容為 `{ "error": "Validation failed", "details": { "type": ["Invalid enum value"] } }`

#### Scenario: 上游服務連線失敗
- **WHEN** GA4 API 或其他上游服務回傳錯誤時
- **THEN** 系統拋出 `UpstreamError`，並對應到 HTTP 503 狀態碼

### Requirement: Schema 驗證層
系統必須使用 Zod 定義與強制執行環境變數與請求參數的驗證 Schema。

#### Scenario: 啟動時的環境變數驗證
- **WHEN** 模組載入且環境變數缺失時
- **THEN** schema 驗證會同步失敗，阻止模組啟動

##### Example: 環境變數缺失錯誤
- **GIVEN** 未設定 `PROPERTYID` 環境變數
- **WHEN** 啟動服務或載入模組時
- **THEN** 系統拋出 `ZodError` 顯示 `PROPERTYID` 缺失

#### Scenario: 請求參數驗證
- **WHEN** handler 接收到請求
- **THEN** 在將參數傳遞給 Use Case 層之前，會先根據 Zod query schema 進行解析與驗證

##### Example: 成功的參數驗證
- **GIVEN** 查詢字串為 `?type=month`
- **WHEN** 系統使用 `QuerySchema` 解析參數時
- **THEN** 解析成功並進入業務邏輯層
