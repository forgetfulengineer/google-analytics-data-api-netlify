## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: CORS Preflight Handling with Caching
The system SHALL intercept HTTP OPTIONS requests and return an appropriate CORS preflight response containing Max-Age to reduce redundant preflight requests, regardless of whether GA4 environment variables are configured.

#### Scenario: Processing an OPTIONS request
- **WHEN** a client sends an HTTP OPTIONS request to the API
- **THEN** the system MUST immediately return an HTTP 204 No Content response containing the appropriate Access-Control-Allow-* headers and an Access-Control-Max-Age header
- **AND** the response MUST be returned even when GA4 environment variables are missing

#### Scenario: Feature flag evaluation with blank strings
- **WHEN** a feature flag environment variable is set to an empty string
- **THEN** the system MUST evaluate the flag as enabled by defaulting to `true`

### Requirement: CORS Exact Match Validation
The system SHALL validate the Origin header against the allowedOrigins list using exact matching or strict regular expressions, rather than loose string inclusion. Direct requests without an Origin header SHALL be permitted without applying CORS restrictions.

#### Scenario: Blocking spoofed localhost domains
- **WHEN** a request arrives with an Origin header like https://hacker-localhost.com
- **THEN** the system MUST reject the request and return an HTTP 403 Forbidden response

#### Scenario: Allowing valid localhost domains
- **WHEN** a request arrives with a valid localhost Origin (e.g., http://localhost:3000)
- **THEN** the system MUST allow the request if local development is permitted

#### Scenario: Allowing direct requests without Origin header
- **WHEN** a request arrives without an Origin header (such as direct browser navigation or non-CORS client)
- **THEN** the system MUST allow the request to proceed regardless of ALLOWED_ORIGINS configuration

##### Example: Direct navigation to pageviews endpoint
- **GIVEN** ALLOWED_ORIGINS is configured as "https://forgetfulengineer.github.io"
- **WHEN** a client performs a GET request with no Origin header
- **THEN** the system MUST allow the request and return HTTP 200
