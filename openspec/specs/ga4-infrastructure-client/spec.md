# ga4-infrastructure-client Specification

## Purpose

TBD - created by archiving change 'setup-api-architecture-foundation'. Update Purpose after archive.

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
  - .spectra.yaml
  - scratch/test-analytics-client.ts
  - scratch/test-env-schema.ts
  - temp_design.md
  - src/infrastructure/analyticsClient.ts
  - src/errors/AppError.ts
  - src/schemas/envSchema.ts
  - temp_proposal.md
  - temp_spec2.md
  - package.json
  - temp_tasks.md
  - temp_spec1.md
  - deno.lock
  - tsconfig.json
  - scratch/test-errors.ts
-->

---
### Requirement: 明確的認證錯誤處理 (Explicit Authentication Error Handling)
系統在建立 GA4 客戶端時，必須明確驗證 Service Account JSON 憑證，若設定無效則立即失敗 (fail fast)。

#### Scenario: 憑證缺失
- **WHEN** `GOOGLE_APPLICATION_CREDENTIALS_JSON` 環境變數缺失時
- **THEN** 系統必須在嘗試建立客戶端之前，拋出提示缺少環境變數的錯誤

##### Example: 憑證缺失錯誤訊息
- **GIVEN** `GOOGLE_APPLICATION_CREDENTIALS_JSON` 未設定
- **WHEN** 嘗試呼叫 `getAnalyticsClient()`
- **THEN** 拋出 `Error: Missing environment variable: GOOGLE_APPLICATION_CREDENTIALS_JSON`

#### Scenario: 無效的 JSON 憑證
- **WHEN** `GOOGLE_APPLICATION_CREDENTIALS_JSON` 環境變數包含無效的 JSON 格式字串時
- **THEN** 系統必須拋出提示憑證格式無效的錯誤

##### Example: JSON 解析失敗錯誤訊息
- **GIVEN** `GOOGLE_APPLICATION_CREDENTIALS_JSON` 設為 `invalid-json-string`
- **WHEN** 嘗試呼叫 `getAnalyticsClient()`
- **THEN** 拋出 `Error: Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON: ...`

<!-- @trace
source: setup-api-architecture-foundation
updated: 2026-05-14
code:
  - .spectra.yaml
  - scratch/test-analytics-client.ts
  - scratch/test-env-schema.ts
  - temp_design.md
  - src/infrastructure/analyticsClient.ts
  - src/errors/AppError.ts
  - src/schemas/envSchema.ts
  - temp_proposal.md
  - temp_spec2.md
  - package.json
  - temp_tasks.md
  - temp_spec1.md
  - deno.lock
  - tsconfig.json
  - scratch/test-errors.ts
-->
