## Why

README.md（繁體中文）與 README.en.md（英文）的內容已與專案現況嚴重脫節，對首次使用者造成誤導：

- API 路徑仍為舊版 `/.netlify/functions/pageview`，實際已改為 `/api/pageviews`
- 回應格式仍為舊版扁平 `{ pv, uv }` 結構，實際已改為標準信封 `{ code, message, data }`，且欄位名稱完全不同（`site.pageviews`、`site.activeUsers`、`page.pageviews`）
- 缺少 `/api/popular-posts` 熱門文章 API 的任何說明
- 環境變數只列 4 個，實際需要 7 個（缺少 `ALLOWED_ORIGINS`、`ENABLE_PAGEVIEW`、`ENABLE_POPULAR`、`PAGEPATH_REGEX`）
- 未說明 CDN 快取、Rate Limit、功能開關、CORS 限制等現有機制
- 技術棧描述過時：稱使用 `.js` / Node.js / `handler` 匯出，實際為 TypeScript / Netlify Functions V2 / `export default` + `Config`
- 「補充說明」章節包含 async/await 語法教學等與使用者操作無關的內容

為了確立「README 負責讓使用者理解、部署與快速上手；API 文件平台負責完整 API 規格」的職責邊界，必須全面重寫文件，以精簡流暢的 Quick Start 取代沉重的完整 API 規格，消除系統性過時問題。

## What Changes

- **README.md（繁體中文）全面重寫**：
  - 更新專案簡介，反映目前支援兩支 API（`pageviews` + `popular-posts`）
  - 更新功能特色，新增 CDN 快取、Rate Limit、功能開關、CORS 限制等特色描述
  - 更新快速部署章節，環境變數表格擴充為完整 7 個（分必填 / 選填 / 預設值），補充功能開關說明
  - 設計 API 快速上手章節（Quick Start 導向）：
    - 說明 Base URL 與標準成功回應信封格式 `{ code, message, data }`
    - `GET /api/pageviews`：端點用途、常用查詢參數（`?path=`）、fetch 快速上手範例、200 成功回應 JSON 片段
    - `GET /api/popular-posts`：端點用途、fetch 快速上手範例、200 成功回應 JSON 片段
    - 不在 README 中展開冗長的所有 HTTP 錯誤代碼矩陣（400/403/404/405/503）與完整欄位型別矩陣，保持 README 輕量聚焦
  - 移除舊「API 使用方式」章節，內容整合至新快速上手章節
  - 移除舊「補充說明」章節，有用資訊（CORS、快取策略）分別整合至快速上手或 FAQ
  - 新增 FAQ / 注意事項（使用 `<details>` 折疊），涵蓋 CORS 設定機制、功能開關用法、資料更新頻率（快取週期與 Blobs 備援）、常見問題排查（如 403 CORS 阻擋）
  - 範例 URL 統一使用佔位符 `https://your-site.netlify.app`，移除舊版 `ga-api-demo` URL
  - 修正程式碼區塊語言標記（`json json` → `json`）

- **README.en.md（英文）同步重寫**：
  - 與中文版保持相同的章節結構、技術資訊與快速上手範例
  - 使用自然的技術英文而非逐字翻譯
  - 修正英文版中混入的中文標題（如 `#### 範例`）

## Non-Goals

- **不在 README 中撰寫完整的 API 規格細節**：各類 4xx/5xx 錯誤回應 Schema、欄位型別矩陣由後續獨立 API 文件頁面負責
- **不在 README 中為未來的 API 文件頁面預留銜接位點或佔位文字**：不提及 Swagger 文件正在建置中或保留空連結，待獨立 API 文件頁面上線後再行補充
- **不修改任何應用程式原始碼**：本次僅更新文件，不改動 `functions/`、`src/`、`utils/` 中的任何 `.ts` 檔案
- **不修改部署設定**：不改動 `netlify.toml`、`package.json`、`tsconfig.json` 或任何 CI/CD workflow
- **不重新設計 API 本身**：不建議或記錄任何 API 路徑、參數或回應格式的變更

## Impact

- Affected specs: none
- Affected code:
  - New: (none)
  - Modified: README.md, README.en.md
  - Removed: (none)
- Compatibility: no capability-level observable behavior changes

