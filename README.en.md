<a href="https://forgetfulengineer.github.io/">
  <img src="https://forgetfulengineer.github.io/img/avatar.png" alt="Logo" width="80">
</a>

# google-analytics-data-api-netlify

This is a simple query API built using the **Google Analytics Data API**, ideal for static websites.

It allows you to retrieve:

- Total site PV (Page Views) and UV (Unique Visitors)
- Page-level PV (based on specific `path`)

This API is built using [Netlify Functions](https://docs.netlify.com/functions/overview/), with **no additional server required**.

[繁體中文](./README.md) | **English**

---

## Features

- 🚀 **Quick Deployment**: Easily deploy via GitHub + Netlify integration
- 🔧 **Flexible Queries**: Get full-site PV/UV or specific page PV
- 📅 **Custom Date Range**: Set start and end date for queries
- ☁️ **Serverless Ready**: Perfect for static websites without backend

---

## Quick Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable the `Google Analytics Data API`
- Create a service account and download the credentials (`JSON`)
2. Go to [Google Analytics](https://analytics.google.com/)
- Add the service account to the property’s **Access Management**
- Retrieve the GA **Property ID**
3. Fork this repository to your GitHub account
4. Visit [Netlify](https://app.netlify.com/), create a new site, and connect your forked GitHub repo
5. Add the following environment variables under Site Settings → Environment Variables:

    | Name | Description |
    |------|-------------|
    | `PROPERTYID` | Your GA Property ID |
    | `GOOGLE_APPLICATION_CREDENTIALS_JSON` | The content of your GA service account key JSON (keep it secret) |
    | `STARTDATE` | Start date for data collection, e.g. `2023-12-31` |
    | `ENDDATE` | End date for data collection, e.g. `today` |

> For a full deployment guide, check out:[【API】使用 Google Analytics Data API 架設網站 PV/UV 查詢 API](https://forgetfulengineer.github.io/Backend/API/Building-a-Traffic-API-with-GA-Data-API/)

## API Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `path` | No | The path of the specific page you want to query | `/Backend/MySQL/DQL-Execution-Order/` |

## API Usage

### Get Total Site PV/UV

GET `https://{your-site}.netlify.app/.netlify/functions/pageview`

Response

```json json
{
  "pv": string,
  "uv": string
}
```

#### Example

GET `https://ga-api-demo.netlify.app/.netlify/functions/pageview`

Response

```json json
{
  "pv": "8888",
  "uv": "1234"
}
```

### Get Specific Page PV

GET `https://{your-site}.netlify.app/.netlify/functions/pageview?path={your-path}`

Response

```json json
{
  "pv": string,
  "uv": string,
  "path": string,
  "pageViews": string
}
```

#### 範例

GET `https://ga-api-demo.netlify.app/.netlify/functions/pageview?path=/Backend/MySQL/DQL-Execution-Order/`

Response

```json json
{
  "pv": "8888",
  "uv": "1234",
  "path": "/Backend/MySQL/DQL-Execution-Order/",
  "pageViews": "100"
}
```

## Additional Notes

- Deployed on [Netlify Functions](https://docs.netlify.com/functions/overview/), written in Node.js. Each `.js` file is automatically wrapped by Netlify into a callable API endpoint (Function Endpoint). When a request is received, Netlify automatically invokes the exported `handler` function—no need to set up a server or call the function manually.
- Uses the [`@google-analytics/data`](https://www.npmjs.com/package/@google-analytics/data) npm package to connect to the [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1), and queries GA data using the [`batchRunReports`](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/batchRunReports) method along with environment variables for configuration.
- Implements `async/await` syntax to handle asynchronous operations. The `await` keyword pauses execution until the `Promise` resolves, making the code flow more like synchronous logic.
- The response includes the HTTP header `{ 'Access-Control-Allow-Origin': '*' }`, which enables Cross-Origin Resource Sharing (CORS). This allows your frontend (e.g., a site hosted on GitHub Pages) to fetch data from this API without being blocked by the browser’s same-origin policy.
