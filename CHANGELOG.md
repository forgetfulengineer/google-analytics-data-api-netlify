# Changelog

## [2.0.1](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/compare/v2.0.0...v2.0.1) (2026-11-26)


### Bug Fixes

* **cors:** 支援萬用字元放行與網域空白清洗，並對齊本地端規格與測試 ([f270378](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/commit/f270378cb0ed42ca608a0fd55ab49395b3fa2d7d)), closes [#8](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/issues/8)
* resolve review comments for PR [#8](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/issues/8) ([2773c28](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/commit/2773c28cca8c6526f2d502df98a0dd2db490a8ef))
* **schema:** 當 PAGEPATH_REGEX 未設定時 fallback 至預設正規式 '^/' ([065d524](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/commit/065d524f92731c6966a799b3231c520a1d15ed16)), closes [#8](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/issues/8)

## [2.0.0](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/compare/v1.0.0...v2.0.0) (2026-11-17)


### ⚠ BREAKING CHANGES

* **functions:** API 端點名稱由 /pageview 變更為 /pageviews，且回應 JSON 結構已改為標準包裝格式 ({ success, data, error})，呼叫端需配合更新

### Features

* **analytics:** 新增 GA4 用戶端初始化與報表 Data Access 模組 ([f320ae3](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/commit/f320ae36dae67d48631895492b69f1ab4d5bc942))
* **api:** 新增基礎 API 包裝器、錯誤處理與 Zod 驗證 Schema ([7621b26](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/commit/7621b26df9392fabde661eda2982d11a0d08950e))
* **functions:** 重構與新增 Netlify Functions API 及 Use Cases 快取機制 ([80c66cd](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/commit/80c66cde161cc653fc28c5c4c15cd34c065ba2af))


### Bug Fixes

* **functions:** 實作環境變數延遲解析與 API 全生命週期錯誤捕捉以防回傳 HTML 錯誤頁 ([1d9e21f](https://github.com/forgetfulengineer/google-analytics-data-api-netlify/commit/1d9e21f7f577a9ef16968bdb9b1b1a38ebdc68a4))
