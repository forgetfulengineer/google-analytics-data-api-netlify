## MODIFIED Requirements

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
