## Problem

目前專案在處理 CORS 與來源比對邏輯上存在三項缺陷與規格落差：
1. **萬用字元 `*` 被嚴格比對阻擋**：當使用者依文件在環境變數設定 `ALLOWED_ORIGINS=*` 時，`apiWrapper` 將其拆分為 `['*']`，而 `checkOrigin` 僅做嚴格比對，導致所有具體 Origin（如 `https://myblog.com`）比對失敗被回傳 403 Forbidden。
2. **網域清單缺少空白清洗與容錯**：當使用者輸入帶有空格的逗號分隔字串（例如 `https://example.com, https://blog.example.com`）或連續逗號時，解析後的 Origin 包含前導空白或空字串，導致合法 Origin 比對失敗被 403 阻擋。
3. **本地端開發 HTTPS 規格與文件不一致**：程式碼實作 `LOCALHOST_ORIGIN` 採用 `/^https?:\/\/localhost(:\d+)?$/` 放行 HTTP 與 HTTPS，但 OpenSpec 規格、`openspec/config.yaml` 規則與 README（環境變數表格與 FAQ）僅記載 `http://localhost:*`，且缺乏相關單元測試與 BDD 規格描述。

## Root Cause

1. `utils/cors.ts` 中的 `checkOrigin` 函式缺少 `allowedOrigins.includes('*')` 的萬用字元直接放行邏輯。
2. `utils/apiWrapper.ts` 在讀取 `ALLOWED_ORIGINS` 時僅使用 `split(',')` 切割，未對每個網域元素進行 `.trim()` 去除空白與 `.filter(Boolean)` 過濾無效空字串。
3. 文件與 OpenSpec 規格撰寫過於狹隘，僅標註 `http://localhost:*`；單元測試（`utils/cors.test.ts` 與 `utils/apiWrapper.test.ts`）未涵蓋萬用字元、空白清洗及 HTTPS 本地端 Origin。

## Proposed Solution

1. **修正 `utils/cors.ts`**：在 `checkOrigin` 函式中補上 `if (allowedOrigins.includes('*')) return true;`，使萬用字元能正確放行所有跨來源請求。
2. **修正 `utils/apiWrapper.ts`**：將 `ALLOWED_ORIGINS` 解析調整為 `.split(',').map((o) => o.trim()).filter(Boolean)`，清洗前後空白與忽略空字串。
3. **擴充單元測試**：
   - 在 `utils/cors.test.ts` 補齊萬用字元 `*` 放行測試與 `https://localhost` / `https://localhost:*` 測試。
   - 在 `utils/apiWrapper.test.ts` 補齊 `ALLOWED_ORIGINS='*'` 時的整合放行測試與包含空白/空字串的環境變數解析測試。
4. **對齊 OpenSpec 規格與文件**：
   - 更新 `openspec/specs/api-architecture-foundation/spec.md`：補充萬用字元 `*` 放行、環境變數清洗與 `http(s)://localhost:*` 本機開發的情境規格。
   - 更新 `openspec/config.yaml`：確認規則標明 `http(s)://localhost:*`。
   - 更新 `README.md` 與 `README.en.md`：同步修正環境變數表格與 FAQ 區塊中的 `http(s)://localhost:*`。

## Non-Goals (optional)

- 不調整 Netlify Functions 邊緣路由、HTTP 方法限制或 CDN 快取機制。
- 不引入外部 CORS 依賴套件，維持專案現有輕量、零額外依賴的自製 CORS 防護設計。

## Success Criteria

1. 執行 `npm test`（或 `vitest run`）所有測試（包含新增的 CORS 萬用字元、空白清洗與 HTTPS localhost 測試）皆 100% 通過。
2. 呼叫 `checkOrigin('https://example.com', ['*'])` 回傳 `true`。
3. 當 `ALLOWED_ORIGINS="https://a.com, https://b.com, "` 時，`Origin: https://b.com` 能通過驗證且正常取得 HTTP 200 回應。
4. 呼叫 `checkOrigin('https://localhost:8443', ['https://a.com'])` 回傳 `true`。
5. `openspec/specs/api-architecture-foundation/spec.md`、`openspec/config.yaml` 及中英文 README 一致記載 `http(s)://localhost:*`。

## Impact

- Affected specs: api-architecture-foundation
- Affected code:
  - Modified:
    - utils/cors.ts
    - utils/apiWrapper.ts
    - utils/cors.test.ts
    - utils/apiWrapper.test.ts
    - README.md
    - README.en.md
    - openspec/config.yaml
  - New:
  - Removed:
