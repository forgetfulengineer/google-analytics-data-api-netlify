## Why

目前測試套件能通過，但部分測試與現行分層架構的風險面不完全對齊。特別是 `popular-posts` handler 測試 mock 掉 `apiWrapper`，以及 repository 層缺少對 GA4 request shape 與 response mapping 的明確保護。

## What Changes

- 對齊 handler、wrapper、use case、repository 層的測試責任邊界。
- 補強 repository 測試，使用假 GA4 client 與假 `batchRunReports` 回傳值驗證 request shape 與資料映射。
- 明確禁止 repository 測試建立真 `BetaAnalyticsDataClient`、呼叫真 GA4 API、或消耗 GA4 API quota。
- 補強 `apiWrapper` 的 CORS、method guard、feature flag、成功 envelope、錯誤 envelope 與 extra headers 測試。
- 重構 `popular-posts` function 測試，使其驗證真實 HTTP `Response` envelope 與 cache headers。
- 維持 Netlify 環境規則：測試檔不得放入 `functions/`，function entry 測試只能放在 `tests/functions/` 或其他非 deploy function 目錄。

## Capabilities

### New Capabilities

- `test-suite-alignment`: 測試套件的分層責任、Netlify function 測試位置、GA4 API mock 邊界與驗證標準。

### Modified Capabilities

(none)

## Impact

- Affected specs: test-suite-alignment
- Affected code:
  - Modified:
    - src/repositories/analyticsRepository.test.ts
    - utils/apiWrapper.test.ts
    - tests/functions/popular-posts.test.ts
    - src/schemas/pageviews.schema.test.ts
  - New: none
  - Removed: none
- Runtime code impact:
  - functions/pageviews.ts
  - functions/popular-posts.ts
  - utils/apiWrapper.ts
  - utils/cors.ts
  - utils/response.ts
  - src/repositories/analyticsRepository.ts
  - src/use-cases/getPageviews.ts
  - src/use-cases/getPopularPosts.ts
  - src/infrastructure/analyticsClient.ts
