## 1. Schema 驗證修復與單元測試

- [x] 1.1 於 `src/schemas/pageviews.schema.ts` 實作 Query Parameter Validation，統一採用 `getEnv().PAGEPATH_REGEX || '^/'` 進行正則檢驗（Align Pageviews Regex Fallback with Documentation and Popular Posts）；驗證方式：執行 `npx vitest run src/schemas/pageviews.schema.test.ts`。
- [x] 1.2 [after: 1.1] 於 `src/schemas/pageviews.schema.test.ts` 補充 Query Parameter Validation 單元測試，遵循 Test Isolation for Regex Customization 規範，驗證未設定環境變數時拒絕非 `/` 開頭字串（如 `about`、`123`）以及自訂正則情境；驗證方式：執行 `npx vitest run src/schemas/pageviews.schema.test.ts` 測試全數通過。

## 2. 端點測試修正與全系統驗證

- [x] 2.1 [after: 1.2] 更新 `tests/functions/pageviews.test.ts`，修正無效 query 參數之預期驗證錯誤訊息為 `'path does not match required pattern'`，確保 Handler 遇 Query Parameter Validation 失敗時正確回傳 HTTP 400；驗證方式：執行 `npx vitest run tests/functions/pageviews.test.ts` 全數通過。
- [x] 2.2 [after: 2.1] 執行全專案型別與測試套件驗證，確認完全滿足 Query Parameter Validation 規範且遵循 Test Isolation for Regex Customization；驗證方式：執行 `npm test` 與 `npm run check` 零錯誤通過。
