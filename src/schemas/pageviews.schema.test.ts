import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/env.js', () => ({
  getEnv: () => ({
    PROPERTYID: 'test',
    GOOGLE_APPLICATION_CREDENTIALS_JSON: '{}',
    STARTDATE: '2026-01-01',
    ENDDATE: '2026-01-31',
    PAGEPATH_REGEX: undefined,
    ALLOWED_ORIGINS: undefined,
  }),
}));

import { PageviewsQuerySchema } from './pageviews.schema.js';

describe('PageviewsQuerySchema', () => {
  it('should pass when path is a valid string', () => {
    const result = PageviewsQuerySchema.safeParse({ path: '/about' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.path).toBe('/about');
    }
  });

  it('should pass when path is omitted', () => {
    const result = PageviewsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.path).toBeUndefined();
    }
  });

  it('should reject a non-string path at the schema contract level', () => {
    const result = PageviewsQuerySchema.safeParse({ path: 123 });
    expect(result.success).toBe(false);
  });
});
