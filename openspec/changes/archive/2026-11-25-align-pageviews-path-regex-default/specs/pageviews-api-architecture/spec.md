## MODIFIED Requirements

### Requirement: Query Parameter Validation
The Handler layer MUST validate the optional query parameter `path` using the Zod schema (`PageviewsQuerySchema`) before delegating to the Use Case layer.
The input `path` MUST match the regular expression defined by the `PAGEPATH_REGEX` environment variable; if the environment variable is unset or empty, it MUST fall back to `^/` by default (requiring the path to start with a slash), otherwise the request MUST be rejected.

#### Scenario: Valid optional path
- **WHEN** the query parameter includes a path that matches `PAGEPATH_REGEX` (or starts with `/` when `PAGEPATH_REGEX` is unset), such as `?path=/posts/my-post`
- **THEN** parsing SHALL succeed and return `{ path: "/posts/my-post" }`

#### Scenario: Omitted path query
- **WHEN** the query parameter `path` is omitted
- **THEN** validation SHALL succeed and return `{}` so that the system proceeds to query site metrics only

#### Scenario: Path failing default pattern when PAGEPATH_REGEX is unset
- **WHEN** `PAGEPATH_REGEX` is unset and the query parameter `path` does not start with `/` (such as `?path=about` or `?path=123`)
- **THEN** validation SHALL fail and throw a `ValidationError` with error message `"path does not match required pattern"`, corresponding to HTTP 400

#### Scenario: Path failing PAGEPATH_REGEX pattern
- **WHEN** `PAGEPATH_REGEX` is configured to a specific regex (such as `^/posts/`) and the incoming `path` does not match the rule (such as `?path=/about`)
- **THEN** validation SHALL fail and throw a `ValidationError` with error message `"path does not match required pattern"`, corresponding to HTTP 400
