import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEnv, mockGetPopularPosts } = vi.hoisted(() => ({
  mockEnv: {
    PROPERTYID: '123456',
    GOOGLE_APPLICATION_CREDENTIALS_JSON: JSON.stringify({ project_id: 'test' }),
    STARTDATE: '2026-01-01',
    ENDDATE: '2026-01-31',
    PAGEPATH_REGEX: '^/',
  } as {
    PROPERTYID: string;
    GOOGLE_APPLICATION_CREDENTIALS_JSON: string;
    STARTDATE: string;
    ENDDATE: string;
    PAGEPATH_REGEX?: string;
  },
  mockGetPopularPosts: vi.fn(),
}));

vi.mock('../../src/lib/env.js', () => ({
  env: mockEnv,
}));

vi.mock('../../src/use-cases/getPopularPosts.js', () => ({
  makeGetPopularPosts: vi.fn(() => mockGetPopularPosts),
}));

import popularPostsHandler from '../../functions/popular-posts.js';

describe('popular-posts handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockEnv.PROPERTYID = '123456';
    mockEnv.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify({
      project_id: 'test',
    });
    mockEnv.STARTDATE = '2026-01-01';
    mockEnv.ENDDATE = '2026-01-31';
    mockEnv.PAGEPATH_REGEX = '^/';
  });

  it('returns a standard success response envelope with popular posts data', async () => {
    const mockData = {
      month: [{ path: '/a', pageviews: 10 }],
      allTime: [{ path: '/b', pageviews: 100 }],
    };
    mockGetPopularPosts.mockResolvedValue(mockData);

    const req = new Request('https://example.com/api/popular-posts');
    const res = await popularPostsHandler(req, {});

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      code: 'SUCCESS',
      message: 'Query successful',
      data: mockData,
    });
    expect(mockGetPopularPosts).toHaveBeenCalledWith({
      propertyId: '123456',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      pagePathRegex: '^/',
    });
  });

  it('returns popular-posts cache headers without Netlify-Vary', async () => {
    mockGetPopularPosts.mockResolvedValue({
      month: [{ path: '/a', pageviews: 10 }],
      allTime: [{ path: '/b', pageviews: 100 }],
    });

    const req = new Request('https://example.com/api/popular-posts');
    const res = await popularPostsHandler(req, {});

    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=0, must-revalidate',
    );
    expect(res.headers.get('Netlify-CDN-Cache-Control')).toBe(
      'public, durable, s-maxage=21600, stale-while-revalidate=21600',
    );
    expect(res.headers.has('Netlify-Vary')).toBe(false);
  });

  it('uses the default PAGEPATH_REGEX when env does not provide one', async () => {
    delete mockEnv.PAGEPATH_REGEX;
    mockGetPopularPosts.mockResolvedValue({
      month: [],
      allTime: [],
    });

    const req = new Request('https://example.com/api/popular-posts');
    const res = await popularPostsHandler(req, {});

    expect(res.status).toBe(200);
    expect(mockGetPopularPosts).toHaveBeenCalledWith({
      propertyId: '123456',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      pagePathRegex: '^/',
    });
  });
});
