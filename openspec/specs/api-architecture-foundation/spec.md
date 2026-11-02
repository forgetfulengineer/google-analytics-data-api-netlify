# api-architecture-foundation Specification

## Purpose
定義 Netlify Functions API 的基礎架構與橫切關注點（Cross-Cutting Concerns），包括統一的 JSON 回應封裝（成功與錯誤信封）、自訂型別化錯誤處理（AppError 體系）、應用層 CORS 來源白名單與 preflight 快取，以及全生命週期錯誤攔截機制，確保所有端點皆回傳標準化、型別安全且一致的 JSON 格式。

## Requirements

### Requirement: 型別化錯誤處理 (Typed Error Handling)
系統必須提供統一的型別化錯誤繼承體系（`AppError`），將應用層與領域層錯誤精確映射至標準 HTTP 狀態碼與錯誤代碼：
- `ValidationError`: 400 (`VALIDATION_ERROR`)，包含詳細的欄位驗證錯誤陣列
- `NotFoundError`: 404 (`NOT_FOUND`)，用於資源不存在或功能開關停用
- `UpstreamError`: 503 (`UPSTREAM_ERROR`)，用於 GA4 上游服務連線失敗且無快取備援
- 其他未預期錯誤: 500 (`INTERNAL_SERVER_ERROR`)，隱藏敏感內部資訊

#### Scenario: 驗證失敗 (Validation Failure)
- **WHEN** 請求的查詢參數無法通過 Zod schema 驗證
- **THEN** 系統拋出 `ValidationError`，並對應到 HTTP 400 狀態碼

##### Example: 驗證錯誤回應
- **GIVEN** 一個包含無效參數 `?type=invalid` 的請求
- **WHEN** 系統驗證參數時
- **THEN** 回應內容為 `{ "code": "VALIDATION_ERROR", "message": "Validation failed", "data": null, "errors": [{ "field": "path", "reason": "Path must be a valid string" }] }`

#### Scenario: 資源或功能未找到 (Not Found)
- **WHEN** 請求的端點功能開關處於停用狀態（例如 `ENABLE_PAGEVIEW=false`）或拋出 `NotFoundError`
- **THEN** 系統回傳 HTTP 404 狀態碼，回應主體為 `{ "code": "NOT_FOUND", "message": "Not Found.", "data": null }`

#### Scenario: 上游服務連線失敗 (Upstream Error)
- **WHEN** GA4 API 或其他上游服務回傳錯誤且無可用備援快取時
- **THEN** 系統拋出 `UpstreamError`，並對應到 HTTP 503 狀態碼，回應主體為 `{ "code": "UPSTREAM_ERROR", "message": "GA4 service is currently unavailable and no cached backup was found.", "data": null }`

#### Scenario: 伺服器未預期內部錯誤 (Internal Server Error)
- **WHEN** 處理請求過程中發生未預期例外（非 AppError 衍生錯誤）
- **THEN** 系統捕獲該例外並記錄錯誤日誌，回傳 HTTP 500 狀態碼，回應主體為 `{ "code": "INTERNAL_SERVER_ERROR", "message": "Internal Server Error", "data": null }`，絕不暴露內部堆疊追蹤或環境細節



<!-- @trace
source: setup-api-architecture-foundation
updated: 2026-05-14
code:
  - src/errors/AppError.ts
-->

---
### Requirement: Schema 驗證層
The system SHALL use Zod to define and enforce validation schemas for environment variables and request parameters.
Environment variable validation errors during request handling SHALL be caught by the API wrapper, logging the exact missing or invalid field names to the server logs while returning a standard JSON error response to the client.

#### Scenario: 啟動時的環境變數驗證
- **WHEN** an API endpoint is invoked and required environment variables are missing or invalid
- **THEN** the API wrapper SHALL catch the validation error
- **AND** the system SHALL log the exact missing or invalid environment variable names to the server error log
- **AND** the API wrapper SHALL return a standard 500 Internal Server Error JSON response with code `INTERNAL_SERVER_ERROR`
- **AND** the response SHALL NOT contain HTML, sensitive configuration details, or stack traces

##### Example: 環境變數缺失錯誤
- **GIVEN** `PROPERTYID` environment variable is not set
- **WHEN** the API endpoint is invoked
- **THEN** the system SHALL return HTTP 500 with `{ "code": "INTERNAL_SERVER_ERROR", "message": "Internal Server Error", "data": null }` and `Content-Type: application/json`

#### Scenario: 請求參數驗證
- **WHEN** the handler receives a request
- **THEN** it SHALL parse and validate the parameters against the Zod query schema before passing them to the Use Case layer

##### Example: 成功的參數驗證
- **GIVEN** query string is `?path=/about`
- **WHEN** the system parses parameters using `PageviewsQuerySchema`
- **THEN** it SHALL succeed and proceed to the business logic layer


<!-- @trace
source: fix-netlify-functions-html-error
updated: 2026-10-29
code:
  - functions/popular-posts.ts
  - src/infrastructure/analyticsClient.ts
  - functions/pageviews.ts
  - src/schemas/pageviews.schema.ts
  - utils/apiWrapper.ts
  - src/lib/env.ts
tests:
  - tests/functions/popular-posts.test.ts
  - src/lib/env.test.ts
  - utils/apiWrapper.test.ts
  - tests/functions/function-config.test.ts
  - src/schemas/pageviews.schema.test.ts
  - tests/functions/pageviews.test.ts
-->

---
### Requirement: 統一的成功回應封裝 (Unified Success Response Envelope)
系統必須將所有成功的回應包裝在一個標準的統一 JSON 封裝中。

#### Scenario: 標準成功的 GET 查詢
- **WHEN** GET 請求成功完成 handler 的執行
- **THEN** 系統必須回傳 HTTP 200 狀態碼，並帶有一個包含 code、message、data 和選填 meta 屬性的封裝。

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
### Requirement: CORS Exact Match Validation
The system SHALL validate the Origin header against the allowedOrigins list using exact matching or strict regular expressions, rather than loose string inclusion.

#### Scenario: Blocking spoofed localhost domains
- **WHEN** a request arrives with an Origin header like https://hacker-localhost.com
- **THEN** the system MUST reject the request and return an HTTP 403 Forbidden response

#### Scenario: Allowing valid localhost domains
- **WHEN** a request arrives with a valid localhost Origin (e.g., http://localhost:3000)
- **THEN** the system MUST allow the request if local development is permitted


<!-- @trace
source: api-security-optimization
updated: 2026-05-28
code:
  - utils/apiWrapper.ts
  - utils/cors.ts
tests:
  - utils/apiWrapper.test.ts
  - utils/cors.test.ts
-->

---
### Requirement: CORS Preflight Handling with Caching
The system SHALL intercept HTTP OPTIONS requests and return an appropriate CORS preflight response containing Max-Age to reduce redundant preflight requests.

#### Scenario: Processing an OPTIONS request
- **WHEN** a client sends an HTTP OPTIONS request to the API
- **THEN** the system MUST immediately return an HTTP 204 No Content response containing the appropriate Access-Control-Allow-* headers and an Access-Control-Max-Age header

<!-- @trace
source: api-security-optimization
updated: 2026-05-28
code:
  - utils/apiWrapper.ts
  - functions/popular-posts.ts
  - functions/pageviews.ts
tests:
  - utils/apiWrapper.test.ts
  - functions/function-config.test.ts
-->