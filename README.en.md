<a href="https://forgetfulengineer.github.io/">
  <img src="https://forgetfulengineer.github.io/img/avatar.png" alt="Logo" width="80">
</a>

# google-analytics-data-api-netlify

A serverless REST API built on the [Google Analytics Data API (GA4)](https://developers.google.com/analytics/devguides/reporting/data/v1), tailored for static websites (such as Hexo blogs).

Deployed on [Netlify Functions](https://docs.netlify.com/functions/overview/) (v2) with zero server maintenance, providing lightweight query endpoints out of the box:

- **Site & Page Views (`GET /api/pageviews`)**: Query total site PV/UV or page-specific PV by path.
- **Popular Posts (`GET /api/popular-posts`)**: Filter and return top posts for the last 30 days and all-time rankings.

[繁體中文](./README.md) | **English**

---

## Features

- 🚀 **Zero-Config Deployment**: Seamless GitHub and Netlify integration with auto-deploy on push.
- 📊 **Traffic stats API**: Query site/page traffic stats.
- 📊 **Popular post API**: Query popular post rankings.
- ⚡ **CDN Edge Caching**: Durable edge caching (`s-maxage=21600`, 6-hour cache) backed by Netlify Blobs fallback to conserve GA4 quota and deliver sub-millisecond responses.
- 🛡️ **Rate Limiting & Security**: Built-in rate limiting (100 req/60s aggregated by IP and domain) and configurable CORS origin whitelisting.
- 🎛️ **Feature Flags**: Easily toggle individual endpoints on or off via environment variables.

---

## Quick Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable **Google Analytics Data API**
   - Create a Service Account and download the key credentials (`JSON` file)
2. Go to [Google Analytics](https://analytics.google.com/)
   - Navigate to **Admin** → **Property Access Management** and add the service account email (grant at least "Viewer" permissions)
   - Note down the GA4 **Property ID** (numbers only)
3. Fork this repository to your GitHub account
4. Go to [Netlify](https://app.netlify.com/), create a new site, and link your forked repository
5. Configure environment variables (Project configuration → Environment variables):

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PROPERTYID` | **Yes** | None | Google Analytics 4 Property ID (numeric, e.g., `123456789`) |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | **Yes** | None | Full JSON string of the Google Cloud service account key (keep confidential) |
| `STARTDATE` | **Yes** | None | Start date for all-time site stats in `YYYY-MM-DD` format (e.g., `2023-12-31`) |
| `ENDDATE` | **Yes** | None | End date for all-time site stats (e.g., `today` or `YYYY-MM-DD`) |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated list of allowed CORS origins (e.g., `https://example.com,https://blog.example.com`). Defaults to allowing all origins; when set, allows specified domains plus local development (`http://localhost:*`) |
| `PAGEPATH_REGEX` | No | `^/` | Regular expression for filtering site article pages (e.g., `^/(posts|articles)/.+`). Used by both the popular-posts and pageviews endpoints for path validation |
| `ENABLE_PAGEVIEW` | No | `true` | Enable or disable the pageviews endpoint (`/api/pageviews`). When set to `false`, requests return 404 |
| `ENABLE_POPULAR` | No | `true` | Enable or disable the popular-posts endpoint (`/api/popular-posts`). When set to `false`, requests return 404 |

> 📖 For an in-depth walkthrough with screenshots, check out: [【API】使用 Google Analytics Data API 架設網站 PV/UV 查詢 API](https://forgetfulengineer.github.io/Backend/API/Building-a-Traffic-API-with-GA-Data-API/)

---

## API Quick Start

Base URL for all endpoints:
```text
https://your-site.netlify.app/api
```

- **Standard Response Envelope**:
  ```json
  {
    "code": "SUCCESS",
    "message": "Query successful",
    "data": { ... }
  }
  ```
- **CDN Caching**: Cached on Netlify CDN edge for 6 hours (`s-maxage=21600`). Repeated requests within this window do not consume GA4 quota.
- **Rate Limit**: Up to 100 requests per 60-second window per IP and domain.

### 1. Get Pageviews & Active Users (`GET /api/pageviews`)

- **Endpoint**: `/api/pageviews`
- **Query Parameters**:
  - `path` (optional, string): Page path to query (e.g., `/posts/hello-world/`). If omitted, returns site-wide metrics only.

#### Query Site-Wide Metrics
```bash
curl "https://your-site.netlify.app/api/pageviews"
```

Response (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "Query successful",
  "data": {
    "site": {
      "pageviews": 12500,
      "activeUsers": 3200
    }
  }
}
```

#### Query Specific Page Metrics (Frontend fetch example)
```javascript
fetch('https://your-site.netlify.app/api/pageviews?path=/posts/hello-world/')
  .then((res) => res.json())
  .then((res) => {
    console.log('Site PV:', res.data.site.pageviews);
    console.log('Page PV:', res.data.page?.pageviews);
  });
```

Response (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "Query successful",
  "data": {
    "site": {
      "pageviews": 12500,
      "activeUsers": 3200
    },
    "page": {
      "path": "/posts/hello-world/",
      "pageviews": 150
    }
  }
}
```

---

### 2. Get Popular Posts Ranking (`GET /api/popular-posts`)

- **Endpoint**: `/api/popular-posts`
- **Query Parameters**: None (automatically filtered by `PAGEPATH_REGEX`)

#### Example Request
```bash
curl "https://your-site.netlify.app/api/popular-posts"
```

Or using frontend fetch:
```javascript
fetch('https://your-site.netlify.app/api/popular-posts')
  .then((res) => res.json())
  .then((res) => {
    console.log('Past 30 Days Popular:', res.data.month);
    console.log('All-Time Popular:', res.data.allTime);
  });
```

Response (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "Query successful",
  "data": {
    "month": [
      { "path": "/posts/docker-guide/", "pageviews": 850 },
      { "path": "/posts/mysql-index/", "pageviews": 620 }
    ],
    "allTime": [
      { "path": "/posts/git-cheatsheet/", "pageviews": 5400 },
      { "path": "/posts/docker-guide/", "pageviews": 4300 }
    ]
  }
}
```

---

## FAQ & Troubleshooting

<details>
<summary><b>How do I configure CORS restrictions?</b></summary>

- By default, if `ALLOWED_ORIGINS` is not set, the API responds with `Access-Control-Allow-Origin: *`, allowing any origin.
- When `ALLOWED_ORIGINS` is specified (e.g., `https://example.com,https://blog.example.com`), requests from origins outside this list (other than local development at `http://localhost:*`) will receive a 403 Forbidden response.
</details>

<details>
<summary><b>What is the cache policy and update frequency?</b></summary>

- Responses include the `Netlify-CDN-Cache-Control` header caching at the edge for 6 hours (`s-maxage=21600`). During this window, identical requests are served directly from the CDN without hitting GA4.
- On each successful GA4 call, data is backed up to Netlify Blobs (`analytics-storage`). If the GA4 API fails or hits quota limits, the system automatically falls back to the Blobs cache to ensure high availability.
</details>

<details>
<summary><b>How do I temporarily disable an endpoint?</b></summary>

- If you don't need a specific endpoint (e.g., popular posts), set `ENABLE_POPULAR` to `false` in your Netlify environment variables.
- When disabled, requests to that endpoint immediately return 404 Not Found.
</details>

<details>
<summary><b>Error Code Reference</b></summary>

- **400 Bad Request**: Query parameter validation failed (e.g., invalid `path` format).
- **403 Forbidden**: CORS origin check failed; the request origin is not in `ALLOWED_ORIGINS`.
- **404 Not Found**: Endpoint does not exist, or the feature is disabled via its environment variable.
- **405 Method Not Allowed**: Only `GET` and `OPTIONS` are supported.
- **503 Service Unavailable**: GA4 API call failed and no fallback cache is available in Netlify Blobs.
</details>
