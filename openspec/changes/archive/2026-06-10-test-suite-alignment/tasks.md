## 1. Repository 測試對齊

- [x] 1.1 在 `src/repositories/analyticsRepository.test.ts` 實作 `Repository tests use mocked GA4 clients only` 與 `Use fake GA4 clients for repository verification`：mock `src/infrastructure/analyticsClient.ts` 的 `getAnalyticsClient`，讓 `fetchPageviews` without `path` 只呼叫 fake `batchRunReports` 且 request 只包含 total metrics；以 `npm test -- src/repositories/analyticsRepository.test.ts` 驗證，並確認測試不需要真 `GOOGLE_APPLICATION_CREDENTIALS_JSON`。
- [x] 1.2 在 `src/repositories/analyticsRepository.test.ts` 補齊 `fetchPageviews` with `path` 行為：fake `batchRunReports` 收到第二個 `pagePath` exact-match request，且 fake empty page report 會映射成 requested path 與 `pageviews: 0`；以 `npm test -- src/repositories/analyticsRepository.test.ts` 驗證 request assertion 與 response assertion。
- [x] 1.3 在 `src/repositories/analyticsRepository.test.ts` 補齊 `fetchPopularPosts` 行為：fake `batchRunReports` 收到 month 與 all-time request，兩者都包含 `PARTIAL_REGEXP` filter、desc order、limit 10，fake reports 映射成 `month` 與 `allTime`；以 `npm test -- src/repositories/analyticsRepository.test.ts` 驗證。
- [x] 1.4 在 `src/repositories/analyticsRepository.test.ts` 補齊 `parseGA4Report` metric mapping：numeric metric 轉為 number，non-numeric metric 保留 string；以 `npm test -- src/repositories/analyticsRepository.test.ts` 驗證。

## 2. Shared wrapper 測試對齊

- [x] 2.1 在 `utils/apiWrapper.test.ts` 實作 `API wrapper tests cover shared HTTP behavior`：CORS forbidden、unsupported method、feature flag false 都回傳對應 error envelope 且不執行 handler；以 `npm test -- utils/apiWrapper.test.ts` 驗證。
- [x] 2.2 在 `utils/apiWrapper.test.ts` 補齊 success unwrap 行為：handler 回傳 `{ data, meta, message }` 時 response body 正確包含 `code: SUCCESS`、自訂 message、data、meta；以 `npm test -- utils/apiWrapper.test.ts` 驗證。
- [x] 2.3 在 `utils/apiWrapper.test.ts` 補齊 known application error 與 unknown error 行為：known error 使用 `statusCode/code/message/errors` 形成 envelope，unknown error 回 500 `INTERNAL_SERVER_ERROR`；以 `npm test -- utils/apiWrapper.test.ts` 驗證。
- [x] 2.4 在 `utils/apiWrapper.test.ts` 實作 `Shared wrapper appends extra headers to generated responses`：`extraHeaders` 必須出現在 success response 與 handler execution 後產生的 error response；以 `npm test -- utils/apiWrapper.test.ts` 驗證。

## 3. Function handler 測試對齊

- [x] 3.1 在 `tests/functions/popular-posts.test.ts` 實作 `Function handler tests verify real response envelopes` 與 `Test function behavior through the real apiWrapper`：移除對 `utils/apiWrapper.ts` 的 mock，保留 fake use case，驗證 successful GET 回 HTTP 200 與 `code/message/data` envelope；以 `npm test -- tests/functions/popular-posts.test.ts` 驗證。
- [x] 3.2 在 `tests/functions/popular-posts.test.ts` 補齊 popular-posts cache header contract：success response 包含 `Cache-Control` 與 `Netlify-CDN-Cache-Control`，且不包含 `Netlify-Vary`；以 `npm test -- tests/functions/popular-posts.test.ts` 驗證。
- [x] 3.3 在 `tests/functions/popular-posts.test.ts` 補齊 `PAGEPATH_REGEX` 預設值 contract：env mock 未提供 `PAGEPATH_REGEX` 時，fake use case 收到 `pagePathRegex: '^/'`；以 `npm test -- tests/functions/popular-posts.test.ts` 驗證。

## 4. 測試位置與低價值測試整理

- [x] 4.1 檢查 `Test files stay outside deployable Netlify Functions` 與 `Keep Netlify Function tests outside the deployable functions directory`：確認沒有新增 `functions/*.test.ts` 或 `functions/*.spec.ts`，function entry 測試維持在 `tests/functions/`；以 `rg --files functions` 的人工檢視結果驗證。
- [x] 4.2 在 `src/schemas/pageviews.schema.test.ts` 實作 `Low-value tests are clarified or removed`：將 non-string `path` 測試描述限定為 schema contract coverage，或移除該低價值案例；以 `npm test -- src/schemas/pageviews.schema.test.ts` 驗證。

## 5. 全套驗證

- [x] 5.1 執行全套測試，驗證 `Preserve current caching and fallback runtime contracts` 沒被測試調整破壞：`npm test` 必須通過，並保留 use case Blobs cache key 與 fallback tests。
- [x] 5.2 執行 TypeScript 型別檢查，驗證測試 mock 型別與 ESM imports 沒有破壞編譯：`npx tsc --noEmit` 必須通過。
- [x] 5.3 執行 Spectra 驗證，確認 `test-suite-alignment` artifacts 與 requirement/task cross-reference 一致：`spectra validate test-suite-alignment` 必須通過。
- [x] 5.4 檢查 production implementation 範圍，確認本 change 只修改測試檔且沒有修改 `functions/pageviews.ts`、`functions/popular-posts.ts`、`utils/apiWrapper.ts`、`utils/cors.ts`、`utils/response.ts`、`src/repositories/analyticsRepository.ts`、`src/use-cases/getPageviews.ts`、`src/use-cases/getPopularPosts.ts`、`src/infrastructure/analyticsClient.ts`；以 `git status --short` 驗證。
