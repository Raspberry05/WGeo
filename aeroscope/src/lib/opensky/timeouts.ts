function envMs(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Hard ceiling for the full OpenSky proxy path (must stay under Vercel maxDuration). */
export const OPENSKY_PROXY_DEADLINE_MS = envMs("OPENSKY_PROXY_DEADLINE_MS", 9_000);

export const OPENSKY_TOKEN_TIMEOUT_MS = envMs("OPENSKY_TOKEN_TIMEOUT_MS", 8_000);

/** Must be less than OPENSKY_PROXY_DEADLINE_MS; proxy should respond via cache/SWR in <2s. */
export const OPENSKY_STATES_TIMEOUT_MS = envMs("OPENSKY_STATES_TIMEOUT_MS", 8_000);

export const OPENSKY_PROBE_TIMEOUT_MS = envMs("OPENSKY_PROBE_TIMEOUT_MS", 8_000);
