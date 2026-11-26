## Context

本專案為 Netlify Functions v2 無伺服器 API，生產環境透過 `src/lib/env.ts` 的 `getEnv()`（搭配 `EnvSchema` Zod 驗證）與 `utils/apiWrapper.ts` 讀取共 8 個環境變數：
- 必填：`PROPERTYID`、`GOOGLE_APPLICATION_CREDENTIALS_JSON`、`STARTDATE`、`ENDDATE`
- 選填：`PAGEPATH_REGEX`、`ALLOWED_ORIGINS`、`ENABLE_PAGEVIEW`、`ENABLE_POPULAR`

現狀 `tests/setup.ts` 僅將 `Netlify.env.get` 轉發至 `process.env[key]`，未配置測試預設值，迫使多個 `tests/functions/` 測試各自重複手寫 `vi.mock('../../src/lib/env.js')`。同時，本機為 `netlify dev` 建立的 `.env` 含真實 GA4 Service Account 憑證，而 Vitest 預設不僅會合併載入 `.env` / `.env.local`，且依 Vite 規範僅自動載入 `VITE_` 前綴變數，使無前綴的 `.env.test` 既無法隔離本機 `.env` 也無法自動生效。

## Goals / Non-Goals

**Goals**:
- 透過 `vitest.config.ts` 的 `envDir: false` 完全禁止 Vitest 載入任何 `.env*` 檔案，徹底阻斷本機真實憑證與設定洩漏至測試環境。
- 透過 `vitest.config.ts` 的 `test.env` 全量顯式定義專案讀取的 8 個環境變數測試假資料，杜絕 `getEnv()` 拋出 `ZodError`。
- 保留 `.env.example` 作為開源使用者與開發者設定 `netlify dev` 本機 `.env` 的範本。
- 移除 `tests/functions/` 整合測試中重複多餘的 `vi.mock('../../src/lib/env.js')` 與硬編碼 `process.env`。

**Non-Goals**:
- 不建立 `.env.test` 檔案（由 `vitest.config.ts` 單一來源取代）。
- 不刪除或改動 `.env.example` 檔案。
- 不修改生產環境程式碼（`src/lib/env.ts`、`src/schemas/envSchema.ts`、`utils/apiWrapper.ts` 等）。
- 不變更 `src/lib/env.test.ts` 的獨立測試流程。
- 不移除 `src/schemas/pageviews.schema.test.ts` 的單元級 `mockGetEnv`。

## Decisions

### Vitest Hermetic Env Isolation via vitest.config.ts (envDir: false + test.env)
- **Supersedes**：取代本變更先前「Vitest 原生測試環境設定與憑證隔離 (.env.test Environment Provisioning and Isolation)」決策。
- **決策**：在 `vitest.config.ts` 設定 `envDir: false` 停用 `.env*` 自動載入，並於 `test.env` 顯式注入全部 8 個環境變數的安全假資料：
  ```ts
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    envDir: false,
    test: {
      setupFiles: ['./tests/setup.ts'],
      env: {
        PROPERTYID: '123456',
        GOOGLE_APPLICATION_CREDENTIALS_JSON:
          '{"project_id":"test-project","client_email":"test@example.com"}',
        STARTDATE: '2026-01-01',
        ENDDATE: '2026-01-31',
        PAGEPATH_REGEX: '^/',
        ALLOWED_ORIGINS: '',
        ENABLE_PAGEVIEW: 'true',
        ENABLE_POPULAR: 'true',
      },
    },
  });
  ```
  `tests/setup.ts` 維持極簡全域 `Netlify.env` 代理：
  ```ts
  globalThis.Netlify = {
    env: {
      get: (key: string) => process.env[key],
    },
  } as unknown as typeof Netlify;
  ```
- **替代方案考量**：
  - `.env.test` + `loadEnv('test', process.cwd(), '')`：Vite `loadEnv` 仍會合併讀取 `.env` 與 `.env.local`，未列於 `.env.test` 的變數仍會從本機 `.env` 洩漏，且需額外維護 `.env.test` 檔案。
- **理由**：
  1. `envDir: false` 是 Vite/Vitest 官方標準選項（取代已棄用的 `envFile: false`），從底層禁止讀取任何 `.env*` 檔案，確保本機與 CI 行為 100% 密閉一致。
  2. `test.env` 原生支援無 `VITE_` 前綴的變數，直接注入每個 worker 的 `process.env`，且完全相容測試內使用 `vi.stubEnv()` 動態覆寫。
  3. `netlify dev` 僅讀取 `.env`，完全不受 `vitest.config.ts` 影響。

### Eliminate Redundant Handler Mocks
- **決策**：
  1. 移除 `tests/functions/function-config.test.ts` 中的 `vi.mock('../../src/lib/env.js')`。
  2. 移除 `tests/functions/pageviews.test.ts` 中的 `mockGetEnv`、`vi.mock('../../src/lib/env.js')` 以及 `beforeEach` 中硬編碼的 `process.env.*` 賦值。
  3. 移除 `tests/functions/popular-posts.test.ts` 中的 `mockEnv`（保留 `mockGetPopularPosts`）與 `vi.mock('../../src/lib/env.js')`，並移除 `beforeEach` 對 `mockEnv` 的重設。
- **理由**：使所有 Handler 測試統一依賴 `vitest.config.ts` 的 `test.env` 與 `tests/setup.ts` 提供的安全測試預設值，消除重複脆弱的樣板程式碼，並維持延遲環境變數解析與快取機制之真實整合路徑。

## Implementation Contract

- **Observable Behavior**:
  - 執行 Vitest 時，不載入專案根目錄任何 `.env`、`.env.local` 或 `.env.test` 檔案；本機 `.env` 的真實憑證與 CORS 設定不會進入測試執行環境。
  - `process.env` 自動取得 `vitest.config.ts` `test.env` 定義的 8 個標準測試預設值。
  - 測試在未額外 mock `src/lib/env.js` 與未手動設定 `process.env` 的情況下，呼叫 `getEnv()` 與 `apiWrapper()` 能取得安全預設值，不拋出 `ZodError`。
  - 當測試使用 `vi.stubEnv(key, value)` 時，`Netlify.env.get(key)` 優先回傳覆寫值，並可透過 `vi.unstubAllEnvs()` 與 `resetEnv()` 還原。
- **Scope Boundaries**:
  - In Scope: `vitest.config.ts`、`tests/functions/function-config.test.ts`、`tests/functions/pageviews.test.ts`、`tests/functions/popular-posts.test.ts`。
  - Out of Scope: `.env.example`、生產程式碼（`functions/`、`src/`、`utils/`）、`src/schemas/pageviews.schema.test.ts`、`src/lib/env.test.ts`、`.github/workflows/ci.yml`。
- **Acceptance Criteria**:
  - `rtk npx vitest run` 全套測試通過（PASS）。
  - `rtk npx biome check .` 靜態檢查通過。
  - `tests/functions/` 內不再出現 `vi.mock('../../src/lib/env.js')`。

## Risks / Trade-offs

- [Risk: 測試間修改環境變數或 `getEnv()` 快取造成污染] → 緩解措施：測試案例若需動態覆寫環境變數（如關閉 `ENABLE_PAGEVIEW` 或驗證缺失變數），統一使用 `vi.stubEnv()` 並於 `afterEach` 呼叫 `vi.unstubAllEnvs()` 與 `resetEnv()`。
- [Risk: 未來新增環境變數時忘記補入 `vitest.config.ts` 的 `test.env`] → 緩解措施：將新增環境變數同步補齊 `test.env` 列為測試審查項目；若為必填變數，漏填時測試會立即以 `ZodError` 失敗提醒。

## Migration Plan

1. 更新 `vitest.config.ts`，加入 `envDir: false` 與 `test.env` 8 個環境變數預設值。
2. 清理 `tests/functions/` 下三個測試檔案重複的 `env.js` mock 與硬編碼 `process.env` 賦值。
3. 執行 `rtk npx vitest run` 與 `rtk npx biome check .` 驗證全數通過。

## Open Questions

- 無。決策與技術方案均已明確收斂。
