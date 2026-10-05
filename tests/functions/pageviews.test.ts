import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/env.js', () => ({
  env: {
    PROPERTYID: '123456',
    GOOGLE_APPLICATION_CREDENTIALS_JSON: JSON.stringify({ project_id: 'test' }),
    STARTDATE: '2026-01-01',
    ENDDATE: '2026-01-31',
  },
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
    // GIVEN
    // Let's pass an invalid query parameter structure if any, or trigger schema validation error.
    // Zod PageviewsQuerySchema parses { path: string | undefined }.
    // If we mock PageviewsQuerySchema parse, or if we trigger it (though path is optional and accepts any string,
    // if we pass something that Zod schema would reject if we configure it to reject or if we manually test Validation error).
    // Let's mock a ValidationError being thrown in handler to test apiWrapper handling of ValidationErrors.
    // Or let's trigger it by modifying query parameters if we can. Since path: z.string().optional() is very loose,
    // we can pass multiple query params or test how it handles Zod schema.
    // Wait, let's write a test where we explicitly throw ValidationError in Use Case to verify 400.
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
});
