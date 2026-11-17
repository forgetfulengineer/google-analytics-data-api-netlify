## 1. 核心型別重構與遷移

- [x] 1.1 遷移 utils/envCheck.js 至 utils/envCheck.ts：將檔案重新命名為 `.ts`，並在 `checkRequiredEnv` 中加入參數 `requiredVars: string[]` 的型別定義。行為：模組能夠匯出帶有型別標註的環境變數檢查函數。驗證：執行 `npx tsc --noEmit` 確認無編譯錯誤。
- [x] 1.2 遷移 utils/response.js 至 utils/response.ts：實踐「決策一：型別從手寫 `.d.ts` 轉移至 `.ts` 實作中」，將檔案重新命名，刪除舊有的 `utils/response.d.ts`，並對 `jsonResponse`, `successResponse`, `errorResponse` 等函數補上具體的 TypeScript 型別宣告。行為：Response 工廠函數自帶型別推導，不再依賴外部 `.d.ts`。驗證：執行 `npx tsc --noEmit` 確認無編譯錯誤。
- [x] 1.3 遷移 utils/apiWrapper.js 至 utils/apiWrapper.ts：實踐「決策一：型別從手寫 `.d.ts` 轉移至 `.ts` 實作中」，將檔案重新命名，刪除舊有的 `utils/apiWrapper.d.ts`。為 `apiWrapper` 定義並匯出 `ApiWrapperOptions` 介面，實踐「決策二：維持 NodeNext 模組解析標準下的 import 副檔名」保留其內部引入 `./envCheck.js` 和 `./response.js` 的路徑不變。行為：核心 API Wrapper 支援 TypeScript 靜態檢查與型別提示。驗證：執行 `npx tsc --noEmit` 確認無編譯錯誤。

## 2. 驗證與測試

- [x] 2.1 執行 TypeScript 型別檢查：確保所有的 `.ts` 檔案修改與 `tsconfig.json` 的 `strict: true` 設定相容。行為：整個專案無型別錯誤。驗證：執行 `npx tsc --noEmit` 必須成功（回傳 0）。
- [x] 2.2 執行單元測試：確保遷移為 `.ts` 後的檔案（包含路徑參考與副檔名規則）皆能正確在 `vitest` 環境下執行無誤。行為：重構後的工具層與既有的所有業務邏輯相容。驗證：執行 `npm run test` 所有測試必須全數綠燈通過。
