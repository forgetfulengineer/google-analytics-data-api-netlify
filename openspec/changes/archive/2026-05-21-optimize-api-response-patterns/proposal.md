## Summary

本變更旨在優化並標準化專案中所有 Netlify Functions API 的回傳格式，採用高度嚴謹且高可用性的 Unified JSON Envelope，並引進型別化的錯誤代碼與結構化欄位錯誤資訊。

## Motivation

目前 API 的成功與錯誤回應格式較為散亂且未完全對齊架構規範，例如 Zod 驗證錯誤格式與上游服務錯誤的錯誤根節點格式不一致。透過此次重構，可讓所有 API (成功與失敗) 皆遵從 `{ code, message, data, meta?, errors? }` 的標準 Unified JSON Envelope，從而大幅提升 API 的健壯性與未來擴展性。

## Proposed Solution

1. 重構 `utils/response.js`：實作符合規範的 `jsonResponse`、`successResponse` 與 `errorResponse` 共用輔助函式，支援 Unified JSON Envelope 回傳結構。
2. 重構 `src/errors/AppError.ts`：在 `AppError` 類別內引進字串型態的機器可讀錯誤碼 `code` 屬性，並在 `ValidationError` 中加入扁平化的 `errors` 欄位錯誤描述陣列。
3. 重構 `utils/apiWrapper.js`：使所有的攔截分支（功能停用、環境變數缺失、CORS 來源不符）與主邏輯返回值，皆經由新版 `successResponse` 和 `errorResponse` 安全地進行格式包裝與錯誤處理。
4. 更新 `functions/pageviews.test.ts`：修改單元測試中的相關斷言以完美匹配新版 Unified JSON Envelope 結構。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- api-architecture-foundation: 提升與標準化全局錯誤回應與 Unified JSON Envelope 標準。
- pageviews-api-architecture: 配合 Unified JSON Envelope 標準更新回傳封裝。

## Impact

- Affected specs:
  - Modified: api-architecture-foundation, pageviews-api-architecture
- Affected code:
  - Modified:
    - utils/response.js
    - utils/apiWrapper.js
    - src/errors/AppError.ts
    - functions/pageviews.test.ts
