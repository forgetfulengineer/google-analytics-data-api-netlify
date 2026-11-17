## ADDED Requirements

### Requirement: CORS Exact Match Validation
The system SHALL validate the Origin header against the allowedOrigins list using exact matching or strict regular expressions, rather than loose string inclusion.

#### Scenario: Blocking spoofed localhost domains
- **WHEN** a request arrives with an Origin header like https://hacker-localhost.com
- **THEN** the system MUST reject the request and return an HTTP 403 Forbidden response

#### Scenario: Allowing valid localhost domains
- **WHEN** a request arrives with a valid localhost Origin (e.g., http://localhost:3000)
- **THEN** the system MUST allow the request if local development is permitted

### Requirement: CORS Preflight Handling with Caching
The system SHALL intercept HTTP OPTIONS requests and return an appropriate CORS preflight response containing Max-Age to reduce redundant preflight requests.

#### Scenario: Processing an OPTIONS request
- **WHEN** a client sends an HTTP OPTIONS request to the API
- **THEN** the system MUST immediately return an HTTP 204 No Content response containing the appropriate Access-Control-Allow-* headers and an Access-Control-Max-Age header
