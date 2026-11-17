## MODIFIED Requirements

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
