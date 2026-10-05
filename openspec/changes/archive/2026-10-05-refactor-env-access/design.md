## Context

目前專案中的環境變數存取散落於各層，直接呼叫 `process.env`（包含 `utils/apiWrapper.ts`、`src/infrastructure/analyticsClient.ts` 以及 `src/schemas/envSchema.ts`）。根據 Netlify Functions 官方 skill（`netlify-functions`）之規範，Functions 建議全面採用 `Netlify.env.get()` 取得環境變數以確保在不同部署 context 下均能具備一致的平台注入行為。

本設計文件規範技術決策、模組介面及遷移步驟。

## Goals / Non-Goals

- **Goals**:
  - 建立 `src/lib/env.ts`，以 `Netlify.env.get()` 統一抓取所有全域環境變數並透過 `EnvSchema.parse()` 執行 fail-fast 驗證。
  - 將 `src/schemas/envSchema.ts` 精簡為純 Zod Schema 定義，不再於該檔匯出執行期 `env` 物件。
  - 在 `src/infrastructure/analyticsClient.ts` 中改為自 `src/lib/env.ts` 讀取憑證 JSON 字串。
  - 在 `utils/apiWrapper.ts` 中改以 `Netlify.env.get('ALLOWED_ORIGINS')` 與 `Netlify.env.get(enableFlag)` 取值。
  - 更新 functions 進入點的匯入路徑至 `src/lib/env.js`。
  - 在 `tests/functions/pageviews.test.ts` 頂層加入 Vitest 全域 mock，使測試繼續相容既有的 `process.env` 設定方式。
- **Non-Goals**:
  - 不變更任何對外 REST API 端點之 HTTP 狀態碼、路徑或 response JSON 結構。
  - 不修改既有的 CDN 快取標頭或 Netlify Blobs fallback 快取機制。
  - 不在 `src/lib/env.ts` 中增加非 netlify dev 的本機相容 fallback（強制標準化使用 `netlify dev`）。

## Decisions

- **混合改寫模式**：生產程式碼（`src/`、`utils/`、`functions/`）全面改為全域物件 `Netlify.env.get()` 與 `src/lib/env.ts`；測試套件（`tests/`）保留既有 `process.env.XXX = ...` 寫法，並透過 `tests/setup.ts` 注入 `globalThis.Netlify` 橋接至 `process.env`。此方案能在零破壞現有測試案例的前提下，使生產代碼完全遵從 Netlify 官方建議。
- **職責分離（Schema vs Runtime Env）**：`src/schemas/envSchema.ts` 僅負責資料結構與校驗規則（`EnvSchema`）；`src/lib/env.ts` 負責調用平台 API 取值並執行校驗，避免 Schema 定義依賴平台 runtime。

## Implementation Contract

- **模組與介面規範**：
  - `src/lib/env.ts`：直接透過 Netlify runtime 提供的全域 `Netlify.env.get()` 讀取六個變數（`PROPERTYID`、`GOOGLE_APPLICATION_CREDENTIALS_JSON`、`STARTDATE`、`ENDDATE`、`PAGEPATH_REGEX`、`ALLOWED_ORIGINS`），呼叫 `EnvSchema.parse()` 驗證並匯出型別安全的 `env` 物件。無需也不應自 `@netlify/functions` 匯入 `Netlify`。
  - `utils/apiWrapper.ts`：透過 `env.ALLOWED_ORIGINS?.split(',') ?? null` 取得白名單；未設定時允許所有來源（CORS `*`）。透過 `Netlify.env.get(enableFlag)` 判斷功能是否啟用，若為 `false` 則回傳 404。`checkOrigin` 邏輯不變。
  - **Netlify Blobs**：僅在 GA4 成功時寫入 warm cache，失敗時作為 fallback 快取。
  - **CDN 快取策略**：`Cache-Control: public, max-age=0, must-revalidate`、`Netlify-CDN-Cache-Control: public, durable, s-maxage=21600, stale-while-revalidate=21600`；`pageviews` 設 `Netlify-Vary: query=path`；`popular-posts` 不設置。
  - **對外行為**：Capability-level observable behavior 完全維持不變。

## Risks / Trade-offs

- [Risk] 本地直接以 `node` 執行時找不到環境變數 -> [Mitigation] 專案標準規範本地開發必須透過 `netlify dev` 啟動。
- [Risk] 測試執行時因缺少 mock 拋出 `Netlify is not defined` -> [Mitigation] 在 `vitest.config.ts` 設定 `tests/setup.ts`，全域注入 `globalThis.Netlify` 確保測試環境完全相容。

## Migration Plan

1. 建立 `src/lib/env.ts`。
2. 精簡 `src/schemas/envSchema.ts`。
3. 更新 `functions/pageviews.ts` 與 `functions/popular-posts.ts` 的 import 路徑至 `src/lib/env.js`。
4. 更新 `src/infrastructure/analyticsClient.ts` 由 `src/lib/env.js` 匯入憑證。
5. 更新 `utils/apiWrapper.ts` 改用 `Netlify.env.get()`。
6. 更新測試檔案新增全域 mock 並調整 import 路徑。
7. 執行 `vitest` 確認測試全數通過；`netlify dev` 進行端點呼叫驗證。
