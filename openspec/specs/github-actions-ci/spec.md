# github-actions-ci Specification

## Purpose
定義專案的 GitHub Actions 自動化工作流程規範，包含持續整合品質檢查（`ci.yml`）、靜態應用安全分析（`codeql.yml`）以及基於 Conventional Commits 的自動發版機制（`release-please.yml`），保障代碼品質、安全防護與可維護性。

## Requirements

### Requirement: GitHub Actions CI Pipeline Trigger and Concurrency
The system SHALL execute a Continuous Integration workflow automatically when commits are pushed to `main`, a Pull Request is opened/synchronized/reopened against `main`, or manually triggered via `workflow_dispatch`.
The workflow SHALL configure concurrency groups keyed by workflow name and branch reference, automatically cancelling in-progress runs for updated Pull Requests (`cancel-in-progress: true`).

#### Scenario: Pull request opened or updated
- **WHEN** a developer opens or updates a pull request targeting the `main` branch
- **THEN** the GitHub Actions CI workflow triggers and runs the quality check jobs
- **AND** any obsolete in-progress CI runs for the same PR are cancelled

##### Example: Triggering on PR
- **GIVEN** a GitHub repository with branch protection on `main`
- **WHEN** a developer pushes a new commit to a PR branch targeting `main`
- **THEN** the CI workflow is queued and executed automatically

---
### Requirement: Pipeline Execution Steps and Summary Report
The CI pipeline SHALL run on `ubuntu-latest` with Node.js 24 and execute the following checks sequentially: dependency installation via `npm ci`, formatting and linting via Biome, TypeScript type checking via `tsc --noEmit`, and Vitest unit testing via `npm test`.
The workflow SHALL collect step outcomes, generate a comprehensive Code Quality Report in `$GITHUB_STEP_SUMMARY`, and fail the overall job if any check encounters an error.

#### Scenario: Pipeline runs successfully
- **WHEN** all quality checks pass
- **THEN** the workflow outputs a green summary table to `$GITHUB_STEP_SUMMARY`
- **AND** the pipeline exits with code 0

#### Scenario: Pipeline reports detailed failure
- **WHEN** any check (Biome, TypeScript, or Vitest) fails
- **THEN** the summary table clearly marks which check failed
- **AND** the verification step logs the exact failure and exits with code 1 to block PR merge


<!-- @trace
source: add-ci-workflow
updated: 2026-06-12
code:
  - utils/apiWrapper.ts
  - src/repositories/analyticsRepository.ts
  - src/schemas/envSchema.ts
  - src/use-cases/getPageviews.ts
  - src/use-cases/getPopularPosts.ts
  - utils/cors.ts
  - .github/workflows/ci.yml
  - functions/popular-posts.ts
  - biome.json
  - src/errors/AppError.ts
  - src/infrastructure/analyticsClient.ts
  - functions/pageviews.ts
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
  - .github/workflows/ci.yml
  - biome.json
-->

---
### Requirement: Automated CodeQL Security Analysis
The system SHALL run GitHub CodeQL automated static analysis to detect security vulnerabilities, data leaks, and insecure coding patterns across TypeScript and JavaScript codebases.

#### Scenario: CodeQL analysis execution
- **WHEN** commits are pushed to `main`, a PR targets `main`, or on the scheduled monthly run (cron: `0 4 1 * *`)
- **THEN** the workflow initializes CodeQL with `languages: javascript-typescript` and `build-mode: none`
- **AND** performs analysis and uploads results to GitHub Advanced Security

<!-- @trace
source: add-codeql-workflow
updated: 2026-10-27
code:
  - .github/workflows/codeql.yml
-->

---
### Requirement: Automated Release Management via Release Please
The system SHALL automate package versioning, changelog generation, and GitHub release creation using Google `release-please-action` triggered upon pushes to `main`.

#### Scenario: Release PR generation and publishing
- **WHEN** changes following Conventional Commits are merged into `main`
- **THEN** Release Please evaluates commit history and creates or updates a release Pull Request
- **AND** when the release PR is merged, it tags the commit, creates a GitHub Release, and bumps `package.json` version automatically
- **AND** authenticates using a dedicated GitHub App Token (`RELEASE_APP_CLIENT_ID` / `RELEASE_APP_PRIVATE_KEY`) to support subsequent workflow triggering

<!-- @trace
source: add-release-please-workflow
updated: 2026-10-27
code:
  - .github/workflows/release-please.yml
-->