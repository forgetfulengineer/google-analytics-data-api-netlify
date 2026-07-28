import { describe, expect, it } from 'vitest';
import { errorResponse, jsonResponse, successResponse } from './response.js';

describe('Response Utility Helpers', () => {
  it('should create a standard jsonResponse', async () => {
    const res = jsonResponse(201, { status: 'created' }, 'https://example.com');
    expect(res.status).toBe(201);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com',
    );
    const body = await res.json();
    expect(body).toEqual({ status: 'created' });
  });

  it('should format successResponse in standard success envelope', async () => {
    const data = { site: { pageviews: 100 } };
    const meta = { timestamp: 12345 };
    const res = successResponse(
      data,
      'Successfully queried pageviews',
      meta,
      'https://example.com',
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com',
    );
    const body = await res.json();
    expect(body).toEqual({
      code: 'SUCCESS',
      message: 'Successfully queried pageviews',
      data,
      meta,
    });
  });

  it('should omit meta in successResponse if not provided', async () => {
    const data = { site: { pageviews: 100 } };
    const res = successResponse(data);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      code: 'SUCCESS',
      message: 'Query successful',
      data,
    });
  });

  it('should format errorResponse in standard error envelope', async () => {
    const errors = [{ field: 'path', reason: 'Invalid path' }];
    const res = errorResponse(
      400,
      'VALIDATION_ERROR',
      'Validation failed',
      errors,
      'https://example.com',
    );
    expect(res.status).toBe(400);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com',
    );
    const body = await res.json();
    expect(body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      data: null,
      errors,
    });
  });

  it('should omit errors in errorResponse if not provided', async () => {
    const res = errorResponse(503, 'UPSTREAM_ERROR', 'Service Unavailable');
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({
      code: 'UPSTREAM_ERROR',
      message: 'Service Unavailable',
      data: null,
    });
  });
});
