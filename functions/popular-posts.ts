import type { Config } from '@netlify/functions';
import { env } from '../src/lib/env.js';
import { fetchPopularPosts } from '../src/repositories/analyticsRepository.js';
import { makeGetPopularPosts } from '../src/use-cases/getPopularPosts.js';
import { apiWrapper } from '../utils/apiWrapper.js';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Netlify-CDN-Cache-Control':
    'public, durable, s-maxage=21600, stale-while-revalidate=21600',
};

export default async (req: Request, context: any) => {
  return apiWrapper(req, context, {
    enableFlag: 'ENABLE_POPULAR',
    extraHeaders: CACHE_HEADERS,
    handlerFn: async () => {
      const propertyId = env.PROPERTYID;
      const startDate = env.STARTDATE;
      const endDate = env.ENDDATE;
      const pagePathRegex = env.PAGEPATH_REGEX || '^/';

      const getPopularPosts = makeGetPopularPosts({ fetchPopularPosts });

      const data = await getPopularPosts({
        propertyId,
        startDate,
        endDate,
        pagePathRegex,
      });

      return data;
    },
  });
};

export const config: Config = {
  path: '/api/popular-posts',
  method: ['GET', 'OPTIONS'],
  rateLimit: {
    windowLimit: 100,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
