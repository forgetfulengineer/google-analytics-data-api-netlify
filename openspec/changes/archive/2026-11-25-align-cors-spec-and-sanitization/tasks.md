## 1. 核心邏輯與單元測試

- [x] 1.1 實作「決策一：在 checkOrigin 函式加入萬用字元放行邏輯」以滿足 `CORS Exact Match Validation` 規範，於 `utils/cors.ts` 新增萬用字元放行判斷，並於 `utils/cors.test.ts` 補齊 `*` 萬用字元放行與 `https://localhost` / `https://localhost:8443` 本地開發測試；驗證方式：執行 `npx vitest run utils/cors.test.ts` 且所有測試案例全數通過。
- [x] 1.2 實作「決策二：在 apiWrapper 環境變數解析加入網域前後空白清除與空字串過濾」，於 `utils/apiWrapper.ts` 對 `ALLOWED_ORIGINS` 執行 `.map((o) => o.trim()).filter(Boolean)`，並於 `utils/apiWrapper.test.ts` 補齊 `ALLOWED_ORIGINS='*'` 放行與包含空白或空項目的環境變數整合測試；驗證方式：執行 `npx vitest run utils/apiWrapper.test.ts` 且所有測試案例全數通過。

## 2. 文件與規格一致性

- [x] 2.1 實作「決策三：統一本地端開發來源為 http(s)://localhost:* 並對齊規格與文件」，將 `README.md`、`README.en.md`（環境變數表格與 FAQ 區塊）以及 `openspec/config.yaml` 規則統一對齊為 `http(s)://localhost:*`；驗證方式：檢視檔案確認所有本地端開發來源描述皆為 `http(s)://localhost:*` 且中英文文檔無落差。

## 3. 整體驗證

- [x] 3.1 [after: 1.1, 1.2, 2.1] 執行專案完整測試與靜態品質驗證；驗證方式：執行 `npm test` 確認全數測試通過，並執行 `npm run ci` 確保 TypeScript 型別與 Biome 格式化檢查 100% 通過。
