# api-edge-security Specification

## Purpose
定義 Netlify Functions v2 的邊緣安全層（Edge Security Layer）規範，透過宣告式 `config` 在邊緣網路（Edge）預先過濾非法 HTTP 方法、設定 API 路由路徑，並啟用邊緣速率限制（Edge Rate Limiting），結合應用層防禦形成多層次縱深防護架構，確保系統高可用性並保護 GA4 配額。

## Requirements

### Requirement: Edge Route and Method Restrictions
The system SHALL use Netlify Functions Config to define paths and strictly limit allowed HTTP methods at the edge level to `GET` and `OPTIONS`. Any other HTTP methods SHALL be rejected at the edge without invoking the serverless execution environment.

#### Scenario: Blocking unsupported HTTP methods
- **WHEN** a client sends an unsupported HTTP method (e.g., POST, PUT, DELETE, PATCH) to an API endpoint
- **THEN** the edge node immediately rejects the request with HTTP 405 Method Not Allowed without executing the function logic

#### Scenario: Allowing valid methods
- **WHEN** a client sends a GET or OPTIONS request to the configured API endpoint
- **THEN** the edge node allows the request to reach the function execution context

##### Example: Netlify Function Config definition
- **GIVEN** function configuration exported as `export const config: Config`
- **WHEN** deployed to Netlify Functions v2
- **THEN** the function config explicitly defines `method: ['GET', 'OPTIONS']` and the specific API path

<!-- @trace
source: api-security-optimization
updated: 2026-05-28
code:
  - functions/popular-posts.ts
  - functions/pageviews.ts
  - utils/apiWrapper.ts
tests:
  - tests/functions/function-config.test.ts
  - utils/apiWrapper.test.ts
-->

---
### Requirement: Edge Rate Limiting
The system SHALL enforce rate limits at the edge via Netlify Functions Config `rateLimit` settings to protect upstream API quota and prevent resource exhaustion attacks.

#### Scenario: Client exceeds rate limit
- **WHEN** a client (aggregated by IP and domain) exceeds 100 requests within a 60-second window (`windowLimit: 100`, `windowSize: 60`)
- **THEN** the edge node blocks subsequent requests with HTTP 429 Too Many Requests until the window expires

##### Example: Rate limit configuration
- **GIVEN** standard function config in `pageviews.ts` or `popular-posts.ts`
- **WHEN** the edge configuration is parsed
- **THEN** `rateLimit` is configured as `{ windowLimit: 100, windowSize: 60, aggregateBy: ['ip', 'domain'] }`


<!-- @trace
source: api-security-optimization
updated: 2026-05-28
code:
  - functions/popular-posts.ts
  - functions/pageviews.ts
tests:
  - functions/function-config.test.ts
-->
