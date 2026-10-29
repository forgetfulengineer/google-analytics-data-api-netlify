import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/env.js', () => ({
  getEnv: () => ({
    PROPERTYID: '123456',
    GOOGLE_APPLICATION_CREDENTIALS_JSON: JSON.stringify({ project_id: 'test' }),
    STARTDATE: '2026-01-01',
    ENDDATE: '2026-01-31',
  }),
}));

import { config as pageviewsConfig } from '../../functions/pageviews.js';
import { config as popularPostsConfig } from '../../functions/popular-posts.js';

describe('Function V2 config', () => {
  it('routes pageviews through its API path with method and rate restrictions', () => {
    expect(pageviewsConfig).toEqual({
      path: '/api/pageviews',
      method: ['GET', 'OPTIONS'],
      rateLimit: {
        windowLimit: 100,
        windowSize: 60,
        aggregateBy: ['ip', 'domain'],
      },
    });
  });

  it('routes popular posts through its API path with method and rate restrictions', () => {
    expect(popularPostsConfig).toEqual({
      path: '/api/popular-posts',
      method: ['GET', 'OPTIONS'],
      rateLimit: {
        windowLimit: 100,
        windowSize: 60,
        aggregateBy: ['ip', 'domain'],
      },
    });
  });
});
