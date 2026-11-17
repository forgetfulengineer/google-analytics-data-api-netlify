## Summary

重構 `extraHeaders` 的傳遞方式，將 cache headers 的注入點移至 `apiWrapper` 層，避免冗長的 response helper chain 傳遞。

## Motivation

目前專案中，`extraHeaders` (主要用於 Cache headers) 從 `pageviews.ts`/`popular-posts.ts` 傳遞給 `apiWrapper`，然後 `apiWrapper` 再將其傳遞給 `response.ts` 內的 `successResponse` 和 `errorResponse`，最終傳遞給 `jsonResponse`。這導致了不必要的 4 層參數穿透，使得 `response.ts` 內的函式簽章過於冗長 (高達 5-6 個參數)。Cache headers 應該由架構的邊界層 (`apiWrapper`) 統一注入，而不該讓底層的 response helpers 知道這個細節。

## Proposed Solution

1. **清理 response helpers**：將 `utils/response.ts` 內的 `jsonResponse`, `successResponse`, `errorResponse` 函式的 `extraHeaders` 參數移除，簡化函式簽章。
2. **統一注入點**：在 `utils/apiWrapper.ts` 的 `try-catch` 區塊中，取得 `successResponse` 或 `errorResponse` 回傳的原生 `Response` 物件後，透過 `response.headers.set()` 將 `extraHeaders` 注入。
3. **維持提前返回乾淨**：只在正常的 API 處理結果和應用層級錯誤時注入 cache headers。前置檢查 (如 CORS 失敗、Method 不符、Feature Flag 關閉) 提早 return 的 response **不應該**帶有這些 cache headers，維持現有行為。

## Impact

- Affected specs: (none)
- Affected code:
  - Modified: `utils/response.ts`, `utils/apiWrapper.ts`
