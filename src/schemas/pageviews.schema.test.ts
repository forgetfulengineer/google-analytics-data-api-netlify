import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from './envSchema.js';

const defaultMockEnv: Env = {
  PROPERTYID: 'test',
  GOOGLE_APPLICATION_CREDENTIALS_JSON: '{}',
  STARTDATE: '2026-01-01',
  ENDDATE: '2026-01-31',
  PAGEPATH_REGEX: undefined,
  ALLOWED_ORIGINS: undefined,
};

const mockGetEnv = vi.fn(() => ({ ...defaultMockEnv }));

vi.mock('../lib/env.js', () => ({
  getEnv: () => mockGetEnv(),
}));

import { PageviewsQuerySchema } from './pageviews.schema.js';

describe('PageviewsQuerySchema', () => {
  beforeEach(() => {
    mockGetEnv.mockReset();
    mockGetEnv.mockImplementation(() => ({ ...defaultMockEnv }));
  });

  // spectra-scenario: pageviews-api-architecture / Valid optional path
  it('should pass when path is a valid string', () => {
    const result = PageviewsQuerySchema.safeParse({ path: '/about' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.path).toBe('/about');
    }
  });

  // spectra-scenario: pageviews-api-architecture / Omitted path query
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

  // spectra-scenario: pageviews-api-architecture / Path failing default pattern when PAGEPATH_REGEX is unset
  it('should reject path not starting with slash when PAGEPATH_REGEX is unset', () => {
    const resultWithoutSlash = PageviewsQuerySchema.safeParse({
      path: 'about',
    });
    expect(resultWithoutSlash.success).toBe(false);
    if (!resultWithoutSlash.success) {
      expect(resultWithoutSlash.error.issues[0]?.message).toBe(
        'path does not match required pattern',
      );
    }

    const resultJavascript = PageviewsQuerySchema.safeParse({
      path: 'javascript:alert(1)',
    });
    expect(resultJavascript.success).toBe(false);
    if (!resultJavascript.success) {
      expect(resultJavascript.error.issues[0]?.message).toBe(
        'path does not match required pattern',
      );
    }
  });

  // spectra-scenario: pageviews-api-architecture / Path failing PAGEPATH_REGEX pattern
  it('should validate against custom PAGEPATH_REGEX when configured', () => {
    mockGetEnv.mockImplementationOnce(() => ({
      ...defaultMockEnv,
      PAGEPATH_REGEX: '^/posts/',
    }));

    const validResult = PageviewsQuerySchema.safeParse({
      path: '/posts/my-post',
    });
    expect(validResult.success).toBe(true);

    mockGetEnv.mockImplementationOnce(() => ({
      ...defaultMockEnv,
      PAGEPATH_REGEX: '^/posts/',
    }));

    const invalidResult = PageviewsQuerySchema.safeParse({ path: '/about' });
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues[0]?.message).toBe(
        'path does not match required pattern',
      );
    }
  });
});
