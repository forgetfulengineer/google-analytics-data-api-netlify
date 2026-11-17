## 1. 基礎開發環境設定 (TypeScript 基礎設定)

- [x] 1.1 設定 TypeScript 專案與依賴 (符合 4. TypeScript 基礎設定)：在 `tsconfig.json` 設定 ESM 支援與嚴格模式，並在 `package.json` 安裝 `typescript`, `@types/node`, `zod` 等套件。驗證方式：執行 `tsc --noEmit` 能成功執行而無語法或設定錯誤。
## 2. 錯誤處理與驗證層 (Typed Error Handling & Schema Validation Layer)

- [x] 2.1 建立全域錯誤類別 (符合 型別化錯誤處理 (Typed Error Handling) 與 2. 定義統一的 AppError 類別)：建立 `src/errors/AppError.ts`，實作 `AppError`, `ValidationError`, `NotFoundError`, `UpstreamError` 並設定對應 HTTP status code。驗證方式：編寫簡單的測試腳本 `scratch/test-errors.ts`，確認實例化 `ValidationError` 時，`statusCode` 屬性正確為 400。
- [x] 2.2 建立參數與環境變數驗證器 (符合 Schema 驗證層 與 1. 建立基於 Zod 的型別驗證層)：建立 `src/schemas/envSchema.ts` 定義 `GOOGLE_APPLICATION_CREDENTIALS_JSON` 等系統變數，並確保驗證失敗會拋出錯誤。驗證方式：撰寫測試指令 `env GOOGLE_APPLICATION_CREDENTIALS_JSON= npx tsx src/schemas/envSchema.ts` 預期必須同步拋出 schema 驗證失敗的錯誤訊息。

## 3. GA4 客戶端基礎設施 (Singleton GA4 Client Initialization & Explicit Authentication Error Handling)

- [x] 3.1 遷移並重構 GA4 Client (符合 單例 GA4 客戶端初始化 (Singleton GA4 Client Initialization)、明確的認證錯誤處理 (Explicit Authentication Error Handling) 與 3. 將 GA4 客戶端隔離至 Infrastructure 層)：建立 `src/infrastructure/analyticsClient.ts`，實作單例模式初始化 `BetaAnalyticsDataClient`，並在 JSON 解析失敗時拋出錯誤。同步刪除舊的 `utils/analyticsClient.js`。驗證方式：撰寫測試腳本呼叫兩次 `getAnalyticsClient()` 並確保回傳相同的記憶體參考 (例如 `client1 === client2` 為 true)。
- [x] 3.2 修復現有函式對 GA4 Client 的引用路徑：更新 `functions/pageviews.js` 與 `functions/popular-posts.js` 內的 `import { getAnalyticsClient }` 路徑為新的 `../src/infrastructure/analyticsClient.ts` 檔案，確保這兩個端點在過渡期間仍能正常運作。驗證方式：執行 `netlify dev` 後，使用 curl 呼叫 `http://localhost:8888/.netlify/functions/pageviews`，預期回傳 200 HTTP 狀態碼且無模組路徑解析錯誤。
