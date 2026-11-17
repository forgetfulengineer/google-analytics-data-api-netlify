## Context

目前測試套件已覆蓋核心工具、use case、部分 repository 與 function entry，但覆蓋邊界不一致。`pageviews` handler 測試會走真 `apiWrapper` 並驗證 HTTP envelope；`popular-posts` handler 測試則 mock `apiWrapper`，只能證明 handlerFn 內部 wiring，無法保護實際 endpoint 回應格式、CORS wrapper 行為與 cache headers。

repository 層目前直接負責組 GA4 `batchRunReports` request 並解析 GA4 report。這層需要補測 request shape 與 mapping，但測試必須完全使用假 GA4 client，不能碰真 GA4 API、真 credentials 或 quota。

Netlify 部署面有一個硬限制：測試檔不得放入 `functions/`。Function entry 測試必須放在 `tests/functions/`，避免被 Netlify Functions 掃描成 deployable function artifact。

## Goals / Non-Goals

**Goals:**

- 讓測試套件對齊現行 handler、wrapper、use case、repository 分層責任。
- 補足 `fetchPageviews` 與 `fetchPopularPosts` 的 fake GA4 request shape 與 response mapping 測試。
- 補足 `apiWrapper` 的 CORS、method、feature flag、success/error envelope 與 extra headers 測試。
- 讓 `popular-posts` handler 測試驗證真實 HTTP `Response`，包含成功 envelope 與 Netlify cache headers。
- 明確禁止測試整合真 GA4 API、真 `BetaAnalyticsDataClient`、真 network request 或 GA4 quota。
- 維持 Netlify 測試檔位置規則：測試檔不放入 `functions/`。

**Non-Goals:**

- 不修改 production code。
- 不新增 endpoint。
- 不改 Netlify CDN 快取策略。
- 不導入 Cache API、function 內部 subrequest、或新的測試框架。
- 不新增真 GA4 integration test。
- 不改 Netlify Blobs runtime 行為。

## Decisions

### Use fake GA4 clients for repository verification

Repository 測試會 mock `src/infrastructure/analyticsClient.ts` 的 `getAnalyticsClient`，讓它回傳帶有 fake `batchRunReports` 的物件。測試檢查 fake `batchRunReports` 收到的 request shape，並用假 GA4 reports 驗證 domain response mapping。

選這個做法的理由是：repository 的責任是 request construction 與 response mapping，不需要透過真 SDK 或真 API 才能驗證。真 GA4 integration test 會引入 credentials、network、quota、資料波動與 CI 不穩定性，與這次測試 alignment 的目標相反。

### Test function behavior through the real apiWrapper

Function handler 測試預設不 mock `apiWrapper`。`popular-posts` 需要和 `pageviews` 一樣驗證 handler 經過 wrapper 後的真 HTTP `Response`，包含 `code/message/data` envelope 與 cache headers。

只有當測試目標明確是 dependency wiring 時，才允許 mock `apiWrapper`。這可以避免 handler 測試只證明內部 function 被呼叫，卻沒保護實際 endpoint 行為。

### Keep Netlify Function tests outside the deployable functions directory

所有 function entry 測試維持在 `tests/functions/`。不得新增 `functions/*.test.ts`、`functions/*.spec.ts` 或任何測試檔到 deployable `functions/` 目錄。

這個決策符合 Netlify Functions 的部署模型：`functions/` 是 function source 目錄，不是測試目錄。

### Preserve current caching and fallback runtime contracts

這次只補測，不改 runtime。Netlify Blobs 仍由 use case 在 GA4 成功時寫入 `analytics-storage`，在 GA4 失敗時讀取 fallback。

現有 cache key contract 保持不變：

- pageviews: `pageview:<path-or-total>:start=<start>:end=<end>`
- popular posts: `popular:regex=<regex>:start=<start>:end=<end>`

HTTP cache headers contract 保持不變：

- browser cache: `Cache-Control: public, max-age=0, must-revalidate`
- CDN cache: `Netlify-CDN-Cache-Control: public, durable, s-maxage=21600, stale-while-revalidate=21600`
- pageviews vary: `Netlify-Vary: query=path`
- popular-posts vary: no `Netlify-Vary`

CORS contract 保持不變：未設定 `ALLOWED_ORIGINS` 時允許所有來源並回傳 `*`；設定清單時只允許 exact match 與 localhost development origin。

## Implementation Contract

**Behavior:** `npm test` 驗證測試套件本身與現行架構一致。測試必須在無真 GA4 credentials、無 network、無 GA4 quota 的情況下通過。

**Repository verification:** `fetchPageviews` 與 `fetchPopularPosts` 的測試必須 mock analytics client module。fake `batchRunReports` 同時作為 request assertion target 與 fake GA4 response provider。測試涵蓋：

- `fetchPageviews` 未提供 `path` 時只建立 total metrics request。
- `fetchPageviews` 提供 `path` 時建立第二個 pagePath exact-match request。
- `fetchPageviews` 在 page report empty 時回傳 requested path 與 `pageviews: 0`。
- `fetchPopularPosts` 建立 month 與 all-time 兩個 request，含 `PARTIAL_REGEXP` filter、desc order、limit 10。
- `parseGA4Report` 將 numeric metrics 轉為 number，非 numeric metrics 保留 string。

**Wrapper verification:** `apiWrapper` 測試涵蓋：

- CORS forbidden 回 403 並不執行 handler。
- unsupported method 回 405 並不執行 handler。
- feature flag false 回 404 並不執行 handler。
- handler 回傳 `{ data, meta, message }` 時成功 envelope 正確 unwrap。
- known application error 使用 `statusCode/code/message/errors` 形成 error envelope。
- unknown error 回 500 `INTERNAL_SERVER_ERROR`。
- `extraHeaders` 套用在 success response 與 handler execution 後產生的 error response。

**Function handler verification:** `tests/functions/popular-posts.test.ts` 不 mock `apiWrapper`。測試 fake use case 成功資料時，handler 回傳 HTTP 200 與標準 JSON envelope，並包含 configured cache headers。測試預設 `PAGEPATH_REGEX` 時，use case 收到 `^/`。

**Scope boundaries:** 這次只允許修改測試檔。不得修改 `functions/`、`src/`、`utils/` production implementation。不得新增測試檔到 `functions/`。

**Acceptance criteria:** `npm test` 與 `npx tsc --noEmit` 通過；`spectra validate test-suite-alignment` 通過；`git status --short` 顯示 production implementation 檔沒有因 apply 被修改。

## Risks / Trade-offs

- Fake GA4 reports 可能與 SDK 型別有落差 -> 使用現有 repository 接收的最小 report shape，測 request shape 與 mapping contract，不把 SDK integration 行為塞進 unit test。
- Handler 測試走真 `apiWrapper` 會比純 wiring test 多一點 setup -> 只 mock use case 與 env schema，保留 HTTP behavior 的保護價值。
- 補太多 wrapper 分支會造成重複 -> wrapper 分支集中在 `utils/apiWrapper.test.ts`，function tests 只測 endpoint-specific envelope、headers 與參數。
- 測試檔位置限制容易被後續變更破壞 -> 在 tasks 裡加入檢查，確認沒有測試檔新增到 `functions/`。
