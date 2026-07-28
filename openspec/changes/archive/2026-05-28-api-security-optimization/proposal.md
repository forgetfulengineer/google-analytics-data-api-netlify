## Why

目前專案的 API 安全防護存在多項不足：CORS 的 localhost 檢查使用 includes() 容易被偽造網域繞過（如 hacker-localhost.com）、Function 未限制 HTTP Method 導致非 GET 請求也會穿透到 GA4 API 消耗 Quota、缺乏 Rate Limiting 讓惡意刷流量無成本、且路由仍使用舊版 netlify.toml redirects 而非 Netlify Functions V2 推薦的 config.path 模式。這些問題直接影響 GA4 API Quota 保護、Netlify 執行時間成本、以及前端盜用防禦。

## What Changes

- **CORS 強化與 TypeScript 遷移**：將 utils/cors.js 遷移為 utils/cors.ts，並將 localhost 匹配改為正規表達式精確匹配，防止假網域繞過
- **路由現代化**：移除 netlify.toml 中的 redirects 區塊，改用 Functions V2 的 config.path 在各 Function 檔案中直接定義路由
- **HTTP Method 限制**：透過 config.method 明確限制為 GET 和 OPTIONS，讓非預期的 Method 在 Netlify 邊緣節點直接回傳 405，不觸發 Function 執行
- **OPTIONS 預檢快取處理**：在 apiWrapper 中加入 OPTIONS 請求的 204 回應處理，並附加 `Access-Control-Max-Age` 標頭以快取預檢請求，大幅降低 OPTIONS 頻率
- **Rate Limiting**：在各 Function 的 config 中加入 rateLimit 設定，在 Netlify 邊緣節點阻擋惡意高頻請求

## Capabilities

### New Capabilities

- api-edge-security: 涵蓋 Netlify Functions V2 Config 層面的安全設定，包含 config.path 路由、config.method HTTP Method 限制、以及 config.rateLimit 速率限制

### Modified Capabilities

- api-architecture-foundation: 修改 CORS 驗證邏輯（精確匹配 localhost）、新增 OPTIONS 預檢快取回應處理

## Impact

- Affected specs: api-edge-security（新增）、api-architecture-foundation（修改）
- Affected code:
  - New: utils/cors.ts
  - Modified: functions/pageviews.ts, functions/popular-posts.ts, utils/apiWrapper.js, netlify.toml
  - Removed: utils/cors.js
