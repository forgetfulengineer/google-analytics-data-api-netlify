## Why

Netlify 部署失敗，錯誤訊息指出 `functions` 目錄內包含不合法的檔名字元。Netlify functions 僅允許英數字、連字號 (`-`) 與底線 (`_`) 作為檔名，但專案將測試檔 (`.test.ts`) 放在 `functions` 目錄中，其額外的小數點造成 Netlify 將其誤認為 function 進入點並觸發檔名驗證錯誤，導致部署中斷。此修改旨在修復部署流程。

## What Changes

- 將 `functions/` 目錄內的所有測試檔（`function-config.test.ts`, `pageviews.test.ts`, `popular-posts.test.ts`）移出。
- 在專案根目錄建立 `tests/functions/` 資料夾來集中存放這些測試檔。
- 更新測試檔內所有對於 `functions/` 目錄內模組的 import 路徑。

## Non-Goals

- 不改變任何 API 商業邏輯或快取策略。
- 不修改現有的測試覆蓋範圍，純粹進行檔案位置轉移與路徑修正。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

- Affected code:
  - New:
    - `tests/functions/function-config.test.ts`
    - `tests/functions/pageviews.test.ts`
    - `tests/functions/popular-posts.test.ts`
  - Removed:
    - `functions/function-config.test.ts`
    - `functions/pageviews.test.ts`
    - `functions/popular-posts.test.ts`
