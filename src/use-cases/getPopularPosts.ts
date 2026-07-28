import { getStore } from '@netlify/blobs';
import { UpstreamError } from '../errors/AppError.js';
import type {
  PopularPostsParams,
  PopularPostsResponse,
} from '../repositories/analyticsRepository.js';

export function makeGetPopularPosts(repository: {
  fetchPopularPosts(params: PopularPostsParams): Promise<PopularPostsResponse>;
}) {
  return async function getPopularPosts(
    params: PopularPostsParams,
  ): Promise<PopularPostsResponse> {
    const { startDate, endDate, pagePathRegex } = params;
    const cacheKey = `popular:regex=${pagePathRegex}:start=${startDate}:end=${endDate}`;
    const store = getStore('analytics-storage');

    try {
      const data = await repository.fetchPopularPosts(params);

      try {
        await store.setJSON(cacheKey, {
          timestamp: Date.now() / 1000,
          data,
        });
      } catch (cacheErr) {
        console.error('Failed to write to Netlify Blobs cache:', cacheErr);
      }

      return data;
    } catch (error) {
      console.error('GA4 API Error in Use Case:', error);

      try {
        const backup = (await store.get(cacheKey, { type: 'json' })) as {
          data: PopularPostsResponse;
        } | null;
        if (backup?.data) {
          console.warn(
            'Returning fallback data from Netlify Blobs for key:',
            cacheKey,
          );
          return backup.data;
        }
      } catch (backupErr) {
        console.error(
          'Failed to retrieve fallback data from Netlify Blobs:',
          backupErr,
        );
      }

      throw new UpstreamError(
        'GA4 service is currently unavailable and no cached backup was found.',
      );
    }
  };
}
