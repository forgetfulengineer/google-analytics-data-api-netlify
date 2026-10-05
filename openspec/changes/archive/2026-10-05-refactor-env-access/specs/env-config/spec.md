## MODIFIED Requirements

### Requirement: Environment Configuration Schema
The system SHALL retrieve environment variables using Netlify platform API (`Netlify.env.get()`) and validate them using a Zod schema before they are accessed by application logic.
The schema SHALL enforce that `PROPERTYID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `STARTDATE`, and `ENDDATE` are required non-empty string values.
The schema SHALL allow optional `PAGEPATH_REGEX` and `ALLOWED_ORIGINS` string values.

#### Scenario: Valid environment variables
- **WHEN** all required environment variables are present and valid via `Netlify.env.get()`
- **THEN** the schema validation SHALL succeed and return a strongly typed configuration object

##### Example: Correct Netlify environment retrieval
- **GIVEN** `Netlify.env.get('PROPERTYID')` returns "123456" and `Netlify.env.get('STARTDATE')` returns "2024-01-01"
- **WHEN** `src/lib/env.ts` evaluates the configuration
- **THEN** the validation succeeds and returns an object with `{ PROPERTYID: "123456", STARTDATE: "2024-01-01" }`, plus optional values when provided

#### Scenario: Missing required environment variables
- **WHEN** any required environment variable is missing or returns empty string from `Netlify.env.get()`
- **THEN** the schema validation SHALL throw a ZodError

##### Example: Missing PROPERTYID
- **GIVEN** `Netlify.env.get('PROPERTYID')` returns undefined or empty string
- **WHEN** `src/lib/env.ts` validates the environment variables
- **THEN** it throws a ZodError with path `PROPERTYID` and a required error message
