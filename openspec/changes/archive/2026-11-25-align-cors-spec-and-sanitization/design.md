## Context

專案在 `utils/apiWrapper.ts` 與 `utils/cors.ts` 處理 CORS 來源驗證時，發現以下問題：
1. 當環境變數設定 `ALLOWED_ORIGINS=*` 時，`checkOrigin` 執行嚴格比對導致一般瀏覽器 Origin 收到 403 被阻擋。
2. 當環境變數以逗號分隔帶有空白時（如 `https://a.com, https://b.com`），缺少 `trim()` 導致空格後的網域比對失敗。
3. 程式碼支援 `https?://localhost`，但文件與 OpenSpec 規則僅寫明 `http://localhost:*`，且單元測試缺乏相關測試覆蓋。

## Goals / Non-Goals

**Goals**:
- 支援 `ALLOWED_ORIGINS` 包含萬用字元 `*` 時放行所有來源。
- 支援環境變數解析時進行 trim 與 empty entry 過濾，具備輸入容錯能力。
- 規格與文件全面對齊支援 `http(s)://localhost:*` 本地開發環境。
- 補齊完整的單元測試與端對端整合測試。

**Non-Goals**:
- 不修改 Netlify Functions 邊緣層路由配置。
- 不引入外部第三方 CORS 套件。

## Decisions

### 決策一：在 checkOrigin 函式加入萬用字元放行邏輯
- **Rationale**: 當 `allowedOrigins` 陣列包含 `'*'` 時，代表允許任何來源跨域請求。在比對具體網域與 localhost 正則之前，直接回傳 `true`。
- **Alternatives Considered**: 曾在 `apiWrapper` 解析階段將 `ALLOWED_ORIGINS=*` 直接設為 `allowedOrigins = null`，但若使用者設定混合清單（如 `https://a.com,*`），在 `checkOrigin` 集中判斷 `allowedOrigins.includes('*')` 更加直觀且具備防禦性。

### 決策二：在 apiWrapper 環境變數解析加入網域前後空白清除與空字串過濾
- **Rationale**: 使用 `.split(',').map((o) => o.trim()).filter(Boolean)` 確保解析出來的白名單陣列乾淨無空白，且連續逗號或結尾逗號不會產生無效的空字串項。
- **Alternatives Considered**: 在比對前逐一 trim，但不如在解析切分時一次性清洗有效率且不易遺漏。

### 決策三：統一本地端開發來源為 http(s)://localhost:* 並對齊規格與文件
- **Rationale**: 現代前端本機開發（如 Vite / Next.js 本機 HTTPS、mkcert）常使用 HTTPS。維持程式碼正則 `/^https?:\/\/localhost(:\d+)?$/` 放行，更新 OpenSpec 規格與中英文 README 文件，消除規格落差。
- **Alternatives Considered**: 限縮程式碼為純 HTTP，但會破壞現代本機 HTTPS 開發流程。

## Implementation Contract

- **`utils/cors.ts` (`checkOrigin`)**:
  - 輸入：`origin: string`, `allowedOrigins: string[] | null`
  - 行為：
    - `!origin` → `true`
    - `!allowedOrigins` → `true`
    - `allowedOrigins.includes('*')` → `true`
    - `LOCALHOST_ORIGIN.test(origin)` → `true`（匹配 `http://localhost:*` 與 `https://localhost:*`）
    - 嚴格比對 `allowedOrigins.includes(origin)`
- **`utils/apiWrapper.ts`**:
  - `Netlify.env.get('ALLOWED_ORIGINS')` 透過 `.split(',').map((o) => o.trim()).filter(Boolean)` 解析。
- **Acceptance Criteria**:
  - 單元測試與整合測試 100% 通過。
  - 文件與規格均一致表述為 `http(s)://localhost:*`。

## Risks / Trade-offs

- **[Risk] 設定 `ALLOWED_ORIGINS=*` 時的回應標頭行為** → 依照 `apiWrapper.ts` 現有邏輯：若請求帶有具體 `Origin`，通過驗證後回應標頭帶該 `Origin`；無 `Origin` 時回應 `*`。此行為符合 CORS 規範且對快取友好。

## Migration Plan

直接部署，無資料遷移或破壞性變更。

## Open Questions

無。
