## 1. 核心安全與 CORS 邏輯強化

- [x] 1.1 實作 CORS Exact Match Validation 與 Regex 檢查 localhost：將 `utils/cors.js` 重新命名為 `utils/cors.ts`，加入嚴格的 TypeScript 型別定義，並把 `origin.includes('localhost')` 改寫為 `/^https?:\/\/localhost(:\d+)?$/` 的精確比對。驗證目標：手動呼叫 `checkOrigin('https://hacker-localhost.com', ['http://localhost:3000'])` 應回傳 `false`。

## 2. API Wrapper 中介層擴充

- [x] 2.1 實作 CORS Preflight Handling 與 明確放行/快取 OPTIONS：修改 `utils/apiWrapper.js`，在進入核心業務邏輯前，若 `req.method === 'OPTIONS'`，直接回傳 `204 No Content` 及包含 `Access-Control-Allow-Origin` 與 `Access-Control-Max-Age: 86400` 等 CORS 標頭。驗證目標：使用 `curl -X OPTIONS -I` 指令呼叫 API，應收到 204 狀態碼且包含 Max-Age 標頭，無業務邏輯執行。
- [x] 2.2 攔截不合法的 HTTP Method：修改 `utils/apiWrapper.js`，若 `req.method` 非 `GET` 或 `OPTIONS`，回傳 `405 Method Not Allowed` 錯誤。驗證目標：使用 `curl -X POST` 呼叫 API，應收到 405 的 Unified Error Response Envelope。

## 3. 邊緣節點防護 (Edge Security) 與路由遷移

- [x] 3.1 移除舊版路由設定：刪除 `netlify.toml` 中的 `[[redirects]]` 區塊，捨棄全域的 `/api/*` 轉發。驗證目標：部署或執行 `netlify dev` 時，全域 API 轉發失效，改由個別 Function 接管。
- [x] 3.2 實作 Edge Route and Method Restrictions 與 Edge Rate Limiting：修改 `functions/pageviews.ts` 與 `functions/popular-posts.ts`，引入 `import type { Config } from "@netlify/functions"`;。在檔案末端導出 `export const config: Config` 設定，其中包含 `path` (如 `/api/pageviews`)、`method: ['GET', 'OPTIONS']` (改用 Functions V2 Config)，以及 `rateLimit` (如 `windowLimit: 100`, `windowSize: 60`)。驗證目標：在本機環境或發布環境中，對這兩個路徑發送 POST 請求應被 Netlify Edge 直接回傳 405，並且快速發送超過 100 次 GET 請求應觸發 429 Too Many Requests。
