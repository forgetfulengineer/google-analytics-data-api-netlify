# env-config Specification

## Purpose
定義系統環境變數的管理規範與存取合約，規定全面透過 Netlify platform API (`Netlify.env.get()`) 進行讀取，透過 Zod 進行型別驗證，並在 `src/lib/env.ts` 中實作延遲評估（lazy evaluation）與記憶體快取。避免在模組載入期（module import time）發生無預期的例外導致 Netlify 輸出 HTML 錯誤頁，同時提供測試環境隔離重置機制（`resetEnv()`）。

## Requirements

### Requirement: Environment Configuration Schema
The system SHALL retrieve environment variables using Netlify platform API (`Netlify.env.get()`) and validate them using a Zod schema (`EnvSchema`) via a lazy evaluation function (`getEnv()`) when requested by application logic, rather than evaluating at module load time.
The schema SHALL enforce that `PROPERTYID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `STARTDATE`, and `ENDDATE` are required non-empty string values.
The schema SHALL allow optional `PAGEPATH_REGEX` and `ALLOWED_ORIGINS` string values. Feature flags (`ENABLE_PAGEVIEW`, `ENABLE_POPULAR`) SHALL be evaluated dynamically on per-request basis with default `'true'`.
The system SHALL cache the parsed configuration after the first successful evaluation, and SHALL provide a mechanism (`resetEnv()`) to clear the cached configuration in test environments.


#### Scenario: Valid environment variables
- **WHEN** all required environment variables are present and valid via `Netlify.env.get()` and `getEnv()` is invoked
- **THEN** the schema validation SHALL succeed, cache the result, and return a strongly typed configuration object

##### Example: Correct Netlify environment retrieval
- **GIVEN** `Netlify.env.get('PROPERTYID')` returns "123456" and `Netlify.env.get('STARTDATE')` returns "2024-01-01"
- **WHEN** `getEnv()` evaluates the configuration
- **THEN** the validation succeeds and returns an object with `{ PROPERTYID: "123456", STARTDATE: "2024-01-01" }`, plus optional values when provided

#### Scenario: Missing required environment variables
- **WHEN** any required environment variable is missing or returns empty string from `Netlify.env.get()` and `getEnv()` is invoked
- **THEN** `getEnv()` SHALL throw a ZodError without breaking module loading
- **AND** the system SHALL log the exact missing environment variable names to the server error log

##### Example: Missing PROPERTYID
- **GIVEN** `Netlify.env.get('PROPERTYID')` returns undefined or empty string
- **WHEN** `getEnv()` is invoked
- **THEN** it throws a ZodError with path `PROPERTYID` and a required error message

#### Scenario: Module import without environment variables
- **WHEN** `src/lib/env.ts` is imported by another module before environment variables are set
- **THEN** the module loading SHALL succeed without throwing an unhandled exception

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