## Context

目前專案中，所有的 API 進入點與核心邏輯皆已使用 TypeScript 撰寫，但共用工具層（`utils/`）中的 `apiWrapper.js`、`response.js`、`envCheck.js` 仍使用 JavaScript，並搭配手寫的 `.d.ts` 宣告檔提供型別支援。這種做法容易導致實作與型別不一致。由於專案的 `tsconfig.json` 已開啟 `strict: true` 並且設定 `"module": "NodeNext"`，將剩餘的 JavaScript 檔案全數遷移至 TypeScript 能統一專案架構，並讓 TypeScript 編譯器能直接對實作邏輯進行靜態檢查。

## Goals / Non-Goals

**Goals:**
- 將 `utils/` 目錄下的 `.js` 與手寫 `.d.ts` 轉換為單一的 `.ts` 檔案。
- 確保所有轉譯後的檔案依然能符合 `NodeNext` ESM 的 import 規範。
- 透過既有測試，確保轉換後不會影響任何運行時行為。

**Non-Goals:**
- 改變現有函數的簽名或介面設計。
- 修改任何業務邏輯。
- 調整或修改 Netlify Blobs 快取策略、CORS 行為與 API 回應的 JSON Schema。

## Decisions

### 決策一：型別從手寫 `.d.ts` 轉移至 `.ts` 實作中
- **決策**：移除 `utils/apiWrapper.d.ts` 與 `utils/response.d.ts`，並將其中的介面與型別定義（如 `ApiWrapperOptions`）直接內建至對應的 `.ts` 實作檔中。
- **替代方案考慮**：保持現狀。但這違背了全盤 TS 化的目標且維護成本高，故不採用。

### 決策二：維持 NodeNext 模組解析標準下的 import 副檔名
- **決策**：由於 `tsconfig.json` 中設定為 `"module": "NodeNext"`，所有新轉換的 `.ts` 檔案內部若有 import 其他相對路徑檔案（如 `import { checkOrigin } from './cors.js';`），其副檔名依然維持為 `.js`。不改用無副檔名或 `.ts` 結尾。
- **替代方案考慮**：改用無副檔名，但這不符合 ESM/NodeNext 的標準行為，編譯時會報錯。

## Implementation Contract

- **Behavior**: 轉換完成後，對呼叫端（如 `functions/pageviews.ts`）而言，使用的匯入路徑與 API 行為完全不變。所有的檢查（如 Enable Flag、CORS 驗證、Missing Env 檢查）均維持原本的運作邏輯。
- **Interface / data shape**:
  - `apiWrapper` 的參數型別 `ApiWrapperOptions`（包含 `enableFlag`, `requiredEnv`, `handlerFn`, `extraHeaders`）必須完整定義並導出。
  - `response` 系列函數（`jsonResponse`, `successResponse`, `errorResponse`）必須標示其參數型別與回傳的 `Response` 型別。
- **Acceptance criteria**: 
  - 所有轉為 `.ts` 的檔案不再報任何 TypeScript 編譯錯誤（`npx tsc --noEmit`）。
  - 專案既有的 `vitest` 測試需全部通過。
- **Scope boundaries**: 僅修改 `utils/apiWrapper.ts`, `utils/response.ts`, `utils/envCheck.ts` 及其關聯檔案，並移除 `.js` 和 `.d.ts` 檔案，不涉及修改其他未受影響之模組。

## Risks / Trade-offs

- **Risk**: 刪除 `.js` 後如果某些檔案被錯誤地以舊的路徑參考（例如在 `package.json` 或某些未納入 TS 檢查的地方），可能會導致執行階段找不到模組。
- **Mitigation**: 專案部署依賴的是 `vitest` 以及 Netlify 自己的打包機制（esbuild）。透過執行完整的測試套件即可驗證路徑相依性是否正常。
