# api-edge-security Specification

## Purpose

TBD - created by archiving change 'api-security-optimization'. Update Purpose after archive.

## Requirements

### Requirement: Edge Route and Method Restrictions
The system SHALL use Netlify Functions Config to define paths and strictly limit allowed HTTP methods at the edge level.

#### Scenario: Blocking unsupported HTTP methods
- **WHEN** a client sends a POST request to the API endpoint
- **THEN** the edge node immediately rejects the request with HTTP 405 Method Not Allowed without executing the function

#### Scenario: Allowing valid methods
- **WHEN** a client sends a GET or OPTIONS request to the API endpoint
- **THEN** the edge node allows the request to reach the function execution context


<!-- @trace
source: api-security-optimization
updated: 2026-05-28
code:
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - AGENTS.md
  - utils/apiWrapper.ts
  - functions/popular-posts.ts
  - .agents/skills/spectra-discuss/SKILL.md
  - package.json
  - .agents/skills/spectra-drift/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - utils/cors.ts
  - utils/response.ts
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - netlify.toml
  - functions/pageviews.ts
  - .agents/skills/spectra-propose/SKILL.md
  - RTK.md
  - utils/cors.ts
  - .agents/skills/spectra-apply/SKILL.md
tests:
  - utils/apiWrapper.test.ts
  - functions/function-config.test.ts
  - utils/cors.test.ts
-->

---
### Requirement: Edge Rate Limiting
The system SHALL enforce rate limits at the edge to protect API quota and execution limits.

#### Scenario: Client exceeds rate limit
- **WHEN** a single IP or domain exceeds 100 requests within a 60-second window
- **THEN** the edge node blocks subsequent requests with HTTP 429 Too Many Requests until the window expires

<!-- @trace
source: api-security-optimization
updated: 2026-05-28
code:
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - AGENTS.md
  - utils/apiWrapper.ts
  - functions/popular-posts.ts
  - .agents/skills/spectra-discuss/SKILL.md
  - package.json
  - .agents/skills/spectra-drift/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - utils/cors.ts
  - utils/response.ts
  - .agents/rules/antigravity-rtk-rules.md
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - netlify.toml
  - functions/pageviews.ts
  - .agents/skills/spectra-propose/SKILL.md
  - RTK.md
  - utils/cors.ts
  - .agents/skills/spectra-apply/SKILL.md
tests:
  - utils/apiWrapper.test.ts
  - functions/function-config.test.ts
  - utils/cors.test.ts
-->
