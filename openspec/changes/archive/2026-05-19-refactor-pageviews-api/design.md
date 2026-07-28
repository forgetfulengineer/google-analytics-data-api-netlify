## Context

目前專案中的 `pageviews.js` 是無伺服器 (Serverless) 進入點，包含了從環境變數讀取、參數解析、直接操作快取 (Netlify Blobs) 到直接呼叫 GA4 Client 等所有邏輯。這種單一巨大 Handler 的寫法不利於單元測試、不利於未來擴展新指標，且 GA4 資料解析依賴了脆弱的陣列索引（硬編碼）。
我們需要重構它，使其符合 `@/netlify-functions-api-architecture` 定義的 4-Layer 架構，並同時將對外 API 回傳格式標準化。

## Goals / Non-Goals

**Goals:**
- 將 `pageviews` endpoint 重構成乾淨的 Handler, Schema, Use Case, Repository 四層結構，使用 TypeScript (`.ts`)。
- 在 Repository 實作通用的 GA4 回傳欄位動態解析器 `parseGA4Report`，拋棄 array index 取值。
- 重構 API 回傳為語意化且易於擴展的 nested 格式。
- 使用依賴注入 (Factory Pattern) 提高 Use Case 的可測試性。
- 保留原有 CDN 緩存策略與 Netlify Blobs 快取備援機制。

**Non-Goals:**
- 不在此提案中重構 `popular-posts.js`，但 Repository 設計需能直接支援未來的 `popular-posts` 重構需求。
- 不修改 `utils/apiWrapper.js` 或 `src/infrastructure/analyticsClient.ts` 的核心行為。

## Decisions

### 4-Layer Architecture Separation for Pageviews API
- **決策**：嚴格實作四層架構。
  - **Handler**: `functions/pageviews.ts`
  - **Schema**: `src/schemas/pageviews.schema.ts`
  - **Use Case**: `src/use-cases/getPageviews.ts`
  - **Repository**: `src/repositories/analyticsRepository.ts`
- **替代方案**：保留在單一檔案內僅做模組切割。
- **理由**：四層架構能確保各層級職責分離。Handler 專注 HTTP 與驗證，Use Case 專注業務與快取，Repository 專注與第三方資料來源 (GA4) 互動，最大化實作的可測試性。

### Standardized GA4 Parsing in Repository
- **決策**：在 `analyticsRepository.ts` 中實作通用函數 `parseGA4Report(report)`。該函數會遍歷 `dimensionHeaders` 與 `metricHeaders`，動態將每一列資料轉換成以 Header 名稱為 Key 的鍵值對物件，並將指標數值自動轉為 `number`。
- **替代方案**：為每個 API 的每種欄位排列組合編寫專用的對應規則。
- **理由**：動態解析器能保證當 GA4 查詢的新增、刪除或順序調整時，程式碼不需要做任何 hardcode 修改，也能完美相容未來 `popular-posts` 以及其他 API 的格式解析。

### Standardized Nested API Contract
- **決策**：改變 API 合約，將原有的扁平 `{ pv, uv, pageViews }` 結構改為嵌套格式：
  ```json
  {
    "site": {
      "pageviews": 1000,
      "activeUsers": 500
    },
    "page": {
      "path": "/about",
      "pageviews": 50
    }
  }
  ```
- **替代方案**：維持扁平的 `pv`/`uv`/`pageViews` 命名。
- **理由**：原本的命名 `pv` (代表全站) 與 `pageViews` (代表單頁) 容易造成前端工程師的誤解，且不具備良好的擴充性。巢狀結構清晰地隔離了「全站數據 (site)」與「單頁數據 (page)」，更具現代化 API 的設計感。

### Dependency Injection in Use Case
- **決策**：在 `getPageviews.ts` 中使用 Factory Pattern 匯出 `makeGetPageviews` 函式，藉此注入 `analyticsRepository` 依賴。
- **替代方案**：直接在 Use Case 檔案頂部使用 `import` 載入 Repository。
- **理由**：直接載入會讓 Use Case 對於 Repository 產生強耦合，在進行 Jest/Vitest 測試時需要繁瑣的 `jest.mock` 設定。使用 Factory Pattern 可以直接傳入一個 Mocked Repository，讓單元測試變得極其簡單乾淨。

## Implementation Contract

### Behavior
- 客戶端發送 GET 請求到 `/api/pageviews`（或帶有 `?path=/about` 查詢參數）。
- 成功時，回傳 `200 OK` 與標準化的 nested JSON 回應。
- 驗證失敗時，回傳 `400 Bad Request` 與錯誤詳情。
- 系統內部發生錯誤（如連不上 GA4）時，若 Blobs 快取中存有先前備援資料，則靜默降級回傳備援資料並回傳 `200 OK`（附帶 log 警告）；若無快取備援，則回傳 `503 Upstream Error`。

### Interface / Data Shape
- **Query Parameter Schema**:
  ```ts
  export const PageviewsQuerySchema = z.object({
    path: z.string().optional(),
  });
  ```
- **API Response Shape**:
  ```ts
  interface PageviewsResponse {
    site: {
      pageviews: number;
      activeUsers: number;
    };
    page?: {
      path: string;
      pageviews: number;
    };
  }
  ```
- **Repository Interface**:
  ```ts
  export interface AnalyticsRepository {
    fetchPageviews(params: {
      propertyId: string;
      startDate: string;
      endDate: string;
      path?: string;
    }): Promise<{
      site: { pageviews: number; activeUsers: number };
      page?: { path: string; pageviews: number };
    }>;
  }
  ```

### Failure Modes
- **Zod 驗證失敗**：Handler 將會拋出 `ValidationError`，這會被 `apiWrapper` 的錯誤邊界捕獲，轉換成：
  `{ "error": "Validation failed", "details": ... }` 伴隨 400 狀態碼。
- **GA4 連線/認證失敗**：Use Case 會捕獲異常，先去讀取 Netlify Blobs `analytics-storage` 中的備援 Key `pageview:<path || 'total'>:start=<start>:end=<end>`。
  - 若取得備援資料，則將其回傳（附帶 `console.error`）。
  - 若無備援資料，則拋出 `UpstreamError` 傳回 503 狀態碼。

### Acceptance Criteria
- `/api/pageviews` 請求必須能正常取得全站 `pageviews` 與 `activeUsers`。
- `/api/pageviews?path=/blog-post` 請求必須同時取得全站指標與單頁 `/blog-post` 的 `pageviews`。
- 當手動停用 GA4 憑證或阻斷 API 連線時，若快取存在，API 必須能自動降級讀取 Netlify Blobs 並成功回傳快取數據。
- 專案程式碼中不可存在任何 hardcode GA4 row/metric/dimension 索引的取值邏輯。

### Scope Boundaries
- **In Scope**:
  - 重構 `functions/pageviews.js` (改寫為 `functions/pageviews.ts`)。
  - 建立 `src/schemas/pageviews.schema.ts`。
  - 建立 `src/use-cases/getPageviews.ts`。
  - 建立 `src/repositories/analyticsRepository.ts`。
- **Out of Scope**:
  - 不做任何與 `popular-posts.js` 相關的實作或重構（僅需使其維持正常運行，但其內部暫不改寫）。
  - 不更動 `utils/apiWrapper.js` 快取頭部與 CORS 的行為。

## Risks / Trade-offs

- **[Risk] 前端串接 Breaking Change** → [Mitigation] 前端網頁需配合修改取得 PV/UV 的欄位路徑（從舊的 `res.pv` 改為 `res.site.pageviews` 等）。
- **[Risk] 快取 Key 的不一致性** → [Mitigation] 確保 Use Case 在產生快取鍵時，嚴格遵守舊的格式 `pageview:<path || 'total'>:start=<start>:end=<end>`，使得重構部署後，舊的快取仍可無縫沿用作為 fallback。
