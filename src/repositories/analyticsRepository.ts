import { getAnalyticsClient } from '../infrastructure/analyticsClient.js';

export interface GA4Report {
  dimensionHeaders?: { name?: string | null }[] | null;
  metricHeaders?: { name?: string | null }[] | null;
  rows?:
    | {
        dimensionValues?: { value?: string | null }[] | null;
        metricValues?: { value?: string | null }[] | null;
      }[]
    | null;
}

export function parseGA4Report(
  report: GA4Report,
): Record<string, string | number>[] {
  if (!report?.rows || report.rows.length === 0) {
    return [];
  }

  const dimensionKeys = (report.dimensionHeaders || []).map(
    (h) => h?.name || '',
  );
  const metricKeys = (report.metricHeaders || []).map((h) => h?.name || '');

  return report.rows.map((row) => {
    const result: Record<string, string | number> = {};

    const dimValues = row.dimensionValues || [];
    dimValues.forEach((val, idx) => {
      const key = dimensionKeys[idx];
      if (key) {
        result[key] = val?.value ?? '';
      }
    });

    const metValues = row.metricValues || [];
    metValues.forEach((val, idx) => {
      const key = metricKeys[idx];
      if (key) {
        const rawValue = val?.value ?? '0';
        const numVal = Number(rawValue);
        result[key] = Number.isNaN(numVal) ? rawValue : numVal;
      }
    });

    return result;
  });
}

export interface PageviewsParams {
  propertyId: string;
  startDate: string;
  endDate: string;
  path?: string;
}

export interface PageviewsResponse {
  site: {
    pageviews: number;
    activeUsers: number;
  };
  page?: {
    path: string;
    pageviews: number;
  };
}

export async function fetchPageviews(
  params: PageviewsParams,
): Promise<PageviewsResponse> {
  const { propertyId, startDate, endDate, path } = params;

  const requests: any[] = [
    {
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    },
  ];

  if (path) {
    requests.push({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { value: path, matchType: 'EXACT' },
        },
      },
    });
  }

  const client = getAnalyticsClient();
  const [response] = await client.batchRunReports({
    property: `properties/${propertyId}`,
    requests,
  });

  const totalReport = response.reports?.[0] || {};
  const parsedSite = parseGA4Report(totalReport);
  const siteData = parsedSite[0] || {};

  const site = {
    pageviews: Number(siteData.screenPageViews) || 0,
    activeUsers: Number(siteData.activeUsers) || 0,
  };

  let page: { path: string; pageviews: number } | undefined;

  if (path && response.reports?.[1]) {
    const pageReport = response.reports[1];
    const parsedPage = parseGA4Report(pageReport);
    if (parsedPage.length > 0) {
      const pageData = parsedPage[0];
      page = {
        path: String(pageData.pagePath || path),
        pageviews: Number(pageData.screenPageViews) || 0,
      };
    } else {
      page = {
        path,
        pageviews: 0,
      };
    }
  }

  return { site, page };
}

export interface PopularPostsParams {
  propertyId: string;
  startDate: string;
  endDate: string;
  pagePathRegex: string;
}

export interface PopularPostsResponse {
  month: { path: string; pageviews: number }[];
  allTime: { path: string; pageviews: number }[];
}

export async function fetchPopularPosts(
  params: PopularPostsParams,
): Promise<PopularPostsResponse> {
  const { propertyId, startDate, endDate, pagePathRegex } = params;

  const requests: any[] = [
    {
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'PARTIAL_REGEXP', value: pagePathRegex },
        },
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    },
    {
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'PARTIAL_REGEXP', value: pagePathRegex },
        },
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    },
  ];

  const client = getAnalyticsClient();
  const [response] = await client.batchRunReports({
    property: `properties/${propertyId}`,
    requests,
  });

  const result: PopularPostsResponse = {
    month: [],
    allTime: [],
  };

  const monthReport = response.reports?.[0] || {};
  const allTimeReport = response.reports?.[1] || {};

  const parsedMonth = parseGA4Report(monthReport);
  result.month = parsedMonth.map((row) => ({
    path: String(row.pagePath || ''),
    pageviews: Number(row.screenPageViews) || 0,
  }));

  const parsedAllTime = parseGA4Report(allTimeReport);
  result.allTime = parsedAllTime.map((row) => ({
    path: String(row.pagePath || ''),
    pageviews: Number(row.screenPageViews) || 0,
  }));

  return result;
}
