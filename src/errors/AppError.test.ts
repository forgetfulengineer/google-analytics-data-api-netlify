import { describe, expect, it } from 'vitest';
import {
  AppError,
  NotFoundError,
  UpstreamError,
  ValidationError,
} from './AppError.js';

describe('AppError Core Classes', () => {
  it('should have a default error code of INTERNAL_SERVER_ERROR for base AppError', () => {
    const error = new AppError('Base error message');
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.statusCode).toBe(500);
  });

  it('should have correct code and statusCode for NotFoundError', () => {
    const error = new NotFoundError('Resource not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('should have correct code and statusCode for UpstreamError', () => {
    const error = new UpstreamError('GA4 failed');
    expect(error.code).toBe('UPSTREAM_ERROR');
    expect(error.statusCode).toBe(503);
  });

  it('should have correct code, statusCode, and flattened errors array for ValidationError', () => {
    const errors = [
      { field: 'path', reason: 'Path must be a valid string' },
      { field: 'type', reason: 'Type is required' },
    ];
    const error = new ValidationError(errors);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect((error as any).details).toBeUndefined();
    expect(error.errors).toEqual(errors);
  });
});
