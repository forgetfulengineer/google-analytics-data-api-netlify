## MODIFIED Requirements

### Requirement: Schema 驗證層
The system SHALL use Zod to define and enforce validation schemas for environment variables and request parameters. A ZodError thrown by the environment schema SHALL cause the module to fail fast during initialization, preventing execution and logging the exact missing fields to the server logs.

#### Scenario: 啟動時的環境變數驗證
- **WHEN** the module loads and required environment variables are missing
- **THEN** the schema validation SHALL fail immediately at the top level
- **AND** the API wrapper SHALL NOT catch this error, allowing the platform to return a generic 500 Internal Server Error without leaking config details

##### Example: 環境變數缺失錯誤
- **GIVEN** `PROPERTYID` environment variable is not set
- **WHEN** the API endpoint is invoked
- **THEN** the system SHALL return a generic 500 response, and log the ZodError details to the server console

#### Scenario: 請求參數驗證
- **WHEN** the handler receives a request
- **THEN** it SHALL parse and validate the parameters against the Zod query schema before passing them to the Use Case layer

##### Example: 成功的參數驗證
- **GIVEN** query string is `?type=month`
- **WHEN** the system parses parameters using `QuerySchema`
- **THEN** it SHALL succeed and proceed to the business logic layer
