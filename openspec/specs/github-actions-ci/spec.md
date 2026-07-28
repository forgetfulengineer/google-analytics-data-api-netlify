# github-actions-ci Specification

## Purpose

TBD - created by archiving change 'add-ci-workflow'. Update Purpose after archive.

## Requirements

### Requirement: GitHub Actions CI Pipeline Trigger
The system SHALL execute a Continuous Integration workflow automatically when a Pull Request is opened, synchronized, or reopened against the `main` branch.

#### Scenario: Pull request opened or updated
- **WHEN** a developer opens or updates a pull request targeting the `main` branch
- **THEN** the GitHub Actions CI workflow triggers and runs the quality check jobs

##### Example: Triggering on PR
- **GIVEN** a GitHub repository with branch protection on `main`
- **WHEN** a developer pushes a new commit to a PR branch targeting `main`
- **THEN** the CI workflow is queued and executed automatically


<!-- @trace
source: add-ci-workflow
updated: 2026-06-12
code:
  - .agents/rules/antigravity-rtk-rules.md
  - AGENTS.md
  - utils/apiWrapper.ts
  - src/repositories/analyticsRepository.ts
  - src/schemas/envSchema.ts
  - RTK.md
  - src/use-cases/getPageviews.ts
  - src/use-cases/getPopularPosts.ts
  - utils/cors.ts
  - .agents/rules/windows-terminal-execution-rules.md
  - .github/workflows/ci.yml
  - package.json
  - functions/popular-posts.ts
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
  - biome.json
  - src/errors/AppError.ts
  - src/infrastructure/analyticsClient.ts
  - functions/pageviews.ts
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
tests:
  - utils/response.test.ts
  - tests/functions/pageviews.test.ts
  - src/schemas/pageviews.schema.test.ts
  - utils/apiWrapper.test.ts
  - utils/cors.test.ts
  - src/repositories/analyticsRepository.test.ts
  - tests/functions/popular-posts.test.ts
  - src/use-cases/getPopularPosts.test.ts
  - src/use-cases/getPageviews.test.ts
  - tests/functions/function-config.test.ts
  - src/errors/AppError.test.ts
-->

---
### Requirement: Pipeline Execution Steps
The CI pipeline SHALL execute the following checks sequentially: dependency installation, formatting and linting via Biome, TypeScript type checking, and Vitest unit testing.

#### Scenario: Pipeline runs successfully
- **WHEN** the CI workflow is triggered
- **THEN** the workflow executes `npm install`
- **THEN** the workflow executes `npx @biomejs/biome ci .`
- **THEN** the workflow executes `npx tsc --noEmit`
- **THEN** the workflow executes `npm run test`
- **THEN** the pipeline reports a success status

##### Example: Successful execution
- **GIVEN** a codebase with no syntax, style, type, or logic errors
- **WHEN** the CI workflow executes
- **THEN** all steps exit with code 0 and the PR check turns green

#### Scenario: Pipeline fails on error
- **WHEN** the CI workflow encounters an error in any of its steps
- **THEN** the workflow halts execution
- **THEN** the pipeline reports a failure status to block the Pull Request

##### Example: Failing execution
- **GIVEN** a codebase with a failing Vitest unit test
- **WHEN** the CI workflow executes
- **THEN** the `npm run test` step exits with a non-zero code
- **THEN** subsequent steps are skipped and the PR check turns red


<!-- @trace
source: add-ci-workflow
updated: 2026-06-12
code:
  - .agents/rules/antigravity-rtk-rules.md
  - AGENTS.md
  - utils/apiWrapper.ts
  - src/repositories/analyticsRepository.ts
  - src/schemas/envSchema.ts
  - RTK.md
  - src/use-cases/getPageviews.ts
  - src/use-cases/getPopularPosts.ts
  - utils/cors.ts
  - .agents/rules/windows-terminal-execution-rules.md
  - .github/workflows/ci.yml
  - package.json
  - functions/popular-posts.ts
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
  - biome.json
  - src/errors/AppError.ts
  - src/infrastructure/analyticsClient.ts
  - functions/pageviews.ts
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
tests:
  - utils/response.test.ts
  - tests/functions/pageviews.test.ts
  - src/schemas/pageviews.schema.test.ts
  - utils/apiWrapper.test.ts
  - utils/cors.test.ts
  - src/repositories/analyticsRepository.test.ts
  - tests/functions/popular-posts.test.ts
  - src/use-cases/getPopularPosts.test.ts
  - src/use-cases/getPageviews.test.ts
  - tests/functions/function-config.test.ts
  - src/errors/AppError.test.ts
-->

---
### Requirement: Fast Linting and Formatting
The project SHALL enforce code style and perform static analysis using Biome, with rules matching modern Node.js standards (2 spaces indent, single quotes, trailing commas, semicolons).
The Biome configuration SHALL synchronize with `.gitignore` via VCS integration while using negative inclusion patterns (`!folder`) to exclude project-specific folders (e.g., `.agents`, `openspec`).

#### Scenario: Biome detects a formatting issue
- **WHEN** a developer runs `npx @biomejs/biome ci .` on unformatted code
- **THEN** Biome exits with a non-zero status code and reports the style violation

##### Example: Biome formatting error
- **GIVEN** a TypeScript file with incorrect indentation and missing trailing commas
- **WHEN** `npx @biomejs/biome ci .` runs
- **THEN** Biome prints a diff of the required formatting changes and exits with code 1

<!-- @trace
source: add-ci-workflow
updated: 2026-06-12
code:
  - .agents/rules/antigravity-rtk-rules.md
  - AGENTS.md
  - utils/apiWrapper.ts
  - src/repositories/analyticsRepository.ts
  - src/schemas/envSchema.ts
  - RTK.md
  - src/use-cases/getPageviews.ts
  - src/use-cases/getPopularPosts.ts
  - utils/cors.ts
  - .agents/rules/windows-terminal-execution-rules.md
  - .github/workflows/ci.yml
  - package.json
  - functions/popular-posts.ts
  - .agents/skills/netlify-functions-api-architecture/references/layer-examples.md
  - .agents/skills/netlify-functions-api-architecture/references/response-patterns.md
  - biome.json
  - src/errors/AppError.ts
  - src/infrastructure/analyticsClient.ts
  - functions/pageviews.ts
  - .agents/skills/netlify-functions-api-architecture/SKILL.md
tests:
  - utils/response.test.ts
  - tests/functions/pageviews.test.ts
  - src/schemas/pageviews.schema.test.ts
  - utils/apiWrapper.test.ts
  - utils/cors.test.ts
  - src/repositories/analyticsRepository.test.ts
  - tests/functions/popular-posts.test.ts
  - src/use-cases/getPopularPosts.test.ts
  - src/use-cases/getPageviews.test.ts
  - tests/functions/function-config.test.ts
  - src/errors/AppError.test.ts
-->