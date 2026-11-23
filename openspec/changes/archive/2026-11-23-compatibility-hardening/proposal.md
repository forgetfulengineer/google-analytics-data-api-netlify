## Problem

當開發者 Fork 本專案至其個人帳號、或遷移至無 GitHub Advanced Security (GHAS) 授權的私有倉庫時，GitHub Actions 自動化工作流程會無預期全面失敗：
1. **發版工作流程失敗**：Fork 者在同步或推送至 `main` 分支時，`.github/workflows/release-please.yml` 無條件嘗試建立專屬 GitHub App Token，因缺少原始倉庫的憑證（`RELEASE_APP_CLIENT_ID` 與 `RELEASE_APP_PRIVATE_KEY`）而拋出致命錯誤。
2. **安全掃描工作流程失敗與排程干擾**：在未具備 GHAS 授權的私有 Fork 或私有倉庫中，`.github/workflows/codeql.yml` 無法上傳分析結果至 GitHub Security tab 而遭 API 拒絕（HTTP 403）；且 `schedule` 排程在 Fork 啟用 Actions 後每月被動執行，造成非預期的 Actions 額度消耗與定時失敗警報。

## Root Cause

1. **`release-please.yml` 缺少倉庫環境守衛**：
   - 觸發條件 `push: branches: [main]` 與 `workflow_dispatch` 缺乏對執行倉庫身分的檢查。
   - `actions/create-github-app-token@v3` 強制要求 `client-id` 與 `private-key`，在 Fork 倉庫環境中此二者為空，導致 Action 在初始化階段立即崩潰。
2. **`codeql.yml` 缺少環境感知與排程隔離**：
   - CodeQL 在無 GHAS 授權的 Private Repository 中不支援 SARIF 上傳與結果分析。
   - `schedule: cron: '0 4 1 * *'` 未限定原始倉庫，當 Fork 倉庫啟用 Actions 後即被動排程執行。
   - 工作流程未限制僅限 upstream（原始倉庫）執行，導致 Fork / 私有環境背負不必要的安全掃描失敗風險。

## Proposed Solution

將 `release-please.yml` 與 `codeql.yml` 的執行嚴格收斂限定於原始倉庫（`forgetfulengineer/google-analytics-data-api-netlify`）：
1. 在 `.github/workflows/release-please.yml` 的 `release-please` Job 加入條件判斷 `if: github.repository == 'forgetfulengineer/google-analytics-data-api-netlify'`，使 Fork 或私有環境在觸發時自動跳過（Skip）發版 Job，不產生錯誤且不中斷。
2. 在 `.github/workflows/codeql.yml` 的 `analyze` Job 加入條件判斷 `if: github.repository == 'forgetfulengineer/google-analytics-data-api-netlify'`，使所有非 upstream 的 push、PR 及定時 schedule 排程均安全略過，保留原始專案完整的 CodeQL 安全防護，同時根除私有與 Fork 倉庫因缺乏 GHAS 授權或定時排程引發的失敗。

## Non-Goals (optional)

- **不修改 `.github/workflows/ci.yml`**：CI 品質檢查（Biome、TypeScript、Vitest）完全基於本地 Mock 與純靜態檢查，無外部憑證依賴，Fork 環境可安全正常執行以保障代碼品質。
- **不更動 Netlify Runtime 與部署設定**：不修改 `netlify.toml` 或 Functions 程式碼，維持現有延遲環境變數驗證與 CORS 白名單機制。
- **不在 Fork 倉庫支援替代發版機制**：Fork 者主要目的為串接 Netlify 自行部署或貢獻 upstream PR，無獨立發版與維護版本標籤需求，不引入複雜的 fallback 發版設定。

## Success Criteria

1. **原始倉庫工作流程完整性驗證**：在 `forgetfulengineer/google-analytics-data-api-netlify` 環境中，`release-please.yml` 與 `codeql.yml` 仍能如常執行發版與安全掃描。
2. **Fork / 私有環境非阻斷驗證**：在非原始倉庫環境（`github.repository != 'forgetfulengineer/google-analytics-data-api-netlify'`）模擬或觸發時，`release-please` 與 `analyze` Jobs 狀態為 `skipped`，Exit Code 為 0，不產生錯誤日誌或 Actions 警報。
3. **Spec 規格一致性驗證**：`openspec/specs/github-actions-ci/spec.md` 更新規格說明，明確記錄發版與 CodeQL 僅限原始倉庫執行的前置條件。

## Impact

- Affected specs: github-actions-ci
- Affected code:
  - Modified: .github/workflows/release-please.yml, .github/workflows/codeql.yml
  - New: none
  - Removed: none
