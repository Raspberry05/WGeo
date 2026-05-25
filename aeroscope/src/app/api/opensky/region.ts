/**
 * OpenSky servers are in Europe. Run API routes in EU Vercel regions to avoid
 * US→EU connect timeouts (UND_ERR_CONNECT_TIMEOUT).
 */
export const OPENSKY_API_REGIONS = [
  "fra1",
  "cdg1",
  "ams1",
  "lhr1",
] as const;

export const OPENSKY_API_MAX_DURATION = 30;
