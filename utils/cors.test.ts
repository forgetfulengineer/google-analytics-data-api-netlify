import { describe, expect, it } from 'vitest';
import { checkOrigin } from './cors.js';

describe('checkOrigin', () => {
  // spectra-scenario: api-architecture-foundation / Blocking spoofed localhost domains
  it('rejects spoofed localhost domains', () => {
    expect(
      checkOrigin('https://hacker-localhost.com', ['http://localhost:3000']),
    ).toBe(false);
  });

  // spectra-scenario: api-architecture-foundation / Allowing valid localhost domains
  it('allows valid localhost origins for local development', () => {
    expect(checkOrigin('http://localhost:3000', ['https://example.com'])).toBe(
      true,
    );
    expect(checkOrigin('https://localhost:8443', ['https://example.com'])).toBe(
      true,
    );
    expect(checkOrigin('https://localhost', ['https://example.com'])).toBe(
      true,
    );
  });

  // spectra-scenario: api-architecture-foundation / Allowing wildcard origin configuration
  it('allows any origin when allowedOrigins contains wildcard', () => {
    expect(checkOrigin('https://myblog.com', ['*'])).toBe(true);
    expect(
      checkOrigin('https://another-domain.org', ['https://example.com', '*']),
    ).toBe(true);
  });

  it('allows exact origin matches', () => {
    expect(checkOrigin('https://example.com', ['https://example.com'])).toBe(
      true,
    );
  });

  // spectra-scenario: api-architecture-foundation / Allowing direct requests without Origin header
  // spectra-scenario: api-architecture-foundation / Allowing direct requests without Origin header / Direct navigation to pageviews endpoint
  it('allows direct requests without an origin header', () => {
    expect(checkOrigin('', ['https://example.com'])).toBe(true);
  });
});
