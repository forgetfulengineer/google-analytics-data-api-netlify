## Context

目前專案提供給前端的 GA4 API 缺乏細緻的防護。`utils/cors.js` 僅使用 `includes()` 檢查 `localhost`，容易被惡意網域利用。所有的 API 請求（不分 HTTP Method）皆會穿透進核心執行邏輯，造成 Netlify 執行時間的浪費與潛在的 GA4 Quota 消耗。此外，沒有針對頻繁存取的防禦機制，且設定檔 `netlify.toml` 的路由轉發方式相對老舊。透過升級 `utils/cors` 到 TypeScript 並優化驗證邏輯，同時利用 Netlify Functions V2 的 `Config` 設定，能將防護層級推至邊緣節點 (Edge)。

## Goals / Non-Goals

**Goals:**
- 增強 CORS 驗證邏輯，精確判斷 `localhost`。
- 在 Netlify Edge 層面攔截非 `GET` 及預期外的 Method，並加入 Rate Limiting。
- 在共用層 `apiWrapper.js` 妥善處理 `OPTIONS` (Preflight) 並透過 `Access-Control-Max-Age` 降低預檢請求次數。
- 將 `utils/cors.js` 遷移為 TypeScript 確保型別安全。

**Non-Goals:**
- 變更 `functions/` 或 `src/` 中與業務邏輯相關的內容。
- 將 `utils/apiWrapper.js` 或 `utils/response.js` 重構為 TypeScript (本次僅限 `cors`)。
- 引入額外的外部依賴套件。
- 手動添加 `X-Content-Type-Options` 或 `Strict-Transport-Security` 等標頭（已確認 Netlify 預設會自動補齊）。

## Decisions

- **Regex 檢查 localhost**: 原本 `origin.includes('localhost')` 會放行 `hacker-localhost.com`，決定改用 `/^https?:\/\/localhost(:\d+)?$/` 來做精準判斷。
- **改用 Functions V2 Config**: 捨棄 `netlify.toml` 的路由跳轉，改用在 endpoint 中導出 `export const config = { path, method, rateLimit }`，這能讓 Netlify 在最外層阻擋非法請求，節省運算資源與 API 額度。
- **明確放行與快取 OPTIONS**: 因設定 `config.method = ['GET', 'OPTIONS']`，決定在 `apiWrapper.js` 內攔截 `req.method === 'OPTIONS'`。除了提早返回 204 及 `Access-Control-Allow-Origin` 確保 CORS 正常外，額外加上 `Access-Control-Max-Age: 86400` 來讓瀏覽器快取預檢請求一天，大幅減少 OPTIONS 次數。

## Implementation Contract

- **Behavior**:
  - `OPTIONS` 請求將在進入業務邏輯前，由 `apiWrapper.js` 直接回傳狀態碼 `204` 及 CORS Headers，且包含 `Access-Control-Max-Age`。
  - 非 `GET` 或 `OPTIONS` 請求，將被 `apiWrapper.js` 回傳 `405 Method Not Allowed`，但多數非法請求應已被 `config.method` 擋下。
  - 觸發速率限制（Rate Limiting）時，系統依照 Netlify 預設行為回應。
- **Interface / data shape**: 
  - `functions/pageviews.ts` 與 `functions/popular-posts.ts` 將 Export 特定的 `config: Config`，包含 `path`, `method`, `rateLimit`。
  - `utils/cors.ts` 匯出的 `checkOrigin` 接受 `origin: string` 和 `allowedOrigins: string[] | null`，並回傳 `boolean`。
- **Failure modes**: 若 `Origin` 無法通過 `checkOrigin` 檢查，`apiWrapper.js` 依然回傳 403。
- **Acceptance criteria**:
  - `cors.ts` 在傳入 `https://hacker-localhost.com` 時應回傳 false，傳入 `http://localhost:3000` 應回傳 true。
  - 執行部署後，請求不允許的 HTTP Method 會被阻擋。
  - 測試 OPTIONS 請求時，能觀察到 `Access-Control-Max-Age` 標頭。
- **Scope boundaries**: 在此變更範圍內僅修改安全相關機制，不干涉原有的 GA4 data fetching 邏輯。

## Risks / Trade-offs

- **[Risk] Netlify Rate Limit 配置過於嚴格導致正常流量被擋** → 設定適當的 `windowSize` 與 `windowLimit` 觀察。
- **[Risk] OPTIONS 請求未被正確處理造成前端跨域失敗** → 在 `apiWrapper` 的 204 回應需確保有加入完整的 `Access-Control-Allow-Origin` 與 `Access-Control-Max-Age` 等 Headers。

## Migration Plan

1. 將 `utils/cors.js` 重新命名並改寫為 `utils/cors.ts`，並更新引用。
2. 於 `apiWrapper.js` 加入 OPTIONS 及 method 檢查與快取 headers。
3. 更新 `pageviews.ts` 與 `popular-posts.ts` 引入 `Config` 設定。
4. 刪除 `netlify.toml` 的 redirects 區塊。

## Open Questions

- (無)
