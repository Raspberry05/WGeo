/** Hard ceiling for the full OpenSky proxy path (must stay under Vercel maxDuration). */
export const OPENSKY_PROXY_DEADLINE_MS = 25_000;

export const OPENSKY_TOKEN_TIMEOUT_MS = 12_000;

/** Must exceed Railway proxy upstream (20s) + network buffer. */
export const OPENSKY_STATES_TIMEOUT_MS = 22_000;

export const OPENSKY_PROBE_TIMEOUT_MS = 12_000;
