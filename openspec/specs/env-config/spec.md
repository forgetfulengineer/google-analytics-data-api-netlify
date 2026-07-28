# env-config Specification

## Purpose

TBD - created by archiving change 'refactor-env-check'. Update Purpose after archive.

## Requirements

### Requirement: Environment Configuration Schema
The system SHALL validate all process environment variables using a Zod schema before they are accessed by application logic.
The schema SHALL enforce that `PROPERTYID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `STARTDATE`, and `ENDDATE` are required string values.
The schema SHALL allow optional `PAGEPATH_REGEX` and `ALLOWED_ORIGINS` string values.

#### Scenario: Valid environment variables
- **WHEN** all required environment variables are present and valid
- **THEN** the schema validation SHALL succeed and return a strongly typed configuration object

##### Example: Correct startup environment
- **GIVEN** `PROPERTYID` is "123456" and `STARTDATE` is "2024-01-01"
- **WHEN** the application loads the schema
- **THEN** the validation succeeds and returns an object with `{ PROPERTYID: "123456", STARTDATE: "2024-01-01" }`, plus optional values when provided

#### Scenario: Missing required environment variables
- **WHEN** any required environment variable is missing or empty
- **THEN** the schema validation SHALL throw a ZodError

##### Example: Missing PROPERTYID
- **GIVEN** `PROPERTYID` is not set in the environment
- **WHEN** the application loads the schema
- **THEN** it throws a ZodError with path `PROPERTYID` and a "Required" message

<!-- @trace
source: refactor-env-check
updated: 2026-06-03
code:
  - RTK.md
  - AGENTS.md
  - functions/pageviews.ts
  - utils/apiWrapper.ts
  - .agents/rules/windows-terminal-execution-rules.md
  - src/schemas/envSchema.ts
  - .agents/rules/antigravity-rtk-rules.md
  - functions/popular-posts.ts
tests:
  - utils/apiWrapper.test.ts
-->
