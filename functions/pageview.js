const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = os.tmpdir(); // 系統暫存目錄
const keyPath = path.join(tmpDir, 'ga4-key.json');

// 將金鑰 JSON 字串寫入檔案
fs.writeFileSync(keyPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

// 設定環境變數供 GA4 API 使用
process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;

const client = new BetaAnalyticsDataClient();
const propertyId = process.env.PROPERTYID;
const startDate = process.env.STARTDATE;
const endtDate = process.env.ENDDATE;

exports.handler = async (event) => {
  const path = new URLSearchParams(event.queryStringParameters).get('path') || null;

  if (!propertyId || !startDate || !endtDate || !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables.' })
    };
  }

  try {
    const requests = [
      {
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDate, endDate: endtDate }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' }
        ]
      }
    ];

    if (path) {
      requests.push({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDate, endDate: endtDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: { value: path, matchType: 'EXACT' }
          }
        }
      });
    }

    const [response] = await client.batchRunReports({ property: `properties/${propertyId}`, requests });

    const totalReport = response.reports?.[0];
    const pv = totalReport?.rows?.[0]?.metricValues?.[0]?.value || '0';
    const uv = totalReport?.rows?.[0]?.metricValues?.[1]?.value || '0';

    const result = { pv, uv };

    if (path && response.reports?.[1]) {
      const pageReport = response.reports[1];
      const pageViews = pageReport?.rows?.[0]?.metricValues?.[0]?.value || '0';
      result.path = path;
      result.pageViews = pageViews;
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};