## 1. 設置與配置 Biome

- [x] 1.1 安裝 Biome 並配置設定檔 (Requirement: Fast Linting and Formatting)。目標檔案：`package.json`, `biome.json`。行為：專案可透過 `@biomejs/biome` 進行靜態分析，套用適合 TypeScript 後端的格式化與 Linting 規則。驗證：執行 `npx @biomejs/biome ci .` 能正確掃描專案目錄並輸出結果。
- [x] 1.2 修正現有程式碼以符合 Biome 規範。目標檔案：整個專案程式碼。行為：使專案現有程式碼完全符合 Biome 的標準，避免第一波 CI 就報錯。驗證：執行 `npx @biomejs/biome check --write .` 後，再執行 `npx @biomejs/biome ci .` 必須回傳 0 (無錯誤)。
- [x] 1.3 細化 Biome 設定檔與程式碼風格。目標檔案：`biome.json`。行為：設定 `vcs.useIgnoreFile: true` 以同步 `.gitignore`，同時透過 `files.includes` 的反向匹配來排除專案獨有目錄（如 `.agent`, `.agents`, `openspec`）。套用現代 Node.js 風格（2 空格縮排、單引號、尾隨逗號、結尾分號、移除結尾空白）。驗證：執行 `npx @biomejs/biome ci .` 確認套用無誤且不包含不該檢查的檔案。

## 2. 建立 GitHub Actions CI 流程

- [x] 2.1 新增 CI 工作流程設定檔 (Requirement: GitHub Actions CI Pipeline Trigger, Requirement: Pipeline Execution Steps)。目標檔案：`.github/workflows/ci.yml`。行為：建立 Actions 工作流程，當目標為 `main` 分支的 Pull Request 被開啟或更新時，依序執行依賴安裝、Biome 檢測、TypeScript 型別檢查與單元測試。驗證：檢查 `.github/workflows/ci.yml` 語法是否符合 GitHub Actions 規範，確保 `pull_request` 觸發條件與四個檢測步驟指令皆正確設定。
