## ADDED Requirements

### Requirement: Environment Configuration Schema
The system SHALL validate all process environment variables using a Zod schema before they are accessed by application logic.
The schema SHALL enforce that `PROPERTYID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `STARTDATE`, and `ENDDATE` are required string values.

#### Scenario: Valid environment variables
- **WHEN** all required environment variables are present and valid
- **THEN** the schema validation SHALL succeed and return a strongly typed configuration object

##### Example: Correct startup environment
- **GIVEN** `PROPERTYID` is "123456" and `STARTDATE` is "2024-01-01"
- **WHEN** the application loads the schema
- **THEN** the validation succeeds and returns an object with `{ PROPERTYID: "123456", STARTDATE: "2024-01-01" }`

#### Scenario: Missing required environment variables
- **WHEN** any required environment variable is missing or empty
- **THEN** the schema validation SHALL throw a ZodError

##### Example: Missing PROPERTYID
- **GIVEN** `PROPERTYID` is not set in the environment
- **WHEN** the application loads the schema
- **THEN** it throws a ZodError with path `PROPERTYID` and a "Required" message
