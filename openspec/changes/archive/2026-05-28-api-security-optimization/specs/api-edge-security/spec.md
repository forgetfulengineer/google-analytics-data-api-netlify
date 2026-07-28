## ADDED Requirements

### Requirement: Edge Route and Method Restrictions
The system SHALL use Netlify Functions Config to define paths and strictly limit allowed HTTP methods at the edge level.

#### Scenario: Blocking unsupported HTTP methods
- **WHEN** a client sends a POST request to the API endpoint
- **THEN** the edge node immediately rejects the request with HTTP 405 Method Not Allowed without executing the function

#### Scenario: Allowing valid methods
- **WHEN** a client sends a GET or OPTIONS request to the API endpoint
- **THEN** the edge node allows the request to reach the function execution context

### Requirement: Edge Rate Limiting
The system SHALL enforce rate limits at the edge to protect API quota and execution limits.

#### Scenario: Client exceeds rate limit
- **WHEN** a single IP or domain exceeds 100 requests within a 60-second window
- **THEN** the edge node blocks subsequent requests with HTTP 429 Too Many Requests until the window expires
