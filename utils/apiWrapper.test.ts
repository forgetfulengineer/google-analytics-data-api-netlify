import { afterEach, describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../src/errors/AppError.js';

vi.mock('../src/lib/env.js', () => ({
  get env() {
    return {
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    };
  },
}));

import { apiWrapper } from './apiWrapper.js';

describe('apiWrapper', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns cached CORS preflight response without executing handler logic', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com');
    const handlerFn = vi.fn();
    const req = new Request('https://api.example.com/api/pageviews', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
      },
    });

    const res = await apiWrapper(
      req,
      {},
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
      },
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com',
    );
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET, OPTIONS',
    );
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
    expect(handlerFn).not.toHaveBeenCalled();
  });

  it('returns a unified 405 error for unsupported methods without executing handler logic', async () => {
    const handlerFn = vi.fn();
    const req = new Request('https://api.example.com/api/pageviews', {
      method: 'POST',
    });

    const res = await apiWrapper(
      req,
      {},
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
      },
    );

    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed.',
      data: null,
    });
    expect(handlerFn).not.toHaveBeenCalled();
  });

  it('returns a unified 403 error for disallowed CORS origins without executing handler logic', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com');
    const handlerFn = vi.fn();
    const req = new Request('https://api.example.com/api/pageviews', {
      headers: {
        Origin: 'https://evil.example',
      },
    });

    const res = await apiWrapper(
      req,
      {},
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
      },
    );

    expect(res.status).toBe(403);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('');
    expect(await res.json()).toEqual({
      code: 'CORS_FORBIDDEN',
      message: 'Forbidden: origin not allowed.',
      data: null,
    });
    expect(handlerFn).not.toHaveBeenCalled();
  });

  it('returns a unified 404 error when the feature flag is disabled without executing handler logic', async () => {
    vi.stubEnv('ENABLE_PAGEVIEW', 'false');
    const handlerFn = vi.fn();
    const req = new Request('https://api.example.com/api/pageviews');

    const res = await apiWrapper(
      req,
      {},
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
      },
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      code: 'NOT_FOUND',
      message: 'Not Found.',
      data: null,
    });
    expect(handlerFn).not.toHaveBeenCalled();
  });

  it('unwraps handler data, meta, and message into the standard success envelope', async () => {
    const handlerFn = vi.fn().mockResolvedValue({
      data: {
        site: {
          pageviews: 100,
        },
      },
      meta: {
        cached: false,
      },
      message: 'Custom success',
    });
    const req = new Request('https://api.example.com/api/pageviews');

    const res = await apiWrapper(
      req,
      { requestId: 'ctx' },
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
      },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      code: 'SUCCESS',
      message: 'Custom success',
      data: {
        site: {
          pageviews: 100,
        },
      },
      meta: {
        cached: false,
      },
    });
    expect(handlerFn).toHaveBeenCalledWith(req, { requestId: 'ctx' });
  });

  it('returns known application errors in the standard error envelope', async () => {
    const handlerFn = vi
      .fn()
      .mockRejectedValue(
        new ValidationError([{ field: 'path', reason: 'Invalid path' }]),
      );
    const req = new Request('https://api.example.com/api/pageviews');

    const res = await apiWrapper(
      req,
      {},
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
      },
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      data: null,
      errors: [{ field: 'path', reason: 'Invalid path' }],
    });
  });

  it('returns unknown errors as internal server errors', async () => {
    const handlerFn = vi
      .fn()
      .mockRejectedValue(new Error('Unexpected failure'));
    const req = new Request('https://api.example.com/api/pageviews');

    const res = await apiWrapper(
      req,
      {},
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
      },
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error',
      data: null,
    });
  });

  it('appends extra headers to success responses', async () => {
    const handlerFn = vi.fn().mockResolvedValue({ ok: true });
    const req = new Request('https://api.example.com/api/pageviews');

    const res = await apiWrapper(
      req,
      {},
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
        extraHeaders: {
          'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=21600',
        },
      },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Netlify-CDN-Cache-Control')).toBe(
      'public, durable, s-maxage=21600',
    );
  });

  it('appends extra headers to handler-generated error responses', async () => {
    const handlerFn = vi
      .fn()
      .mockRejectedValue(new Error('Unexpected failure'));
    const req = new Request('https://api.example.com/api/pageviews');

    const res = await apiWrapper(
      req,
      {},
      {
        enableFlag: 'ENABLE_PAGEVIEW',
        handlerFn,
        extraHeaders: {
          'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=21600',
        },
      },
    );

    expect(res.status).toBe(500);
    expect(res.headers.get('Netlify-CDN-Cache-Control')).toBe(
      'public, durable, s-maxage=21600',
    );
  });
});
