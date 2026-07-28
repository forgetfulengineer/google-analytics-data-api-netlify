## Summary

將 utils 目錄下的 JavaScript 檔案（`apiWrapper.js`, `response.js`, `envCheck.js`）轉換為 TypeScript，並移除手寫的 `.d.ts` 檔案，以提升開發階段的型別安全性與開發效能。最後會執行測試以確保轉換後的架構仍可順利運作。

## Motivation

目前專案除了 utils 目錄外皆已是 TypeScript 架構。utils 中的檔案維護了 JS 實作與手寫的 `.d.ts` 宣告檔。這樣雙重維護（dual-maintenance）模式容易造成型別不同步的錯誤，並且在 `tsconfig.json` 開啟了 `strict: true` 的情況下，無法直接用 TypeScript 保護實作邏輯。全面切換至 `.ts` 能夠消滅這些負債，確保整個專案皆享有自動型別推導與靜態檢查。

## Proposed Solution

1. 將 `utils/apiWrapper.js` 重新命名為 `utils/apiWrapper.ts`，並將原本 JSDoc 的型別宣告改為 TypeScript 介面（interface）。
2. 將 `utils/response.js` 重新命名為 `utils/response.ts`，補上參數與回傳型別宣告。
3. 將 `utils/envCheck.js` 重新命名為 `utils/envCheck.ts`，加入型別宣告。
4. 刪除 `utils/apiWrapper.d.ts` 與 `utils/response.d.ts`。
5. 由於使用 `NodeNext` 的模組解析規則，import 路徑中的 `.js` 副檔名將保持不變。
6. 執行專案中既有的測試，確認修改後的功能並無受損且皆能正確通過。

## Non-Goals

- 本次修改不包含任何業務邏輯（Business Logic）的變更，純為型別重構。
- 為了遵循 `NodeNext` 模組解析標準，保留 import 的 `.js` 結尾，不在此次變動其 import 語法。

## Impact

- Affected specs: api-architecture-foundation
- Affected code:
  - Modified: utils/apiWrapper.ts, utils/response.ts, utils/envCheck.ts
  - Removed: utils/apiWrapper.js, utils/response.js, utils/envCheck.js, utils/apiWrapper.d.ts, utils/response.d.ts
