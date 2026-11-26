## Why

1. **規格偏離與重複手刻 Mock**：`test-suite-alignment` 規格要求測試環境提供標準預設值，但現狀 `tests/setup.ts` 僅將 `Netlify.env.get` 轉發至 `process.env[key]`，導致 `getEnv()` 在未手動設定環境變數時拋出 `ZodError`。現有 Handler 測試（`tests/functions/function-config.test.ts`、`tests/functions/pageviews.test.ts`、`tests/functions/popular-posts.test.ts`）被迫各自重複宣告 `vi.mock('../../src/lib/env.js')` 與硬編碼 `process.env`。
2. **本機 `.env` 洩漏與 `.env.test` 機制限制**：Vitest 預設會合併載入 `.env` 與 `.env.local`，且僅自動載入 `VITE_` 前綴的變數；單靠 `.env.test` 無法阻斷未覆寫的本機 `.env` 變數滲透（本專案 8 個環境變數皆無 `VITE_` 前綴），仍有將開發者本機真實 GA4 憑證或設定帶入測試環境的風險。

## What Changes

- 在 `vitest.config.ts` 設定 `envDir: false`，完全停用所有 `.env*` 檔案（`.env`、`.env.local`、`.env.test`）的自動載入，阻斷本機真實憑證與設定洩漏。
- 在 `vitest.config.ts` 的 `test.env` 顯式定義專案實際讀取的全部 8 個測試環境變數預設值，原生注入每個測試 worker 的 `process.env`。
- 由 `vitest.config.ts` 作為測試環境變數的單一真實來源（Single Source of Truth）。
- 維持 `tests/setup.ts` 僅代理 `process.env[key]`，保留對 `vi.stubEnv` 動態覆寫的支援。
- 移除 `tests/functions/` 下三個 Handler 測試檔案中重複的 `vi.mock('../../src/lib/env.js')` 與硬編碼 `process.env` 賦值。

## Capabilities

### New Capabilities

<!-- 無新增能力 -->

### Modified Capabilities

- `test-suite-alignment`: 將測試環境全域預設值與 `.env` 隔離機制收斂至 `vitest.config.ts`（`envDir: false` + `test.env`），搭配 `tests/setup.ts` 代理 `process.env` 提供密閉、無外部檔案依賴的測試預設環境。

## Impact

- Modified:
  - `vitest.config.ts`
  - `tests/functions/function-config.test.ts`
  - `tests/functions/pageviews.test.ts`
  - `tests/functions/popular-posts.test.ts`
- Unchanged:
  - `tests/setup.ts`（維持 `process.env` 代理）
  - `.env.example`（維持開源使用者本機設定範本）
  - `functions/`、`src/`、`utils/`（不修改生產程式碼）
  - `src/lib/env.test.ts`、`src/schemas/pageviews.schema.test.ts`（維持獨立單元測試策略）
