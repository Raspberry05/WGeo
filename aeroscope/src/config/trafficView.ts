/**
 * Only clamp API search when the visible view is wider than this (degrees per axis).
 * Normal regional views (e.g. all of North America) use the full camera rectangle.
 */
export const VIEWPORT_BOUNDS_ABSOLUTE_MAX_SPAN_DEG = 90;

/**
 * Padding around the camera rect before chunk snap (fraction of span).
 * Larger = prefetch ahead of pan so the next chunk is often already cached.
 */
export const VIEWPORT_SEARCH_PADDING_RATIO = 0.2;

/**
 * Default chunk grid size (degrees). Actual chunk size is adaptive based on zoom;
 * this is only the fallback.
 */
export const VIEWPORT_CHUNK_CELL_DEG = 4;

/**
 * Adaptive chunk sizing (degrees). Smaller = more accurate, larger = fewer calls.
 */
export const VIEWPORT_CHUNK_CELL_DEG_LEVELS = [2, 4, 8, 12] as const;

/**
 * Max number of chunk cells requested per poll in viewport mode.
 * We adapt this with zoom; hard cap prevents rate-limit blowups.
 */
export const VIEWPORT_MAX_CHUNK_BOXES_PER_POLL_CAP = 24;
export const VIEWPORT_MAX_CHUNK_BOXES_PER_POLL_DEFAULT = 18;

/**
 * Safety cap after in-view filter (viewport mode). Raised so zoomed-out regional
 * views are not trimmed to a small center patch.
 */
export const MAX_VIEWPORT_AIRCRAFT = 3000;

/** AeroAPI /flights/search max_pages when the visible bbox is large (see search.ts). */
export const AEROAPI_SEARCH_MAX_PAGES_CAP = 5;

/** Retry poll when viewer not ready in aircraft mode (ms). */
export const VIEWPORT_POLL_VIEWER_RETRY_MS = 1500;

/** Debounce camera moveEnd before refetching flights (ms). */
export const VIEWPORT_POLL_DEBOUNCE_MS = 500;

/** Enables camera-viewport traffic mode in the HUD. */
export const AIRCRAFT_VIEWPORT_ENABLED = true;
