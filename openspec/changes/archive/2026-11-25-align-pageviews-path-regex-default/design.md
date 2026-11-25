## Context

當 `PAGEPATH_REGEX` 未設定時，`src/schemas/pageviews.schema.ts` 內的 `PageviewsQuerySchema` 缺少 fallback 預設值，直接放行非 `/` 開頭的路徑。這與 `README.md` 及 `functions/popular-posts.ts` 明確規範的預設值 `^/` 不一致。

## Goals / Non-Goals

**Goals:**
- 在 `PAGEPATH_REGEX` 未設定時，於 `PageviewsQuerySchema` 套用 `^/` 作為預設正規表達式。
- 阻擋未以 `/` 開頭的路徑查詢，避免發送無效請求至 Google Analytics 4 API 浪費 quota。
- 完善單元測試，涵蓋預設 fallback 與自訂正則情境。
- 對齊 OpenSpec `pageviews-api-architecture` 規格。

**Non-Goals:**
- 不變更 `src/schemas/envSchema.ts` 中的定義（`PAGEPATH_REGEX` 維持選填）。
- 不調整 `/api/popular-posts` 的現有路徑過濾機制。

## Decisions

### Align Pageviews Regex Fallback with Documentation and Popular Posts
統一在 `src/schemas/pageviews.schema.ts` 採用 `getEnv().PAGEPATH_REGEX || '^/'`。
**Rationale**: 對齊 `README.md` 與 `functions/popular-posts.ts` 之規範，防止非法路徑（如 `about`、`javascript:...`）跳過驗證發送至 GA4。

### Test Isolation for Regex Customization
在 `src/schemas/pageviews.schema.test.ts` 測試自訂正則時，透過 `mockGetEnv` 顯式覆蓋。
**Rationale**: 遵守既有架構決策 *「單元測試環境 Mock 隔離（Hermetic Unit Test Environment Mocks）」*，禁止讀取執行環境中的 `process.env`，確保測試具備可預測性。

## Implementation Contract

- **Behavior**: 當客戶端呼叫 `/api/pageviews?path=<invalid>`（路徑未以 `/` 開頭）時，回傳 HTTP 400，回應信封為 `code: 'VALIDATION_ERROR'` 且錯誤原因為 `reason: 'path does not match required pattern'`。
- **Interface**: `PageviewsQuerySchema` 解析 `{ path?: string }`。
- **Failure modes**: 若 path 不符合正則表達式，拋出 `ValidationError`。
- **Acceptance criteria**: `npm test` 全數單元測試通過，包含 schema 預設 fallback 測試與 handler 400 驗證。
- **Scope boundaries**: 僅限於 `src/schemas/pageviews.schema.ts`、`src/schemas/pageviews.schema.test.ts`、`tests/functions/pageviews.test.ts` 及 `openspec/specs/pageviews-api-architecture/spec.md`。

## Risks / Trade-offs

- [既有整合測試預期錯誤訊息不符] → 更新 `tests/functions/pageviews.test.ts`，將原先預期 Use Case 拋出之訊息改為 Schema 攔截拋出之 `'path does not match required pattern'`。
