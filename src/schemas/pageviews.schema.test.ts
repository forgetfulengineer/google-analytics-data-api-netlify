import { describe, expect, it } from 'vitest';
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
