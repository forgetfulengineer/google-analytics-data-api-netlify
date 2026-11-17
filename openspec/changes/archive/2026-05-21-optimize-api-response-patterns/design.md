## Context

目前 google-analytics-data-api-netlify 部署在 Netlify Functions 上，藉由 GA4 Data API 提供流量資訊給部落格使用。然而，API 的成功與失敗回傳結構較為雜亂且不一致。本設計提出以統一且嚴謹的 Unified JSON Envelope 重構 `utils/response.js`、`src/errors/AppError.ts` 與 `utils/apiWrapper.js`，以保證高可用性與一致的接口設計。

## Goals / Non-Goals

**Goals:**
- 提供統一的 `{ code, message, data, meta?, errors? }` JSON 回應封裝，適用於全站所有成功及錯誤回應。
- 使系統所有攔截器（開關、環境變數驗證、CORS 驗證）與錯誤處理完全符合 RFC 7807 概念的統一錯誤袋（Unified Error Envelope）。
- 優化單元測試，使 `functions/pageviews.test.ts` 能正確且嚴密地測試新版 Unified JSON Envelope。

**Non-Goals:**
- 不改變 GA4 Data API 的底層查詢與快取邏輯，不重構 Repository 與 Use Case 的業務資料處理邏輯。
- 不改變已有的 Deno 或 esbuild 打包設定。

## Decisions

### 決策一：在 AppError 核心類別引入機器可讀錯誤碼 code 欄位
- **Rationale**: 原本 `AppError` 僅有 `statusCode` 與 `message`，這使得客戶端在發生錯誤時無法有效藉由一個固定的字串標識符（例如 `INVALID_INPUT`、`UPSTREAM_ERROR`）做條件判斷。新增 `code` 欄位並設定子類別（如 `ValidationError`、`NotFoundError`、`UpstreamError`）的預設 code 值，能大幅提高 API 接口的嚴謹度。
- **Alternatives Considered**: 曾考慮由 `apiWrapper.js` 動態判定 class 名稱來產生 code，但這在程式碼打包（Minification / Obfuscation）時會因類別名稱變更而失效，因此顯式在類別中定義 properties 是唯一安全的做法。

### 決策二：將 ValidationError 的 details 物件扁平化為 errors 陣列
- **Rationale**: 之前 validation 錯誤在 payload 是 `{ error: "Validation failed", details: { path: ["..."] } }`。為了達成高可用性， we decided to flatten the Zod schema details under `ValidationError` directly to the standardized `errors` array, while keeping `details` for backward compatibility.
- **Alternatives Considered**: 保持原樣但由 apiWrapper 去做轉換。然而這會分散錯誤結構定義的職責，使 `AppError.ts` 失去單一職責性。

### 決策三：重構 apiWrapper.js 作為唯一的 Response 邊界與 CORS 守衛
- **Rationale**: 將原本的 `jsonResponse` 替換為以新版 response helpers (`successResponse` / `errorResponse`) 做輸出。此處我們統一處理 CORS 行為：當設定 `ALLOWED_ORIGINS` 時，嚴格比對 Origin 標頭；若通過則回傳 Origin 值，未通過則拒絕並回傳標準 403 錯誤袋。
- **Alternatives Considered**: 無。

## Implementation Contract

#### 1. 成功回傳格式（Success Response Shape）
- **Interface**: 所有成功回傳均為 HTTP 200。
- **JSON Structure**:
  ```json
  {
    "code": "SUCCESS",
    "message": "Query successful",
    "data": { ... },
    "meta": {
      "timestamp": 1716019200000
    }
  }
  ```

#### 2. 錯誤回傳格式（Error Response Shape）
- **Interface**: 根據情境回傳對應的 HTTP Status Code（如 400、403、404、500、503）。
- **JSON Structure**:
  ```json
  {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "data": null,
    "errors": [
      {
        "field": "fieldName",
        "reason": "Reason detail"
      }
    ]
  }
  ```

#### 3. Netlify Blobs 快取與備援設計
- **Key 格式**:
  - pageviews: `pageview:<path || 'total'>:start=<start>:end=<end>`
  - popular-posts: `popular:${type || 'all'}:regex=${pagePathRegex}:start=${startDate}:end=${endDate}`
- **讀寫時機**:
  - 成功獲取 GA4 最新數據時，非同步將資料以 JSON 形式寫入 Netlify Blobs。
  - 當 GA4 呼叫發生不可抗力之錯誤（如配額超限或網路中斷）被 catch 到時，會做為 fallback 讀取 Blobs 資料並回傳（HTTP 200）。若無快取備援，則拋出 `UpstreamError` 回傳標準 503 錯誤回應。

#### 4. CDN 快取與 CORS 策略
- **快取 Header 設定**:
  - `Cache-Control`: `public, max-age=0, must-revalidate`
  - `Netlify-CDN-Cache-Control`: `public, durable, s-maxage=21600, stale-while-revalidate=21600`
  - `Netlify-Vary`: pageviews API 為 `query=path`，popular-posts API 為 `query=type`
- **CORS AllowedOrigins 處理**:
  - 若環境變數 `ALLOWED_ORIGINS` 未設定，CORS `Access-Control-Allow-Origin` 預設回傳 `*`。
  - 若 `ALLOWED_ORIGINS` 已設定（以逗號分隔），則嚴格比對請求 Origin。比對通過則回傳該 Origin 值，未通過則回傳 HTTP 403 並帶有代碼 `CORS_FORBIDDEN`。此外，`localhost` 永遠被允許通過，以便利本機開發測試。

#### 5. 驗證條件與驗證手段
- 執行 `npm run test` 以驗證所有 API 成功與失敗的測試斷言。所有的單元測試必須能精準解析並通過 Unified Envelope 格式。

## Risks / Trade-offs

- **[Risk]** → 由於將回傳值包裝在 `data` 根節點，任何外部呼叫此 API 的舊版靜態前端如未做更新，將會取得 undefined 的屬性。
- **[Mitigation]** → 本次重構已被明確聲明「無需顧慮前端的資料處理，可直接重構」，因此我們追求最嚴謹與最乾淨的新架構設計。
