function envMs(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const AEROAPI_TIMEOUT_MS = envMs("AEROAPI_TIMEOUT_MS", 8_000);

export const AEROAPI_BASE_URL =
  process.env.AEROAPI_BASE_URL?.trim() ||
  "https://aeroapi.flightaware.com/aeroapi";
