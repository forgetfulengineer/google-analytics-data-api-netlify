import { describe, expect, it } from 'vitest';
import { checkOrigin } from './cors.js';

describe('checkOrigin', () => {
  it('rejects spoofed localhost domains', () => {
    expect(
      checkOrigin('https://hacker-localhost.com', ['http://localhost:3000']),
    ).toBe(false);
  });

  it('allows valid localhost origins for local development', () => {
    expect(checkOrigin('http://localhost:3000', ['https://example.com'])).toBe(
      true,
    );
  });

  it('allows exact origin matches', () => {
    expect(checkOrigin('https://example.com', ['https://example.com'])).toBe(
      true,
    );
  });
});
