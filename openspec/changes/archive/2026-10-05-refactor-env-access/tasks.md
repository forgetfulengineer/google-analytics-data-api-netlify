

## 1. 新增 `src/lib/env.ts` — 集中以 `Netlify.env.get()` 取得並驗證環境變數

- [x] 1.1 落實 `Environment Configuration Schema` 規格要求：建立 `src/lib/env.ts`，以 `Netlify.env.get()` 取得所有六個環境變數（`PROPERTYID`、`GOOGLE_APPLICATION_CREDENTIALS_JSON`、`STARTDATE`、`ENDDATE`、`PAGEPATH_REGEX`、`ALLOWED_ORIGINS`），並透過 `EnvSchema.parse()` 驗證；若必填欄位缺失，`EnvSchema.parse()` 拋出 ZodError，函式回傳 500，表示 `env` 物件已成功建立且驗證通過。驗證方式：在本地 `netlify dev` 環境下故意移除一個必填變數，確認呼叫 `/api/pageviews` 回傳 500 並附帶 ZodError 訊息。

## 2. 精簡 `src/schemas/envSchema.ts` 為純 schema 定義

- [x] 2.1 移除 `src/schemas/envSchema.ts` 中的 `export const env = EnvSchema.parse(process.env);`，使該檔案只匯出 `EnvSchema`（Zod schema）與相關型別；沒有其他程式碼直接從此路徑匯入 `env` 物件，驗證方式：全域搜尋 `from '../schemas/envSchema'` 或 `from '../../src/schemas/envSchema'` 確認只剩下 `src/lib/env.ts` 中的 schema 引用，以及測試頂層的舊 `vi.mock` 路徑（下一步更新）。

## 3. 更新 `functions/pageviews.ts` 與 `functions/popular-posts.ts` 的 `env` 匯入路徑

- [x] 3.1 將 `functions/pageviews.ts` 中 `import { env } from '../src/schemas/envSchema.js';` 改為 `import { env } from '../src/lib/env.js';`，使函式透過 `src/lib/env.ts` 取得已驗證的環境變數物件；驗證方式：`netlify dev` 下呼叫 `GET /api/pageviews` 回傳 200 且 body 含 `code: 'SUCCESS'`。
- [x] 3.2 將 `functions/popular-posts.ts` 中相同的 `envSchema.js` 匯入路徑改為 `../src/lib/env.js`；驗證方式：`netlify dev` 下呼叫 `GET /api/popular-posts` 回傳 200 且 body 含 `code: 'SUCCESS'`。

## 4. 將 `src/infrastructure/analyticsClient.ts` 改為從 `src/lib/env.ts` 取得憑證

- [x] 4.1 將 `src/infrastructure/analyticsClient.ts` 中 `const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;` 改為 `const credJson = env.GOOGLE_APPLICATION_CREDENTIALS_JSON;`（匯入 `env` 自 `./lib/env.js` 或視目錄結構調整相對路徑），移除對 `process.env` 的直接讀取；驗證方式：`netlify dev` 下呼叫任一 endpoint，確認 GA4 Client 成功初始化且回傳真實資料，或在日誌中不出現 `Missing environment variable: GOOGLE_APPLICATION_CREDENTIALS_JSON` 錯誤。

## 5. 將 `utils/apiWrapper.ts` 改為以 `Netlify.env.get()` 取得 `ALLOWED_ORIGINS` 與 `enableFlag`

- [x] 5.1 將 `utils/apiWrapper.ts` 第 15 行 `const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || null;` 改為 `const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') ?? null;`（若未設定時仍回傳 `null` 以允許所有來源）；驗證方式：在 `ALLOWED_ORIGINS` 未設定時呼叫 `/api/pageviews`，確認回應 `Access-Control-Allow-Origin: *`；設定後確認僅允許的來源通過。
- [x] 5.2 將 `utils/apiWrapper.ts` 第 51 行 `const enable = (process.env[enableFlag] || 'true').toLowerCase() === 'true';` 改為 `const enable = (Netlify.env.get(enableFlag) ?? 'true').toLowerCase() === 'true';`；驗證方式：在 `netlify dev` 設定 `ENABLE_PAGEVIEW=false`，呼叫 `/api/pageviews` 確認回傳 404；設定 `ENABLE_PAGEVIEW=true` 確認回傳 200。

- [x] 6.1 建立 `tests/setup.ts` 與 `vitest.config.ts`，在測試全域注入 `globalThis.Netlify = { env: { get: (key) => process.env[key] } }`，使所有測試在不需要個別 `vi.mock` 的情況下橋接至 `process.env[key]`；同時更新測試中的 `vi.mock` 路徑為 `src/lib/env.js`；驗證方式：執行 `rtk npx vitest run`，全套測試全數通過（PASS），無 `Netlify is not defined` 錯誤。
