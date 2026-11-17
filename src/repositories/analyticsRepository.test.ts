import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAnalyticsClient } from '../infrastructure/analyticsClient.js';
import {
  fetchPageviews,
  fetchPopularPosts,
  parseGA4Report,
} from './analyticsRepository.js';

vi.mock('../infrastructure/analyticsClient.js', () => ({
  getAnalyticsClient: vi.fn(),
}));

const mockGetAnalyticsClient = vi.mocked(getAnalyticsClient);

describe('parseGA4Report', () => {
  it('dynamically parses GA4 reports based on headers without hardcoded indices', () => {
    const mockReport = {
      dimensionHeaders: [{ name: 'pagePath' }],
      metricHeaders: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      rows: [
        {
          dimensionValues: [{ value: '/about' }],
          metricValues: [{ value: '100' }, { value: '50' }],
        },
      ],
    };

    const result = parseGA4Report(mockReport);

    expect(result).toEqual([
      {
        pagePath: '/about',
        screenPageViews: 100,
        activeUsers: 50,
      },
    ]);
  });

  it('returns an empty array if report has no rows', () => {
    const mockReport = {
      dimensionHeaders: [{ name: 'pagePath' }],
      metricHeaders: [{ name: 'screenPageViews' }],
      rows: undefined,
    };

    const result = parseGA4Report(mockReport);

    expect(result).toEqual([]);
  });

  it('maps numeric metrics to numbers and keeps non-numeric metrics as strings', () => {
    const result = parseGA4Report({
      dimensionHeaders: [{ name: 'pagePath' }],
      metricHeaders: [{ name: 'screenPageViews' }, { name: 'label' }],
      rows: [
        {
          dimensionValues: [{ value: '/mixed' }],
          metricValues: [{ value: '42' }, { value: 'not-a-number' }],
        },
      ],
    });

    expect(result).toEqual([
      {
        pagePath: '/mixed',
        screenPageViews: 42,
        label: 'not-a-number',
      },
    ]);
  });
});

describe('fetchPageviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a mocked GA4 client and requests only total metrics when path is omitted', async () => {
    const mockBatchRunReports = vi.fn().mockResolvedValue([
      {
        reports: [
          {
            metricHeaders: [
              { name: 'screenPageViews' },
              { name: 'activeUsers' },
            ],
            rows: [
              {
                metricValues: [{ value: '100' }, { value: '40' }],
              },
            ],
          },
        ],
      },
    ]);
    mockGetAnalyticsClient.mockReturnValue({
      batchRunReports: mockBatchRunReports,
    } as never);

    const result = await fetchPageviews({
      propertyId: '123',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    expect(mockBatchRunReports).toHaveBeenCalledWith({
      property: 'properties/123',
      requests: [
        {
          property: 'properties/123',
          dateRanges: [{ startDate: '2026-01-01', endDate: '2026-01-31' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        },
      ],
    });
    expect(result).toEqual({
      site: {
        pageviews: 100,
        activeUsers: 40,
      },
      page: undefined,
    });
  });

  it('adds an exact pagePath request and maps an empty page report to zero pageviews', async () => {
    const mockBatchRunReports = vi.fn().mockResolvedValue([
      {
        reports: [
          {
            metricHeaders: [
              { name: 'screenPageViews' },
              { name: 'activeUsers' },
            ],
            rows: [
              {
                metricValues: [{ value: '250' }, { value: '80' }],
              },
            ],
          },
          {
            dimensionHeaders: [{ name: 'pagePath' }],
            metricHeaders: [{ name: 'screenPageViews' }],
            rows: [],
          },
        ],
      },
    ]);
    mockGetAnalyticsClient.mockReturnValue({
      batchRunReports: mockBatchRunReports,
    } as never);

    const result = await fetchPageviews({
      propertyId: '123',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      path: '/about',
    });

    expect(mockBatchRunReports).toHaveBeenCalledWith({
      property: 'properties/123',
      requests: [
        {
          property: 'properties/123',
          dateRanges: [{ startDate: '2026-01-01', endDate: '2026-01-31' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        },
        {
          property: 'properties/123',
          dateRanges: [{ startDate: '2026-01-01', endDate: '2026-01-31' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: { value: '/about', matchType: 'EXACT' },
            },
          },
        },
      ],
    });
    expect(result).toEqual({
      site: {
        pageviews: 250,
        activeUsers: 80,
      },
      page: {
        path: '/about',
        pageviews: 0,
      },
    });
  });
});

describe('fetchPopularPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests month and all-time popular posts using fake GA4 reports', async () => {
    const mockBatchRunReports = vi.fn().mockResolvedValue([
      {
        reports: [
          {
            dimensionHeaders: [{ name: 'pagePath' }],
            metricHeaders: [{ name: 'screenPageViews' }],
            rows: [
              {
                dimensionValues: [{ value: '/a' }],
                metricValues: [{ value: '10' }],
              },
            ],
          },
          {
            dimensionHeaders: [{ name: 'pagePath' }],
            metricHeaders: [{ name: 'screenPageViews' }],
            rows: [
              {
                dimensionValues: [{ value: '/a' }],
                metricValues: [{ value: '100' }],
              },
            ],
          },
        ],
      },
    ]);
    mockGetAnalyticsClient.mockReturnValue({
      batchRunReports: mockBatchRunReports,
    } as never);

    const result = await fetchPopularPosts({
      propertyId: '123',
      startDate: '2020-01-01',
      endDate: '2026-01-01',
      pagePathRegex: '^/posts/',
    });

    expect(mockBatchRunReports).toHaveBeenCalledWith({
      property: 'properties/123',
      requests: [
        {
          property: 'properties/123',
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: {
                matchType: 'PARTIAL_REGEXP',
                value: '^/posts/',
              },
            },
          },
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        },
        {
          property: 'properties/123',
          dateRanges: [{ startDate: '2020-01-01', endDate: '2026-01-01' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: {
                matchType: 'PARTIAL_REGEXP',
                value: '^/posts/',
              },
            },
          },
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        },
      ],
    });
    expect(result).toEqual({
      month: [{ path: '/a', pageviews: 10 }],
      allTime: [{ path: '/a', pageviews: 100 }],
    });
  });
});
