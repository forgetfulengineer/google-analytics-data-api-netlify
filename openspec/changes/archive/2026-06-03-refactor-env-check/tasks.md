## 1. 核心邏輯修改

- [x] 1.1 修改 `utils/apiWrapper.ts`，實作「2. 採用 Fail Fast 策略，不在 apiWrapper 捕捉環境變數錯誤」與滿足「Schema 驗證層」規範。移除 `requiredEnv` 字串檢查邏輯與 `checkRequiredEnv`，且不需額外撰寫 try-catch 攔截環境變數的 ZodError。驗證方式：執行 TypeScript 檢查沒有錯誤。
- [x] 1.2 移除 `utils/envCheck.ts` 檔案，徹底停用舊有的字串驗證邏輯，並確保完成「1. 使用 ZodSchema 做全域環境變數驗證」的基礎清理。驗證方式：確認專案中 `utils/envCheck.ts` 檔案已刪除，並全域搜尋確認沒有遺漏的 import 引用。

## 2. 端點重構

- [x] 2.1 修改 `functions/pageviews.ts` 與 `functions/popular-posts.ts`，滿足「Environment Configuration Schema」規範。引入 `src/schemas/envSchema.ts` 的 `env` 物件並取代 `process.env`，移除所有環境變數相關的 `!` 斷言。驗證方式：手動移除本機 `.env` 的 `PROPERTYID`，呼叫 API 應預期收到 HTTP 500 ZodError 格式；補回環境變數後呼叫 API 應收到 HTTP 200 與正常 JSON。
