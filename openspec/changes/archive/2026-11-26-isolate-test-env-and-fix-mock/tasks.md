## 1. 測試環境隔離與預設值配置 (Vitest Env Isolation & Defaults)

- [x] 1.1 滿足 `Netlify Runtime Simulation in Test Setup` 與 `Vitest Hermetic Env Isolation via vitest.config.ts (envDir: false + test.env)`：更新 `vitest.config.ts`，設定 `envDir: false` 停用 `.env*` 檔案自動載入，並於 `test.env` 顯式定義專案讀取的全部 8 個環境變數安全預設值（`PROPERTYID`、`GOOGLE_APPLICATION_CREDENTIALS_JSON`、`STARTDATE`、`ENDDATE`、`PAGEPATH_REGEX`、`ALLOWED_ORIGINS`、`ENABLE_PAGEVIEW`、`ENABLE_POPULAR`），維持 `tests/setup.ts` 代理 `process.env`；驗證方式：執行 `rtk npx vitest run tests/functions/function-config.test.ts`（及後段任務清理 mock 後）確認不依賴本機 `.env` 且 `getEnv()` 成功解析無 `ZodError`。

## 2. 端點測試重複 Mock 清理與驗證 (Handler Tests Mock Cleanup)

- [x] 2.1 [after: 1.1] 滿足 `Eliminate Redundant Handler Mocks`：移除 `tests/functions/function-config.test.ts` 的 `vi.mock('../../src/lib/env.js')`；移除 `tests/functions/pageviews.test.ts` 的 `mockGetEnv`、`vi.mock('../../src/lib/env.js')` 與 `beforeEach` 內硬編碼的 `process.env.*` 賦值；移除 `tests/functions/popular-posts.test.ts` 的 `mockEnv` 與 `vi.mock('../../src/lib/env.js')`（保留 `mockGetPopularPosts`）；驗證方式：執行 `rtk npx vitest run tests/functions/` 全部 Handler 測試通過（PASS）。
- [x] 2.2 [after: 2.1] 執行專案完整測試與靜態檢查；驗證方式：執行 `rtk npx vitest run` 全套測試通過且 `rtk npx biome check .` 靜態檢查通過。

> **Change Note**: 原先規劃於根目錄建立 `.env.test` 之待辦項目已取消並由任務 `1.1`（`vitest.config.ts` 設定 `envDir: false` + `test.env`）取代。
