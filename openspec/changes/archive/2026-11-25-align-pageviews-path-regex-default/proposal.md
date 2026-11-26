## Problem

當環境變數 `PAGEPATH_REGEX` 未設定時，`src/schemas/pageviews.schema.ts` 內的 `PageviewsQuerySchema` 跳過正則驗證並放行所有字串路徑。這導致呼叫端若傳入未以 `/` 開頭的無效路徑（例如 `?path=about`、`?path=123` 或 `?path=javascript:...`），仍會通過參數驗證並向 Google Analytics 4 API 送出查詢，浪費 GA4 API Quota。

此行為亦與 `README.md`、`README.en.md`（文件明確記載 `PAGEPATH_REGEX` 預設值為 `^/`）以及 `functions/popular-posts.ts` 中的預設值處理互相矛盾。

重現步驟：
1. 在 `PAGEPATH_REGEX` 未設定（為 undefined）之環境下。
2. 傳入帶有無效路徑之請求，如 `GET /api/pageviews?path=about`。
3. 預期行為應為回傳 400 ValidationError (`path does not match required pattern`)，但實際卻放行並向 GA4 發起無效查詢。

## Root Cause

`src/schemas/pageviews.schema.ts` 的 `PageviewsQuerySchema` 缺少對 `getEnv().PAGEPATH_REGEX` 的 Fallback 預設值處理。程式碼原本在無環境變數時執行 `if (!pagePathRegex) return true;`，直接略過路徑檢驗，而非遵循系統規格套用 `^/`。

## Proposed Solution

1. 在 `src/schemas/pageviews.schema.ts` 中統一為 `const pagePathRegex = getEnv().PAGEPATH_REGEX || '^/';`，確保在環境變數未提供時強制以 `^/` 嚴格檢驗路徑。
2. 補齊與修正單元測試：
   - 於 `src/schemas/pageviews.schema.test.ts` 增加預設 fallback 檢驗（非 `/` 開頭字串驗證失敗，`/` 開頭字串通過）與自訂正則檢驗。
   - 修正 `tests/functions/pageviews.test.ts` 中既有測試案例的預期驗證錯誤訊息，並保持 Use Case 拋出 ValidationError 時的轉發測試覆蓋度。
3. 更新 OpenSpec 規格檔案（`openspec/specs/pageviews-api-architecture/spec.md`），同步補齊 fallback 至 `^/` 的規範與驗證情境（Scenario）。

## Non-Goals (optional)

- 不修改 `src/schemas/envSchema.ts` 中的環境變數結構（`PAGEPATH_REGEX` 依然保持為選填字串）。
- 不調整 `/api/popular-posts` 現有的正規表達式過濾邏輯。

## Success Criteria

- `src/schemas/pageviews.schema.test.ts` 驗證預設 fallback `^/` 阻擋無效路徑（如 `about`、`123`）之測試全數通過。
- `tests/functions/pageviews.test.ts` 驗證 Handler 遇無效 query 參數時回傳 400 及正確的錯誤訊息。
- 執行 `npm test` 全數單元與端點測試通過（0 失敗）。
- OpenSpec `pageviews-api-architecture` 規格完整納入 `^/` 預設值行為。

## Impact

- Affected specs: pageviews-api-architecture
- Affected code:
  - Modified: src/schemas/pageviews.schema.ts, src/schemas/pageviews.schema.test.ts, tests/functions/pageviews.test.ts
  - New: (none)
  - Removed: (none)
