## MODIFIED Requirements

### Requirement: Environment Configuration Schema
The system SHALL retrieve environment variables using Netlify platform API (`Netlify.env.get()`) and validate them using a Zod schema via a lazy evaluation function (`getEnv()`) when requested by application logic, rather than evaluating at module load time.
The schema SHALL enforce that `PROPERTYID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `STARTDATE`, and `ENDDATE` are required non-empty string values.
The schema SHALL allow optional `PAGEPATH_REGEX` and `ALLOWED_ORIGINS` string values.
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
