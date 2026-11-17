## Why
目前的 `popular-posts.js` 是一個肥大的單一檔案，將 GA4 查詢建構、回應解析、Netlify Blobs 快取邏輯及業務邏輯全塞在一起，違反了專案的架構規範。我們需要將其重構，以對齊 `pageviews` API 已經建立的高可用、嚴謹且現代化的 TypeScript 模式。

## What Changes
- 將 `functions/popular-posts.js` 轉換為 TypeScript，並拆分職責。
- 移除原本的 `type` 查詢參數，改為統一回傳「所有時間」與「本月」的雙重排行資料。
- **Handler** (`functions/popular-posts.ts`) 將只負責接收請求並呼叫 Use Case，並透過 `apiWrapper` 回傳統一結果。
- **Repository** (`src/repositories/analyticsRepository.ts`) 將擴充並新增 `fetchPopularPosts` 方法，並複用現有的 `parseGA4Report` 與 `getAnalyticsClient`。
- **Use Case** (`src/use-cases/getPopularPosts.ts`) 將處理業務邏輯與 Netlify Blobs cache-aside 策略：GA4 成功時寫入 `analytics-storage`，失敗時降級讀取快取；若快取也失敗則拋出 `UpstreamError`。

## Capabilities

### New Capabilities
- `popular-posts-api-architecture`: 定義 popular-posts API 的架構、無參數查詢行為、Blobs 降級回退邏輯與 API 契約。

### Modified Capabilities
(none)

## Impact
- Affected specs: `popular-posts-api-architecture`
- Affected code:
  - Modified:
    - `src/repositories/analyticsRepository.ts`
  - New:
    - `functions/popular-posts.ts`
    - `src/use-cases/getPopularPosts.ts`
    - `functions/popular-posts.test.ts`
  - Removed:
    - `functions/popular-posts.js`
