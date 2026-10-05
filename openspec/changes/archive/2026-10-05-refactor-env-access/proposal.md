## Why

目前 `utils/apiWrapper.ts`、`src/infrastructure/analyticsClient.ts` 與 `src/schemas/envSchema.ts` 直接透過 `process.env` 讀取環境變數。Netlify Functions 官方 skill（`netlify-functions`）建議使用 `Netlify.env.get()` 取代 `process.env`，以確保環境變數在所有部署情境下正確注入，並保持與平台規範一致。因此藉此機會統一生產程式碼的環境變數取得方式，並同步新增 `src/lib/env.ts` 集中管理。

## What Changes

- **新增** `src/lib/env.ts`：以平台全域物件 `Netlify.env.get()` 取得每個環境變數，再以既有的 `EnvSchema`（Zod）驗證 required 欄位；成為所有函式的唯一環境變數來源。
- **修改** `src/schemas/envSchema.ts`：移除第 14 行 `export const env = EnvSchema.parse(process.env);`，保留純 schema 定義（`EnvSchema`），不再暴露 `env` 物件。
- **修改** `src/infrastructure/analyticsClient.ts`：將 `const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;` 改為從 `src/lib/env.ts` 匯入 `env.GOOGLE_APPLICATION_CREDENTIALS_JSON`，移除對 `process.env` 的直接讀取。
- **修改** `utils/apiWrapper.ts`：
  - 將 `const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || null;` 改為自 `src/lib/env.ts` 取得 `env.ALLOWED_ORIGINS?.split(',') ?? null`。
  - 將 `const enable = (process.env[enableFlag] || 'true').toLowerCase() === 'true';` 改為以全域物件 `Netlify.env.get(enableFlag)` 取得。
- **修改** `functions/pageviews.ts`、`functions/popular-posts.ts`：將 import 路徑從 `../src/schemas/envSchema.js` 改為 `../src/lib/env.js`。
- **新增** `tests/setup.ts` 與 `vitest.config.ts`：在測試環境的全域作用域注入 `globalThis.Netlify = { env: { get: (key) => process.env[key] } }`，無縫橋接既有的 `process.env` 設定機制。
- **更新測試套件**：更新 `tests/functions/pageviews.test.ts`、`tests/functions/popular-posts.test.ts`、`tests/functions/function-config.test.ts`、`utils/apiWrapper.test.ts` 中的 mock 路徑至 `src/lib/env.js`，並移除多餘的模組 mock。

## Non-Goals

- **不改動** 測試套件的 `process.env.XXX = ...` 設定方式；測試仍透過 `process.env` 注入環境變數，由全域 mock 橋接至 `Netlify.env.get()`。
- **不改寫** `EnvSchema` 的 Zod 欄位定義；schema 本身無需修改。
- **不引入** 開發階段的 fallback（`Netlify.env.get() ?? process.env[key]`）；本地開發以 `netlify dev` 注入所有環境變數。
- **不改動** CDN 快取策略、CORS 白名單邏輯本身的行為，僅改寫環境變數取得方式。

## Impact

- Affected specs: env-config
- Affected code:
  - New: `src/lib/env.ts`, `tests/setup.ts`, `vitest.config.ts`
  - Modified: `src/schemas/envSchema.ts`, `src/infrastructure/analyticsClient.ts`, `utils/apiWrapper.ts`, `functions/pageviews.ts`, `functions/popular-posts.ts`, `tests/functions/pageviews.test.ts`, `tests/functions/popular-posts.test.ts`, `tests/functions/function-config.test.ts`, `utils/apiWrapper.test.ts`
  - Removed: (none)
- Compatibility: no capability-level observable behavior changes
