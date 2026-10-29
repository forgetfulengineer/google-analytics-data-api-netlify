# api-architecture-foundation Specification

## Purpose

TBD - created by archiving change 'setup-api-architecture-foundation'. Update Purpose after archive.

## Requirements

### Requirement: 型別化錯誤處理 (Typed Error Handling)
系統必須提供一個統一的型別化錯誤處理機制，將內部錯誤對應到特定的 HTTP 狀態碼與回應格式。

#### Scenario: 驗證失敗
- **WHEN** 請求的查詢參數無法通過 Zod schema 驗證
- **THEN** 系統拋出 `ValidationError`，並對應到 HTTP 400 狀態碼

##### Example: 驗證錯誤回應
- **GIVEN** 一個包含無效參數 `?type=invalid` 的請求
- **WHEN** 系統驗證參數時
- **THEN** 回應內容為 `{ "code": "VALIDATION_ERROR", "message": "Validation failed", "data": null, "errors": [{ "field": "path", "reason": "Path must be a valid string" }] }`

#### Scenario: 上游服務連線失敗
- **WHEN** GA4 API 或其他上游服務回傳錯誤時
- **THEN** 系統拋出 `UpstreamError`，並對應到 HTTP 503 狀態碼


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
  - .agent
  - src/infrastructure/analyticsClient.ts
  - functions/pageviews.ts
  - src/schemas/pageviews.schema.ts
  - utils/apiWrapper.ts
  - src/lib/env.ts
  - .agents
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
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - AGENTS.md
  - utils/apiWrapper.ts
  - functions/popular-posts.ts
  - .agents/skills/spectra-discuss/SKILL.md
  - package.json
  - .agents/skills/spectra-drift/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - utils/cors.ts
  - utils/response.ts
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - netlify.toml
  - functions/pageviews.ts
  - .agents/skills/spectra-propose/SKILL.md
  - RTK.md
  - utils/cors.ts
  - .agents/skills/spectra-apply/SKILL.md
tests:
  - utils/apiWrapper.test.ts
  - functions/function-config.test.ts
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
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - AGENTS.md
  - utils/apiWrapper.ts
  - functions/popular-posts.ts
  - .agents/skills/spectra-discuss/SKILL.md
  - package.json
  - .agents/skills/spectra-drift/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - utils/cors.ts
  - utils/response.ts
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - netlify.toml
  - functions/pageviews.ts
  - .agents/skills/spectra-propose/SKILL.md
  - RTK.md
  - utils/cors.ts
  - .agents/skills/spectra-apply/SKILL.md
tests:
  - utils/apiWrapper.test.ts
  - functions/function-config.test.ts
  - utils/cors.test.ts
-->