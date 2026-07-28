## 1. 測試檔結構重構與路徑修正 (Test Files Relocation)

- [x] 1.1 將 `functions/function-config.test.ts` 搬移至 `tests/functions/function-config.test.ts`，並更新內部對 `functions/` 模組的相對 import 路徑。此行為確保該測試檔脫離 Netlify 的 function 掃描範圍，並且能正確匯入原本的原始碼。完成驗證：手動執行方針對此檔的測試（或 `npm test`），確認輸出為通過且無 module not found 錯誤。
- [x] 1.2 將 `functions/pageviews.test.ts` 搬移至 `tests/functions/pageviews.test.ts`，並更新內部的相對 import 路徑。此行為確保 `/pageviews` 測試邏輯不會被誤認為 public endpoint。完成驗證：手動執行針對此檔的測試，確認測試輸出為通過。
- [x] 1.3 將 `functions/popular-posts.test.ts` 搬移至 `tests/functions/popular-posts.test.ts`，並更新內部的相對 import 路徑。此行為確保 `/popular-posts` 測試不會被錯誤部署。完成驗證：手動執行該測試檔確保測試邏輯仍能正確運行，且 `npm test` 輸出全數通過。
