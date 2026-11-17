import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpstreamError } from '../errors/AppError.js';
import { makeGetPageviews } from './getPageviews.js';

// Mock Netlify Blobs
const mockStore = {
  setJSON: vi.fn(),
  get: vi.fn(),
};

vi.mock('@netlify/blobs', () => {
  return {
    getStore: () => mockStore,
  };
});

describe('getPageviews Use Case', () => {
  const mockRepository = {
    fetchPageviews: vi.fn(),
  };

  const getPageviews = makeGetPageviews(mockRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return fresh data and write to cache on successful fetch', async () => {
    // GIVEN
    const mockData = {
      site: { pageviews: 1500, activeUsers: 700 },
      page: { path: '/about', pageviews: 120 },
    };
    mockRepository.fetchPageviews.mockResolvedValue(mockData);
    mockStore.setJSON.mockResolvedValue(undefined);

    const params = {
      propertyId: '123456',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      path: '/about',
    };

    // WHEN
    const result = await getPageviews(params);

    // THEN
    expect(result).toEqual(mockData);
    expect(mockRepository.fetchPageviews).toHaveBeenCalledWith(params);
    expect(mockStore.setJSON).toHaveBeenCalledWith(
      'pageview:/about:start=2026-01-01:end=2026-01-31',
      expect.objectContaining({
        data: mockData,
        timestamp: expect.any(Number),
      }),
    );
  });

  it('should fallback to cached data when fetch fails and cache exists', async () => {
    // GIVEN
    mockRepository.fetchPageviews.mockRejectedValue(
      new Error('GA4 connection timed out'),
    );
    const mockCachedData = {
      site: { pageviews: 1000, activeUsers: 400 },
      page: { path: '/about', pageviews: 80 },
    };
    mockStore.get.mockResolvedValue({
      timestamp: Date.now() - 3600 * 1000,
      data: mockCachedData,
    });

    const params = {
      propertyId: '123456',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      path: '/about',
    };

    // WHEN
    const result = await getPageviews(params);

    // THEN
    expect(result).toEqual(mockCachedData);
    expect(mockStore.get).toHaveBeenCalledWith(
      'pageview:/about:start=2026-01-01:end=2026-01-31',
      { type: 'json' },
    );
  });

  it('should throw UpstreamError when fetch fails and no cache exists', async () => {
    // GIVEN
    mockRepository.fetchPageviews.mockRejectedValue(
      new Error('GA4 credentials invalid'),
    );
    mockStore.get.mockResolvedValue(null);

    const params = {
      propertyId: '123456',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      path: '/about',
    };

    // WHEN & THEN
    await expect(getPageviews(params)).rejects.toThrow(UpstreamError);
  });
});
