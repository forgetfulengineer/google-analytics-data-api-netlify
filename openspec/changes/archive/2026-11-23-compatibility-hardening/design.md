## Context

本專案為 Public Repository，主要供使用者 Fork 後串接 Netlify 自行部署 GA4 查詢 API 端點，或向 upstream 提交 Pull Request。
然而專案現有的兩組自動化工作流程（`.github/workflows/release-please.yml` 與 `.github/workflows/codeql.yml`）原先未考慮 Fork 倉庫或私有部署環境：
1. `release-please.yml` 依賴專案專屬 GitHub App 憑證（`RELEASE_APP_CLIENT_ID` 與 `RELEASE_APP_PRIVATE_KEY`），Fork 倉庫缺少憑證時推送到 `main` 會立即崩潰。
2. `codeql.yml` 在私有倉庫需要 GHAS 授權，且排程 `schedule: cron` 會在 Fork 啟用 Actions 後被動定時執行，造成非預期的 Actions 配額消耗與定時報錯。

## Goals / Non-Goals

**Goals:**
- 確保 Fork 倉庫與私有環境在觸發 Actions 時不會因缺少 GitHub App 憑證或 GHAS 授權而失敗。
- 完整保留 upstream（原始倉庫）既有的自動發版與 CodeQL 靜態安全掃描能力。
- 採用 GitHub Actions 原生 Job 條件判斷（`if` 守衛），維持最小改動與最高透明度。

**Non-Goals:**
- 不為 Fork 倉庫提供額外的 fallback 發版機制或替代憑證流程。
- 不修改 `.github/workflows/ci.yml`（CI 品質檢查不依賴任何外部憑證，純本機 Mock，已完全相容）。
- 不更動 Netlify 部署設定或應用程式執行階段程式碼。

## Decisions

### 決策一：在 release-please.yml 的 release-please Job 加入原始倉庫守衛判斷
- **Rationale**: Release Please 是 upstream 維護者專用的發版、CHANGELOG 產生與版本標籤流程。Fork 者主要目的為串接 Netlify 部署或發送 PR，不具備發版需求亦無權限。在 Job 層級加入 `if: github.repository == 'forgetfulengineer/google-analytics-data-api-netlify'` 能確保非 upstream 觸發時直接安全略過（Job 狀態為 `skipped`，非 `failed`），避免 Token 生成步驟報錯。
- **Alternatives Considered**: 在 Step 層級做條件判斷。但若略過 Token 生成 Step，後續 `release-please` Step 仍會因 Token 為空或預設 `GITHUB_TOKEN` 權限不足而連鎖失敗。

### 決策二：在 codeql.yml 的 analyze Job 加入原始倉庫守衛判斷
- **Rationale**: CodeQL 對 Public 倉庫免費，但私有倉庫必須具備 GHAS 授權。此外，Fork 倉庫啟用 Actions 後會繼承 `schedule` 排程，每月被動執行並消耗配額。將 `analyze` Job 嚴格限定於原始倉庫（`if: github.repository == 'forgetfulengineer/google-analytics-data-api-netlify'`），可徹底消除私有 Fork 的 GHAS 授權錯誤，並停止 Fork 端的定時排程， upstream 則維持完整的 push、PR 與定時安全掃描。

## Implementation Contract

- **工作流程行為合約**：
  - 當事件在 `forgetfulengineer/google-analytics-data-api-netlify` 觸發時：
    - `release-please.yml`：Job 正常執行，使用 GitHub App Token 執行 Release Please。
    - `codeql.yml`：Job 正常執行，進行 JavaScript/TypeScript 安全分析並上傳 SARIF。
  - 當事件在非原始倉庫（Fork 或私有環境）觸發時：
    - `release-please.yml`：`release-please` Job 顯示 `skipped`，Exit Code 為 0。
    - `codeql.yml`：`analyze` Job 顯示 `skipped`，Exit Code 為 0。
- **檔案修改規範**：
  - `.github/workflows/release-please.yml`：在 `jobs.release-please` 下新增 `if: github.repository == 'forgetfulengineer/google-analytics-data-api-netlify'`。
  - `.github/workflows/codeql.yml`：在 `jobs.analyze` 下新增 `if: github.repository == 'forgetfulengineer/google-analytics-data-api-netlify'`。
- **驗證方式**：
  - 檢查 YAML 語法合法性，確保縮排正確且符合 GitHub Actions 結構規範。
  - 透過靜態比對與 YAML parser 驗證 `if` 條件式正確無誤。

## Risks / Trade-offs

- **[Risk] 若原始倉庫更名或擁有者轉移，Job 可能意外被跳過** → 緩解措施：在 README 或維護說明中備忘該設定；更名或遷移時需同步更新 workflow 中的 `github.repository` 比對字串。
