## 1. 工作流程防護實作

- [x] 1.1 落實「決策一：在 release-please.yml 的 release-please Job 加入原始倉庫守衛判斷」，在 `.github/workflows/release-please.yml` 的 `release-please` Job 加入 `if: github.repository == 'forgetfulengineer/google-analytics-data-api-netlify'`，實現「Automated Release Management via Release Please」僅限原始倉庫執行的保護契約；驗證方式：代理人靜態審查 YAML 結構與條件式，確認非 upstream 觸發時該 Job 能被正確略過且不依賴 App Token。
  - spectra-exclude: github-actions-ci / Release PR generation and publishing in upstream repository | GitHub Actions runner executes on GitHub cloud platform and cannot be observed within local Vitest runner environment
  - spectra-exclude: github-actions-ci / Release workflow skipped in forked or non-upstream repository | GitHub Actions runner executes on GitHub cloud platform and cannot be observed within local Vitest runner environment
- [x] 1.2 落實「決策二：在 codeql.yml 的 analyze Job 加入原始倉庫守衛判斷」，在 `.github/workflows/codeql.yml` 的 `analyze` Job 加入 `if: github.repository == 'forgetfulengineer/google-analytics-data-api-netlify'`，實現「Automated CodeQL Security Analysis」僅限原始倉庫執行的保護契約，防止私有倉庫 GHAS 權限缺失與 Fork 端被動定時排程；驗證方式：代理人靜態審查 YAML 結構與條件式，確認非 upstream 觸發時該 Job 能被正確略過。
  - spectra-exclude: github-actions-ci / CodeQL analysis execution in upstream repository | GitHub Actions runner executes on GitHub cloud platform and cannot be observed within local Vitest runner environment
  - spectra-exclude: github-actions-ci / CodeQL analysis skipped in forked or non-upstream repository | GitHub Actions runner executes on GitHub cloud platform and cannot be observed within local Vitest runner environment

## 2. 整合與相容性驗證

- [x] 2.1 [after: 1.1, 1.2] 驗證專案既有品質檢查與工作流程相容性；驗證方式：執行 `npm run ci` 與 `npm test` 確認既有測試、型別與程式碼風格完全相容且通過。
