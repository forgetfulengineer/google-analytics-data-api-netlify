import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

const mockGetEnv = vi.fn(() => ({
  PROPERTYID: '123456',
  GOOGLE_APPLICATION_CREDENTIALS_JSON: JSON.stringify({ project_id: 'test' }),
  STARTDATE: '2026-01-01',
  ENDDATE: '2026-01-31',
}));

vi.mock('../../src/lib/env.js', () => ({
  getEnv: () => mockGetEnv(),
}));

import handler from '../../functions/pageviews.js';
import { UpstreamError, ValidationError } from '../../src/errors/AppError.js';

// Mock the getPageviews Use Case module
const mockGetPageviewsFn = vi.fn();
vi.mock('../../src/use-cases/getPageviews.js', () => {
  return {
    makeGetPageviews: () => mockGetPageviewsFn,
  };
});

describe('Pageviews Handler', () => {
  // Set required env variables
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnv.mockReset();
    mockGetEnv.mockImplementation(() => ({
      PROPERTYID: '123456',
      GOOGLE_APPLICATION_CREDENTIALS_JSON: JSON.stringify({
        project_id: 'test',
      }),
      STARTDATE: '2026-01-01',
      ENDDATE: '2026-01-31',
    }));
    process.env.ENABLE_PAGEVIEW = 'true';
    process.env.PROPERTYID = '123456';
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify({
      project_id: 'test',
    });
    process.env.STARTDATE = '2026-01-01';
    process.env.ENDDATE = '2026-01-31';
  });

  it('should return 200 with site metrics when path is omitted', async () => {
    // GIVEN
    const mockData = {
      site: { pageviews: 1500, activeUsers: 700 },
    };
    mockGetPageviewsFn.mockResolvedValue(mockData);

    const req = new Request('http://localhost/api/pageviews');

    // WHEN
    const res = await handler(req, {} as any);

    // THEN
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      code: 'SUCCESS',
      message: 'Query successful',
      data: mockData,
    });
    expect(mockGetPageviewsFn).toHaveBeenCalledWith({
      propertyId: '123456',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      path: undefined,
    });
  });

  it('should return 200 with both site and page metrics when path is provided', async () => {
    // GIVEN
    const mockData = {
      site: { pageviews: 1500, activeUsers: 700 },
      page: { path: '/about', pageviews: 120 },
    };
    mockGetPageviewsFn.mockResolvedValue(mockData);

    const req = new Request('http://localhost/api/pageviews?path=/about');

    // WHEN
    const res = await handler(req, {} as any);

    // THEN
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      code: 'SUCCESS',
      message: 'Query successful',
      data: mockData,
    });
    expect(mockGetPageviewsFn).toHaveBeenCalledWith({
      propertyId: '123456',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      path: '/about',
    });
  });

  it('should return 400 when validation fails (e.g. invalid query)', async () => {
    mockGetPageviewsFn.mockRejectedValue(
      new ValidationError([{ field: 'path', reason: 'Invalid string' }]),
    );
    const req = new Request('http://localhost/api/pageviews?path=123');

    // WHEN
    const res = await handler(req, {} as any);

    // THEN
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      data: null,
      errors: [{ field: 'path', reason: 'Invalid string' }],
    });
  });

  it('should return 503 when Use Case throws UpstreamError', async () => {
    // GIVEN
    mockGetPageviewsFn.mockRejectedValue(new UpstreamError('GA4 unavailable'));
    const req = new Request('http://localhost/api/pageviews');

    // WHEN
    const res = await handler(req, {} as any);

    // THEN
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({
      code: 'UPSTREAM_ERROR',
      message: 'GA4 unavailable',
      data: null,
    });
  });

  it('should return 500 JSON without leaking details and log missing env vars when environment variables are missing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const zodError = new ZodError([
      {
        code: 'custom',
        path: ['PROPERTYID'],
        message: 'PROPERTYID is required',
      },
    ]);
    mockGetEnv.mockImplementationOnce(() => {
      throw zodError;
    });

    const req = new Request('http://localhost/api/pageviews');
    const res = await handler(req, {} as any);

    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error',
      data: null,
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[Config Error] Missing or invalid environment variable(s): PROPERTYID',
      ),
    );
    consoleSpy.mockRestore();
  });
});
