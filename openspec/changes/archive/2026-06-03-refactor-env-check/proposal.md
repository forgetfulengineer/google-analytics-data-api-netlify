## Why

目前專案使用 `utils/envCheck.ts` 和字串陣列（如 `['PROPERTYID', ...]`）來驗證環境變數。這導致 `functions/pageviews.ts` 等端點在使用環境變數時，依然需要加上 Non-null Assertion Operator (`!`) 來斷言變數存在。同時，這樣字串式的檢查缺乏型別安全（Type Safety），並使得設定檔驗證邏輯散落各處。改用既有的 Zod schema (`src/schemas/envSchema.ts`) 能統一驗證入口，保證環境變數的完整性與強型別化，並解決 `!` 帶來的安全隱患。

## What Changes

- 棄用並移除 `utils/envCheck.ts`。
- 修改 `utils/apiWrapper.ts`，移除對 `requiredEnv` 字串陣列的依賴與檢查。
- `envSchema.ts` 將在模組載入時執行驗證 (Fail Fast)，若缺少變數會直接拋出錯誤並記錄於伺服器日誌，不再將環境變數細節暴露給前端呼叫方，提升安全性。
- 在各個端點（`functions/pageviews.ts`, `functions/popular-posts.ts`）中，改為直接 import 驗證過後的 `env` 物件，並移除所有環境變數相關的 `!` 斷言。
- 同步確保 `envSchema.ts` 中的 `STARTDATE` 和 `ENDDATE` 變為必填（取消 `.optional()`）。

## Non-Goals (optional)

- 不修改 Cache Headers 的傳遞邏輯（將於獨立提案處理）。
- 不重構 `apiWrapper` 的架構為 Middleware Runner（將於獨立提案處理）。

## Capabilities

### New Capabilities

- `env-config`: 定義環境變數的強型別驗證與安全存取。

### Modified Capabilities

- `api-architecture-foundation`: 修改 apiWrapper 的環境變數檢查機制與 ZodError 錯誤攔截。

## Impact

- Affected specs: `env-config`, `api-architecture-foundation`
- Affected code:
  - Modified: 
    - `functions/pageviews.ts`
    - `functions/popular-posts.ts`
    - `utils/apiWrapper.ts`
  - Removed: 
    - `utils/envCheck.ts`
