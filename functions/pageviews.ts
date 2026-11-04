import type { Config } from '@netlify/functions';
import { ValidationError } from '../src/errors/AppError.js';
import { fetchPageviews } from '../src/repositories/analyticsRepository.js';
import { env } from '../src/schemas/envSchema.js';
import { PageviewsQuerySchema } from '../src/schemas/pageviews.schema.js';
import { makeGetPageviews } from '../src/use-cases/getPageviews.js';
import { apiWrapper } from '../utils/apiWrapper.js';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Netlify-CDN-Cache-Control':
    'public, durable, s-maxage=21600, stale-while-revalidate=21600',
  'Netlify-Vary': 'query=path',
};

export default async (req: Request, context: any) => {
  return apiWrapper(req, context, {
    enableFlag: 'ENABLE_PAGEVIEW',
    extraHeaders: CACHE_HEADERS,
    handlerFn: async (req: Request) => {
      const propertyId = env.PROPERTYID;
      const startDate = env.STARTDATE;
      const endDate = env.ENDDATE;

      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};
      const pathParam = url.searchParams.get('path');
      if (pathParam !== null) {
        queryParams.path = pathParam;
      }

      const parsed = PageviewsQuerySchema.safeParse(queryParams);
      if (!parsed.success) {
        const errors = parsed.error.issues.map((err) => ({
          field: String(err.path[0] || 'query'),
          reason: err.message,
        }));
        throw new ValidationError(errors);
      }

      const { path } = parsed.data;

      const getPageviews = makeGetPageviews({ fetchPageviews });

      return getPageviews({
        propertyId,
        startDate,
        endDate,
        path,
      });
    },
  });
};

export const config: Config = {
  path: '/api/pageviews',
  method: ['GET', 'OPTIONS'],
  rateLimit: {
    windowLimit: 100,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
