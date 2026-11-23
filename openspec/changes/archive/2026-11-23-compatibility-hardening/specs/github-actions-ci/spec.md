## MODIFIED Requirements

### Requirement: Automated CodeQL Security Analysis
The system SHALL run GitHub CodeQL automated static analysis to detect security vulnerabilities, data leaks, and insecure coding patterns across TypeScript and JavaScript codebases exclusively within the upstream repository (`forgetfulengineer/google-analytics-data-api-netlify`). In forked or non-upstream repository environments, the CodeQL workflow job SHALL be skipped automatically to prevent failures from missing GitHub Advanced Security (GHAS) permissions or unneeded scheduled runs.

#### Scenario: CodeQL analysis execution in upstream repository
- **WHEN** commits are pushed to `main`, a PR targets `main`, or the scheduled monthly run (cron: `0 4 1 * *`) triggers within the upstream repository `forgetfulengineer/google-analytics-data-api-netlify`
- **THEN** the workflow initializes CodeQL with `languages: javascript-typescript` and `build-mode: none`
- **AND** performs analysis and uploads results to GitHub Advanced Security

#### Scenario: CodeQL analysis skipped in forked or non-upstream repository
- **WHEN** commits are pushed, a PR is opened, or a scheduled run triggers in a repository other than `forgetfulengineer/google-analytics-data-api-netlify`
- **THEN** the workflow skips the CodeQL analysis job without error
- **AND** does not require GitHub Advanced Security licensing or generate failure notifications

### Requirement: Automated Release Management via Release Please
The system SHALL automate package versioning, changelog generation, and GitHub release creation using Google `release-please-action` triggered upon pushes to `main` exclusively within the upstream repository (`forgetfulengineer/google-analytics-data-api-netlify`). In forked or non-upstream environments, the release job SHALL be skipped automatically to prevent failures from missing GitHub App credentials.

#### Scenario: Release PR generation and publishing in upstream repository
- **WHEN** changes following Conventional Commits are merged into `main` in the upstream repository `forgetfulengineer/google-analytics-data-api-netlify`
- **THEN** Release Please evaluates commit history and creates or updates a release Pull Request
- **AND** when the release PR is merged, it tags the commit, creates a GitHub Release, and bumps `package.json` version automatically
- **AND** authenticates using a dedicated GitHub App Token (`RELEASE_APP_CLIENT_ID` / `RELEASE_APP_PRIVATE_KEY`) to support subsequent workflow triggering

#### Scenario: Release workflow skipped in forked or non-upstream repository
- **WHEN** a push to `main` or a `workflow_dispatch` event triggers in a repository other than `forgetfulengineer/google-analytics-data-api-netlify`
- **THEN** the release job is skipped without error
- **AND** does not require `RELEASE_APP_CLIENT_ID` or `RELEASE_APP_PRIVATE_KEY` secrets
