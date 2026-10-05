import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('src/lib/env', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('evaluates configuration successfully when all required environment variables are present and valid', async () => {
    vi.stubEnv('PROPERTYID', '123456');
    vi.stubEnv(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
      JSON.stringify({ client_email: 'test@example.com' }),
    );
    vi.stubEnv('STARTDATE', '2024-01-01');
    vi.stubEnv('ENDDATE', '2024-01-31');
    vi.stubEnv('PAGEPATH_REGEX', '^/blog');
    vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com');

    const { env } = await import('./env.js');
    expect(env.PROPERTYID).toBe('123456');
    expect(env.STARTDATE).toBe('2024-01-01');
    expect(env.ENDDATE).toBe('2024-01-31');
    expect(env.PAGEPATH_REGEX).toBe('^/blog');
    expect(env.ALLOWED_ORIGINS).toBe('https://example.com');
  });

  it('throws ZodError when a required environment variable is missing (e.g. PROPERTYID)', async () => {
    vi.stubEnv('PROPERTYID', '');
    vi.stubEnv(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
      JSON.stringify({ client_email: 'test@example.com' }),
    );
    vi.stubEnv('STARTDATE', '2024-01-01');
    vi.stubEnv('ENDDATE', '2024-01-31');

    await expect(import('./env.js')).rejects.toThrow();
  });
});
