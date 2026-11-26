import { afterEach, describe, expect, it, vi } from 'vitest';

import { config as pageviewsConfig } from '../../functions/pageviews.js';
import { config as popularPostsConfig } from '../../functions/popular-posts.js';

describe('Function V2 config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // spectra-scenario: test-suite-alignment / Running tests against Netlify platform APIs
  // spectra-scenario: test-suite-alignment / Running tests against Netlify platform APIs / Default mock environment variables
  it('provisions isolated default Netlify.env values and supports vi.stubEnv overrides', () => {
    expect(Netlify.env.get('PROPERTYID')).toBe('123456');

    vi.stubEnv('PROPERTYID', 'custom-id');
    expect(Netlify.env.get('PROPERTYID')).toBe('custom-id');
  });

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
