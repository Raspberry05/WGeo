/** Minimum time between OpenSky polls (measured from end of previous fetch). */
export const AIRCRAFT_POLL_INTERVAL_MS = 6000;

/**
 * Apply new velocity/heading this long after the HTTP response arrives.
 * Motion continues at the previous speed until then.
 */
export const AIRCRAFT_MOTION_APPLY_DELAY_MS = 1000;

/** Fraction of position error corrected toward the time-adjusted fix when applied. */
export const AIRCRAFT_MOTION_POSITION_BLEND = 0.15;

/** Server-side cache for identical bounds — slightly below poll interval. */
export const OPENSKY_SERVER_CACHE_MS = 5500;
