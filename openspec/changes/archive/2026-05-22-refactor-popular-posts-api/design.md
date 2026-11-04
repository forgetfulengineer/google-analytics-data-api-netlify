## Context
目前的 `popular-posts.js` 是一個單一 JavaScript 檔案，負責處理 HTTP 請求、解析 GA4 參數、發送請求至 GA4 API、處理結果，並實作 Netlify Blobs 快取邏輯。這種作法難以單獨測試且與基礎架構緊密耦合。為了對齊 `pageviews` 已建立的標準，我們將它重構為乾淨的 TypeScript 架構。同時，我們決定移除原有的 `type` 參數，改為統一回傳所有時段資料以簡化邏輯。

## Goals / Non-Goals

**Goals:**
- 移除 `type` 查詢參數，固定回傳 `month` 與 `allTime` 資料。
- 將邏輯拆分到 Handler、Use Case、Repository 三層（因無參數驗證，不需 Schema 層）。
- 使用 TypeScript 確保型別安全。
- 統一錯誤與回應處理模式 (`apiWrapper`)。
- 實作 cache-aside 策略 (Netlify Blobs)。

**Non-Goals:**
- 修改其它無關的 endpoints。

## Decisions

### 1. 拆分為三層式架構與移除 Schema 層
Rationale: 根據 `api-architecture-foundation`，通常包含 Schema 驗證。但因 `popular-posts` 不再接受任何查詢參數，故直接省略 Schema 層。其餘邏輯分為 Repository (資料存取)、Use Case (業務與快取)、Handler (HTTP 控制)，讓程式更具可測試性並重複使用 `analyticsRepository.ts` 的 `parseGA4Report`。

### 2. Blobs 讀寫時機與 Cache Key 變更
**寫入**: 在 GA4 API (`batchRunReports`) 呼叫成功且取得資料後，將包含 timestamp 與 data 的 JSON 寫回 Netlify Blobs (`analytics-storage`)。
**讀取 (Fallback)**: 若 GA4 呼叫拋出錯誤，Use Case 會捕捉異常並嘗試讀取快取；若快取存在則回傳，若無則拋出 `UpstreamError` 讓 `apiWrapper` 回傳 503。
**Cache Key**: 移除 `type` 後，統一使用 `popular:regex=${pagePathRegex}:start=${startDate}:end=${endDate}` 作為 key。

### 3. 移除現有 CDN 的 Netlify-Vary
因不再依賴 `type` 參數，故移除原有的 `Netlify-Vary: query=type` 快取標頭設定。
- **Cache-Control**: `public, max-age=0, must-revalidate`
- **Netlify-CDN-Cache-Control**: `public, durable, s-maxage=21600, stale-while-revalidate=21600`
- **CORS 策略**: 將由 `utils/apiWrapper.js` 中實作的 `checkOrigin` 自動處理。

## Implementation Contract

- **Behavior**: 發送對 `/api/popular-posts` 的請求會固定回傳包含「本月」與「歷史」的熱門文章排行。GA4 失效時會降級回傳快取資料。
- **Interface / Data Shape**:
  - `PopularPostsParams`: `{ propertyId, startDate, endDate, pagePathRegex }`
  - `PopularPostsResponse`:
    ```json
    {
      "code": "SUCCESS",
      "message": "Query successful",
      "data": {
        "month": [ { "path": "/post-1", "pageviews": 500 } ],
        "allTime": [ { "path": "/post-1", "pageviews": 5000 } ]
      }
    }
    ```
- **Failure modes**: 
  - GA4 與快取皆失敗拋出 `UpstreamError` (503)。
- **Acceptance criteria**:
  - 新增整合測試 `functions/popular-posts.test.ts` 涵蓋正常請求及 UpstreamError 情境。
  - 完成任務後，額外執行 `pageviews` 的整合測試以確保共用模組 (如 `analyticsRepository`) 修改並未造成回歸錯誤 (Regression)。

## Risks / Trade-offs

- [Risk] 若原本的 GA4 response 格式因 Google 更新改變，`parseGA4Report` 可能失效。
  - Mitigation: `parseGA4Report` 已實作為動態解析 header 與 row，具有較好的相容性。
