## Context

此專案為部署在 Netlify Functions 的無伺服器 REST API 服務，採用 TypeScript 開發，並使用 GitHub 作為版本控制平台。目前專案已經配置了 Netlify 自動部署，但缺乏在合併至 `main` 分支前的持續整合 (CI) 流程。這會導致風格、型別或邏輯錯誤直接被合併並部署至生產環境，增加系統穩定性的風險。

## Goals / Non-Goals

**Goals:**
- 在發起或更新針對 `main` 分支的 Pull Request 時，自動執行品質檢測。
- 提供快速且穩定的檢查流程：依賴安裝、Linting/Formatting、型別檢查與單元測試。
- 確保 `main` 分支的程式碼永遠處於健康可部署的狀態。

**Non-Goals:**
- 不在 GitHub Actions 中執行建置 (Build) 或部署 (Deploy)，這些交由現有的 Netlify CD 處理。
- 不引入專為前端框架設計的複雜 Linting 規則，保持後端專案的輕量性。

## Decisions

- **使用 GitHub Actions 作為 CI 平台**: 因為專案託管於 GitHub，可與 Pull Request 原生完美整合。
- **以 Biome 取代 ESLint + Prettier**: 採用 Biome (`@biomejs/biome`) 作為程式碼風格與靜態分析工具。它由 Rust 開發，速度極快且不需繁瑣配置，非常適合純 Node.js/TypeScript 後端專案。
  - **忽略檔案策略**：為了保持 `.gitignore` 職責單純且乾淨，Biome 將開啟 `vcs.useIgnoreFile: true` 同步 `.gitignore` 規則，同時利用 `files.includes` 的反向匹配 (`!資料夾名稱`) 來額外排除不想被 Biome 掃描的專案獨有目錄（如 `.agent`, `.agents`, `openspec` 等）。
  - **程式碼風格規範**：針對 Node.js 專案最佳化，設定全域縮排為 2 個空白（`indentStyle: space`），強制使用單引號、尾隨逗號 (`all`) 與強制分號，並套用預設的移除結尾空白與插入檔案結尾換行符。
- **CI 執行步驟順序**:
  1. 依賴安裝 (`npm install`)
  2. 風格與靜態分析 (`npx @biomejs/biome ci .`)
  3. 型別檢查 (`npx tsc --noEmit`)
  4. 單元測試 (`npm run test` 即 Vitest)

## Implementation Contract

- **Behavior**: 當開發者發起或更新目標為 `main` 分支的 Pull Request 時，會自動觸發 GitHub Actions 執行。
- **Interface / data shape**: CI 將依序執行 `npm install`、`npx @biomejs/biome ci .`、`npx tsc --noEmit`、`npm run test` 等 CLI 指令。
- **Failure modes**: 若任何一個步驟失敗（例如程式碼風格不符、型別錯誤或測試未通過），GitHub Actions 的狀態將標示為失敗，從而阻擋有問題的 Pull Request 被合併（需搭配分支保護規則）。
- **Acceptance criteria**:
  - 建立 `.github/workflows/ci.yml` 並正確設定觸發條件。
  - 建立 `biome.json` 設定檔，並確保能在終端機正常執行 Biome 檢測。
  - 所有新加入的指令皆能在本地環境測試通過。
- **Scope boundaries**: 新增 GitHub Actions 流程、新增 Biome 配置皆在範圍內。修改任何 Netlify 部署設定、修改現有 API 商業邏輯或補齊舊有測試涵蓋率皆在範圍外。

## Risks / Trade-offs

- [Risk] Biome 生態系較新，可能不支援特製的 ESLint 外掛。 → [Mitigation] 此專案為純 TypeScript 後端 API，不依賴複雜的前端框架外掛，Biome 的內建規則已非常足夠。
- [Risk] GitHub Actions 執行時間與額度消耗。 → [Mitigation] 捨棄 ESLint 改用 Biome，並略過完整的 Netlify 打包建置過程，可將 CI 時間降至最低。
