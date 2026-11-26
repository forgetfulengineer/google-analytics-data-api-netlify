## MODIFIED Requirements

### Requirement: Netlify Runtime Simulation in Test Setup
The test suite SHALL provide global runtime simulation for Netlify platform globals in `tests/setup.ts` backed by isolated `vitest.config.ts` configuration (`envDir: false` and explicit `test.env` defaults), automatically provisioning mock `Netlify.env` before each test suite execution with standard test defaults covering all application-read environment variables while preventing any `.env` or `.env.local` files from being loaded into the test process.

#### Scenario: Running tests against Netlify platform APIs
- **WHEN** tests access `Netlify.env.get()` or execute functions relying on Netlify globals
- **THEN** Vitest disables `.env*` file loading via `envDir: false` and injects standard test defaults for all application-read environment variables via `test.env` in `vitest.config.ts`
- **AND** `tests/setup.ts` proxies `Netlify.env.get()` to `process.env`
- **AND** permits tests to override environment variables via `vi.stubEnv()` or mock resets without throwing reference errors

##### Example: Default mock environment variables
- **GIVEN** a test suite execution even when a local `.env` file exists with real credentials
- **WHEN** `Netlify.env.get('PROPERTYID')` is accessed
- **THEN** the return value is the standard test default `'123456'` from `vitest.config.ts` `test.env`
- **WHEN** `vi.stubEnv('PROPERTYID', 'custom-id')` is called
- **THEN** `Netlify.env.get('PROPERTYID')` returns `'custom-id'`
