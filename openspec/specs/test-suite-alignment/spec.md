# test-suite-alignment Specification

## Purpose

TBD - created by archiving change 'test-suite-alignment'. Update Purpose after archive.

## Requirements

### Requirement: Test files stay outside deployable Netlify Functions

The test suite MUST NOT place test files under the deployable `functions/` directory. Netlify Function entry tests SHALL live under a non-deployable test directory such as `tests/functions/`.

#### Scenario: Function entry tests are isolated from deployment

- **WHEN** the test suite includes tests for `pageviews` or `popular-posts` function entry behavior
- **THEN** those test files SHALL live outside `functions/`
- **THEN** no file matching a test file naming pattern SHALL be added under `functions/`

##### Example: accepted and rejected locations

| Test Target | Accepted Location | Rejected Location |
| --- | --- | --- |
| pageviews function entry | `tests/functions/pageviews.test.ts` | `functions/pageviews.test.ts` |
| popular-posts function entry | `tests/functions/popular-posts.test.ts` | `functions/popular-posts.test.ts` |


<!-- @trace
source: test-suite-alignment
updated: 2026-06-10
code:
  - RTK.md
  - .agents/rules/windows-terminal-execution-rules.md
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - AGENTS.md
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
tests:
  - src/repositories/analyticsRepository.test.ts
  - src/schemas/pageviews.schema.test.ts
  - tests/functions/popular-posts.test.ts
  - utils/apiWrapper.test.ts
-->

---
### Requirement: Repository tests use mocked GA4 clients only

Repository tests that exercise GA4 request construction or GA4 response mapping MUST mock the analytics client module. They MUST NOT instantiate a real `BetaAnalyticsDataClient`, perform network requests to Google Analytics Data API, or consume GA4 API quota.

#### Scenario: Repository request shape verification uses a fake batchRunReports

- **WHEN** a repository test verifies the request shape for `fetchPageviews` or `fetchPopularPosts`
- **THEN** the test SHALL mock `getAnalyticsClient`
- **THEN** the mocked client SHALL expose a fake `batchRunReports`
- **THEN** assertions SHALL inspect the arguments passed to the fake `batchRunReports`

##### Example: fake GA4 response mapping

| Repository Function | Fake GA4 Report Input | Expected Domain Output |
| --- | --- | --- |
| `fetchPageviews` | `screenPageViews=100`, `activeUsers=40` | `site.pageviews=100`, `site.activeUsers=40` |
| `fetchPopularPosts` | month path `/a` with `10`, all-time path `/a` with `100` | `month[0].pageviews=10`, `allTime[0].pageviews=100` |

#### Scenario: Repository tests block real GA4 integration

- **WHEN** repository tests are executed by `npm test`
- **THEN** no test SHALL require real `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- **THEN** no test SHALL create a real GA4 SDK client
- **THEN** no test SHALL depend on network access or external GA4 quota


<!-- @trace
source: test-suite-alignment
updated: 2026-06-10
code:
  - RTK.md
  - .agents/rules/windows-terminal-execution-rules.md
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - AGENTS.md
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
tests:
  - src/repositories/analyticsRepository.test.ts
  - src/schemas/pageviews.schema.test.ts
  - tests/functions/popular-posts.test.ts
  - utils/apiWrapper.test.ts
-->

---
### Requirement: API wrapper tests cover shared HTTP behavior

The test suite SHALL cover shared `apiWrapper` behavior for CORS denial, unsupported methods, feature flags, success response wrapping, known application errors, unknown errors, and extra response headers.

#### Scenario: Shared wrapper guards do not execute handler logic

- **WHEN** `apiWrapper` rejects a request due to CORS, unsupported HTTP method, or disabled feature flag
- **THEN** it SHALL return the expected HTTP error response
- **THEN** it SHALL NOT execute the provided handler function

#### Scenario: Shared wrapper appends extra headers to generated responses

- **WHEN** `apiWrapper` receives `extraHeaders`
- **THEN** success responses SHALL include those headers
- **THEN** error responses generated after handler execution SHALL include those headers


<!-- @trace
source: test-suite-alignment
updated: 2026-06-10
code:
  - RTK.md
  - .agents/rules/windows-terminal-execution-rules.md
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - AGENTS.md
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
tests:
  - src/repositories/analyticsRepository.test.ts
  - src/schemas/pageviews.schema.test.ts
  - tests/functions/popular-posts.test.ts
  - utils/apiWrapper.test.ts
-->

---
### Requirement: Function handler tests verify real response envelopes

Function handler tests SHALL verify the real HTTP `Response` returned through `apiWrapper` unless the test is explicitly scoped to dependency wiring. Handler tests for `popular-posts` SHALL validate the standard success envelope and endpoint cache headers without mocking `apiWrapper`.

#### Scenario: popular-posts handler returns the standard success envelope

- **WHEN** the `popular-posts` handler receives a valid GET request and the use case returns fake popular post data
- **THEN** the handler SHALL return HTTP 200
- **THEN** the JSON body SHALL contain `code`, `message`, and `data`
- **THEN** `data` SHALL contain both `month` and `allTime`

#### Scenario: popular-posts handler exposes configured cache headers

- **WHEN** the `popular-posts` handler returns a successful response
- **THEN** it SHALL include `Cache-Control: public, max-age=0, must-revalidate`
- **THEN** it SHALL include `Netlify-CDN-Cache-Control: public, durable, s-maxage=21600, stale-while-revalidate=21600`
- **THEN** it SHALL NOT include `Netlify-Vary`


<!-- @trace
source: test-suite-alignment
updated: 2026-06-10
code:
  - RTK.md
  - .agents/rules/windows-terminal-execution-rules.md
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - AGENTS.md
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
tests:
  - src/repositories/analyticsRepository.test.ts
  - src/schemas/pageviews.schema.test.ts
  - tests/functions/popular-posts.test.ts
  - utils/apiWrapper.test.ts
-->

---
### Requirement: Low-value tests are clarified or removed

Tests SHALL reflect reachable behavior or documented unit-level contracts. A test that uses inputs unreachable through the real HTTP handler path MUST either be described as a schema contract test or removed.

#### Scenario: Pageviews schema non-string input is treated as schema-only coverage

- **WHEN** `PageviewsQuerySchema` is tested with a non-string `path`
- **THEN** the test name and assertion scope SHALL identify it as schema contract coverage
- **THEN** the test SHALL NOT imply that the HTTP handler naturally receives non-string query values from `URLSearchParams`

<!-- @trace
source: test-suite-alignment
updated: 2026-06-10
code:
  - RTK.md
  - .agents/rules/windows-terminal-execution-rules.md
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
  - AGENTS.md
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
tests:
  - src/repositories/analyticsRepository.test.ts
  - src/schemas/pageviews.schema.test.ts
  - tests/functions/popular-posts.test.ts
  - utils/apiWrapper.test.ts
-->