import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEnv, resetEnv } from './env.js';

describe('src/lib/env', () => {
  beforeEach(() => {
    resetEnv();
  });

  afterEach(() => {
    resetEnv();
    vi.unstubAllEnvs();
  });

  it('allows module import without throwing when required environment variables are missing', async () => {
    vi.stubEnv('PROPERTYID', '');
    const module = await import('./env.js');
    expect(module.getEnv).toBeDefined();
    expect(module.resetEnv).toBeDefined();
  });

  it('evaluates configuration successfully when all required environment variables are present and valid', () => {
    vi.stubEnv('PROPERTYID', '123456');
    vi.stubEnv(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
      JSON.stringify({ client_email: 'test@example.com' }),
    );
    vi.stubEnv('STARTDATE', '2024-01-01');
    vi.stubEnv('ENDDATE', '2024-01-31');
    vi.stubEnv('PAGEPATH_REGEX', '^/blog');
    vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com');

    const env = getEnv();
    expect(env.PROPERTYID).toBe('123456');
    expect(env.STARTDATE).toBe('2024-01-01');
    expect(env.ENDDATE).toBe('2024-01-31');
    expect(env.PAGEPATH_REGEX).toBe('^/blog');
    expect(env.ALLOWED_ORIGINS).toBe('https://example.com');
  });

  it('caches the parsed configuration across multiple getEnv() calls', () => {
    vi.stubEnv('PROPERTYID', '123456');
    vi.stubEnv(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
      JSON.stringify({ client_email: 'test@example.com' }),
    );
    vi.stubEnv('STARTDATE', '2024-01-01');
    vi.stubEnv('ENDDATE', '2024-01-31');

    const env1 = getEnv();
    // Alter environment variable after first evaluation
    vi.stubEnv('PROPERTYID', '999999');
    const env2 = getEnv();

    expect(env1).toBe(env2);
    expect(env2.PROPERTYID).toBe('123456');
  });

  it('re-evaluates environment variables after resetEnv() is called', () => {
    vi.stubEnv('PROPERTYID', '123456');
    vi.stubEnv(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
      JSON.stringify({ client_email: 'test@example.com' }),
    );
    vi.stubEnv('STARTDATE', '2024-01-01');
    vi.stubEnv('ENDDATE', '2024-01-31');

    const env1 = getEnv();
    expect(env1.PROPERTYID).toBe('123456');

    resetEnv();
    vi.stubEnv('PROPERTYID', '789012');
    const env2 = getEnv();
    expect(env2.PROPERTYID).toBe('789012');
  });

  it('throws ZodError when a required environment variable is missing (e.g. PROPERTYID)', () => {
    vi.stubEnv('PROPERTYID', '');
    vi.stubEnv(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
      JSON.stringify({ client_email: 'test@example.com' }),
    );
    vi.stubEnv('STARTDATE', '2024-01-01');
    vi.stubEnv('ENDDATE', '2024-01-31');

    expect(() => getEnv()).toThrow();
  });
});
