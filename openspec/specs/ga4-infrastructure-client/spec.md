# ga4-infrastructure-client Specification

## Purpose
規範 Google Analytics 4 (GA4) 底層用戶端（Infrastructure Client）的建構、生命週期與認證流程。以模組級單例模式（module-level singleton）管理 `BetaAnalyticsDataClient`，優化 Serverless 暖啟動效能，並在執行時透過 `getEnv()` 取得 Service Account 憑證進行強固的錯誤處理與防禦。

## Requirements

### Requirement: 單例 GA4 客戶端初始化 (Singleton GA4 Client Initialization)
系統必須在基礎設施 (Infrastructure) 層以模組級別單例 (module-level singleton) 的模式初始化 GA4 `BetaAnalyticsDataClient`，以避免在 Lambda 暖開機 (warm start) 時重複建立連線。

#### Scenario: 同一個暖啟動實例上的多次請求
- **WHEN** 在同一個暖開機的 Lambda 實例上，處理不同的 HTTP 請求並多次呼叫 `getAnalyticsClient` 函式時
- **THEN** 回傳的必須是在第一次呼叫時就已初始化的同一個客戶端實例

##### Example: 單例記憶體參考檢查
- **GIVEN** 一個暖開機的 Lambda 實例
- **WHEN** 呼叫 `clientA = getAnalyticsClient()` 與 `clientB = getAnalyticsClient()`
- **THEN** `clientA === clientB` 為真


<!-- @trace
source: setup-api-architecture-foundation
updated: 2026-05-14
code:
  - src/infrastructure/analyticsClient.ts
-->

---
### Requirement: 明確的認證錯誤處理 (Explicit Authentication Error Handling)
系統在建立 GA4 客戶端時，必須明確透過 `getEnv()` 取得 Service Account JSON 憑證，並在 JSON 解析或憑證無效時立即失敗 (fail fast)，拋出描述性錯誤訊息供上層捕獲。

#### Scenario: 憑證缺失或無效
- **WHEN** `GOOGLE_APPLICATION_CREDENTIALS_JSON` 環境變數缺失或不是合法的 JSON 格式字串時
- **THEN** 系統必須在嘗試建立客戶端時，拋出帶有前綴 `Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON:` 的錯誤

##### Example: 憑證無效錯誤訊息
- **GIVEN** `GOOGLE_APPLICATION_CREDENTIALS_JSON` 設為 `invalid-json-string` 或缺失
- **WHEN** 嘗試呼叫 `getAnalyticsClient()`
- **THEN** 拋出 `Error: Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON: ...`


<!-- @trace
source: setup-api-architecture-foundation
updated: 2026-05-14
code:
  - src/infrastructure/analyticsClient.ts
-->
