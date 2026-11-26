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
Environment variable validation errors during request handling SHALL be caught by the API wrapper, logging the exact missing or invalid field names to the server logs while returning a standard JSON error response to the client. Preflight requests, unsupported HTTP methods, and disabled endpoint checks MUST be processed before environment variable validation occurs.

#### Scenario: 啟動時的環境變數驗證
- **WHEN** an API endpoint is invoked with a GET request and required environment variables are missing or invalid
- **THEN** the API wrapper SHALL catch the validation error
- **AND** the system SHALL log the exact missing or invalid environment variable names to the server error log
- **AND** the API wrapper SHALL return a standard 500 Internal Server Error JSON response with code `INTERNAL_SERVER_ERROR`
- **AND** the response SHALL apply the calculated CORS origin policy based on ALLOWED_ORIGINS rather than defaulting to `*`
- **AND** the response SHALL NOT contain HTML, sensitive configuration details, or stack traces

#### Scenario: 請求參數驗證
- **WHEN** the handler receives a request
- **THEN** it SHALL parse and validate the parameters against the Zod query schema before passing them to the Use Case layer

##### Example: 成功的參數驗證
- **GIVEN** query string is `?path=/about`
- **WHEN** the system parses parameters using `PageviewsQuerySchema`
- **THEN** it SHALL succeed and proceed to the business logic layer


<!-- @trace
source: refactor-api-wrapper-lifecycle
updated: 2026-11-19
code:
  - utils/apiWrapper.ts
  - utils/cors.ts
tests:
  - utils/apiWrapper.test.ts
  - utils/cors.test.ts
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
The system SHALL validate the Origin header against the allowedOrigins list using exact matching or strict regular expressions, rather than loose string inclusion. If allowedOrigins includes the wildcard "*", the system SHALL permit requests from any origin. Individual origin entries in ALLOWED_ORIGINS SHALL be trimmed of surrounding whitespace and filtered of empty values upon parsing. Direct requests without an Origin header SHALL be permitted without applying CORS restrictions.

#### Scenario: Blocking spoofed localhost domains
- **WHEN** a request arrives with an Origin header like https://hacker-localhost.com
- **THEN** the system MUST reject the request and return an HTTP 403 Forbidden response

#### Scenario: Allowing valid localhost domains
- **WHEN** a request arrives with a valid localhost Origin (e.g., http://localhost:3000 or https://localhost:8443)
- **THEN** the system MUST allow the request if local development is permitted

#### Scenario: Allowing wildcard origin configuration
- **WHEN** ALLOWED_ORIGINS is configured to include the wildcard "*"
- **THEN** the system MUST allow requests from any origin

#### Scenario: Sanitizing origin whitelist entries
- **WHEN** ALLOWED_ORIGINS contains whitespace around commas or redundant empty values
- **THEN** the system MUST trim surrounding spaces and filter empty entries before origin validation

##### Example: Whitelist with extra spaces and empty entries
- **GIVEN** ALLOWED_ORIGINS is configured as "https://example.com, https://blog.example.com, "
- **WHEN** a client performs a GET request with Origin "https://blog.example.com"
- **THEN** the system MUST allow the request and return HTTP 200

#### Scenario: Allowing direct requests without Origin header
- **WHEN** a request arrives without an Origin header (such as direct browser navigation or non-CORS client)
- **THEN** the system MUST allow the request to proceed regardless of ALLOWED_ORIGINS configuration

##### Example: Direct navigation to pageviews endpoint
- **GIVEN** ALLOWED_ORIGINS is configured as "https://forgetfulengineer.github.io"
- **WHEN** a client performs a GET request with no Origin header
- **THEN** the system MUST allow the request and return HTTP 200


<!-- @trace
source: align-cors-spec-and-sanitization
updated: 2026-11-25
code:
  - utils/apiWrapper.ts
  - utils/cors.ts
tests:
  - utils/apiWrapper.test.ts
  - utils/cors.test.ts
-->

---
### Requirement: CORS Preflight Handling with Caching
The system SHALL intercept HTTP OPTIONS requests and return an appropriate CORS preflight response containing Max-Age to reduce redundant preflight requests, regardless of whether GA4 environment variables are configured.

#### Scenario: Processing an OPTIONS request
- **WHEN** a client sends an HTTP OPTIONS request to the API
- **THEN** the system MUST immediately return an HTTP 204 No Content response containing the appropriate Access-Control-Allow-* headers and an Access-Control-Max-Age header
- **AND** the response MUST be returned even when GA4 environment variables are missing

#### Scenario: Feature flag evaluation with blank strings
- **WHEN** a feature flag environment variable is set to an empty string
- **THEN** the system MUST evaluate the flag as enabled by defaulting to `true`


<!-- @trace
source: refactor-api-wrapper-lifecycle
updated: 2026-11-19
code:
  - utils/apiWrapper.ts
  - utils/cors.ts
tests:
  - utils/apiWrapper.test.ts
  - utils/cors.test.ts
-->

---
### Requirement: Selective CDN Cache Headers Injection
The system SHALL inject endpoint-specific extraHeaders (including durable CDN cache headers) ONLY on successful (HTTP 2xx) responses. Error responses (HTTP 4xx and 5xx) and CORS preflight responses (HTTP 204) MUST NOT contain durable CDN cache headers.

#### Scenario: Successful request receives cache headers
- **WHEN** a valid GET request is successfully processed by the handler
- **THEN** the system MUST return HTTP 200 with all configured extraHeaders including durable CDN cache control headers

#### Scenario: Error response omits durable cache headers
- **WHEN** a request results in an error response (such as 400, 403, 404, 405, or 500)
- **THEN** the response MUST NOT include Netlify-CDN-Cache-Control or Netlify-Vary headers

#### Scenario: Preflight response omits durable cache headers
- **WHEN** a client sends an HTTP OPTIONS preflight request
- **THEN** the 204 response MUST NOT include Netlify-CDN-Cache-Control or Netlify-Vary headers

<!-- @trace
source: refactor-api-wrapper-lifecycle
updated: 2026-11-19
code:
  - utils/apiWrapper.ts
  - utils/cors.ts
tests:
  - utils/apiWrapper.test.ts
  - utils/cors.test.ts
-->