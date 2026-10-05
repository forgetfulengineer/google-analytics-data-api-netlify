import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { env } from '../lib/env.js';

let _client: BetaAnalyticsDataClient | undefined;

export function getAnalyticsClient(): BetaAnalyticsDataClient {
  if (_client) return _client;

  try {
    const creds = JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    _client = new BetaAnalyticsDataClient({ credentials: creds });
    return _client;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON: ${msg}`);
  }
}
