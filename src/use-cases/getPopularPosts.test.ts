import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpstreamError } from '../errors/AppError.js';
import { makeGetPopularPosts } from './getPopularPosts.js';

const mockStore = {
  setJSON: vi.fn(),
  get: vi.fn(),
};

vi.mock('@netlify/blobs', () => {
  return {
    getStore: () => mockStore,
  };
});

describe('getPopularPosts Use Case', () => {
  const mockRepository = {
    fetchPopularPosts: vi.fn(),
  };

  const getPopularPosts = makeGetPopularPosts(mockRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return fresh data and write to cache on successful fetch', async () => {
    const mockData = {
      month: [{ path: '/a', pageviews: 100 }],
      allTime: [{ path: '/a', pageviews: 500 }],
    };
    mockRepository.fetchPopularPosts.mockResolvedValue(mockData);
    mockStore.setJSON.mockResolvedValue(undefined);

    const params = {
      propertyId: '123',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      pagePathRegex: '^/',
    };

    const result = await getPopularPosts(params);

    expect(result).toEqual(mockData);
    expect(mockRepository.fetchPopularPosts).toHaveBeenCalledWith(params);
    expect(mockStore.setJSON).toHaveBeenCalledWith(
      'popular:regex=^/:start=2026-01-01:end=2026-01-31',
      expect.objectContaining({
        data: mockData,
        timestamp: expect.any(Number),
      }),
    );
  });

  it('should fallback to cached data when fetch fails and cache exists', async () => {
    mockRepository.fetchPopularPosts.mockRejectedValue(new Error('GA4 failed'));
    const mockCachedData = {
      month: [{ path: '/a', pageviews: 90 }],
      allTime: [{ path: '/a', pageviews: 450 }],
    };
    mockStore.get.mockResolvedValue({
      timestamp: Date.now() - 3600 * 1000,
      data: mockCachedData,
    });

    const params = {
      propertyId: '123',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      pagePathRegex: '^/',
    };

    const result = await getPopularPosts(params);

    expect(result).toEqual(mockCachedData);
    expect(mockStore.get).toHaveBeenCalledWith(
      'popular:regex=^/:start=2026-01-01:end=2026-01-31',
      { type: 'json' },
    );
  });

  it('should throw UpstreamError when fetch fails and no cache exists', async () => {
    mockRepository.fetchPopularPosts.mockRejectedValue(new Error('GA4 failed'));
    mockStore.get.mockResolvedValue(null);

    const params = {
      propertyId: '123',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      pagePathRegex: '^/',
    };

    await expect(getPopularPosts(params)).rejects.toThrow(UpstreamError);
  });
});
