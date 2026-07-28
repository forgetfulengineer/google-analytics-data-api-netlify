## Why

專案目前缺乏自動化的 CI 流程。為了保持 `main` 分支的穩定性、提早發現程式碼風格、型別或邏輯錯誤，並降低整合風險，我們需要在每次發起 Pull Request 時自動執行品質檢測。因為 Netlify 已經負責部署，CI 將專注於程式碼的靜態與動態檢驗。

## What Changes

- 新增 GitHub Actions 工作流程，在發起或更新 Pull Request 至 `main` 分支時觸發。
- 引入 Biome，以獲得極速的格式化與 Linting 體驗，符合 Netlify Functions 專案追求的輕量與高效。
  - **設定檔細化**：開啟與 `.gitignore` 的同步（`vcs.useIgnoreFile: true`），並將專案專屬排除項目（如 `.agent/`, `.agents/`, `openspec/` 等）定義在 `files.includes` 的反向匹配中。
  - **程式碼風格**：強制縮排使用 2 個空格、移除多餘結尾空白、插入檔案結尾換行符，並遵循現代 Node.js 標準（單引號、尾隨逗號、結尾分號）。
- 確保 CI 流程依序執行：安裝依賴、Biome 檢測、TypeScript 型別檢查以及 Vitest 單元測試。

## Non-Goals

- 不在 GitHub Actions 中執行建置或部署至生產環境，這些維持交由現有的 Netlify CD 流程處理。
- 由於此為純後端 API 專案，不引入複雜的前端框架專用 Linting 規則。

## Capabilities

### New Capabilities

- `github-actions-ci`: 定義 GitHub Actions 的觸發條件與 CI 檢測步驟。

### Modified Capabilities

(none)

## Impact

- Affected specs: `github-actions-ci`
- Affected code:
  - New: `.github/workflows/ci.yml`, `biome.json`
  - Modified: `package.json`
