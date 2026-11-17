## Context

目前 GA4 API 的快取機制依賴 Netlify 的 CDN 快取標頭（如 `Netlify-CDN-Cache-Control` 和 `Netlify-Vary`）。這些標頭目前定義在各自的 handler 中，並透過 `apiWrapper` 層層傳遞給 `response.ts` 內的 helper functions。這種做法導致 helper function 的簽章變得冗長，且模糊了 `apiWrapper` 作為邊界層的責任。

## Goals / Non-Goals

**Goals:**
- 簡化 `utils/response.ts` 內的函式簽章，移除 `extraHeaders` 參數。
- 將 cache headers 的注入職責集中在 `utils/apiWrapper.ts` 的邊界。
- 確保只有在正常的業務邏輯處理（成功或拋出預期/未預期錯誤）時才注入 cache headers，而提早阻擋（如 CORS 失敗、方法錯誤、Feature Flag 關閉）的請求不應被快取。

**Non-Goals:**
- 改變現有 CDN 的快取行為（TTL、durable 等設定不變）。
- 修改 GA4 資料存取邏輯或 Netlify Blobs 快取機制。

## Decisions

### 移除 Response Helpers 中的 `extraHeaders`
- **Rationale**: 原生的 Web Standard `Response.json()` 已經提供了設定 header 的方式。讓共用 helper 處理過多業務層級的設定違反了單一職責原則。
- **Alternatives Considered**: 將 `extraHeaders` 改成可選的 global 設定檔。但這會失去 per-endpoint 的動態差異（如 `pageviews` 需要 `Netlify-Vary`）。

### 在 `apiWrapper` 的最終階段動態注入 Headers
- **Rationale**: `apiWrapper` 負責攔截所有請求，是最適合進行這類跨界操作的地方。透過取得 `successResponse` 或 `errorResponse` 返回的原生 `Response` 物件，並使用 `response.headers.set()` 迭代寫入 `extraHeaders`，能確保程式碼乾淨且職責清晰。
- **Alternatives Considered**: 實作更複雜的 Middleware runner。但考慮到當前邏輯單純，為了這個小改動重寫整個 wrapper 成本太高。

## Implementation Contract

- **Behavior**: 端點回傳的 HTTP Headers 行為保持不變。CORS 預檢、方法不支援等提早返回的 response 維持不帶有 CDN Cache 標頭。業務邏輯執行後的 response（無論 HTTP 200 還是 500）會附帶 endpoint 所指定的 CDN Cache 標頭。
- **Interface**: 
  - `jsonResponse`, `successResponse`, `errorResponse` 的簽章將不再接受 `extraHeaders`。
  - `apiWrapper` 的 `ApiWrapperOptions` 介面保持不變（仍接受 `extraHeaders`）。
- **Acceptance criteria**: 
  - TypeScript 編譯通過（無型別錯誤）。
  - 對 `/api/pageviews` 發送正確的 GET 請求，回傳 200 且 Headers 包含 `Netlify-CDN-Cache-Control` 和 `Netlify-Vary`。
  - 對 `/api/pageviews` 發送錯誤的 HTTP 方法（如 POST），回傳 405 且 Headers **不包含** `Netlify-CDN-Cache-Control`。

## Risks / Trade-offs

- [Risk] 直接修改 Web Standard `Response` 的 headers 屬性可能遇到唯讀問題。 → [Mitigation] 使用 `Response.json` 創建出的 `Response` 實例，其 `headers` 是可變的 (`Headers` 物件)。如果遇到唯讀錯誤，可改用重新 clone 或重新 new Response 的方式處理（不過標準 `Response` 創建後 headers 預設是 mutable 的，除非手動鎖定）。
