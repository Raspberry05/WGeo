/** Max lat/lon span for viewport flight search (degrees). */
export const VIEWPORT_BOUNDS_MAX_SPAN_DEG = 8;

/** Padding added to camera rect before API search (fraction of span). */
export const VIEWPORT_SEARCH_PADDING_RATIO = 0.08;

/** Max aircraft kept after in-view filter in viewport mode. */
export const MAX_VIEWPORT_AIRCRAFT = 800;

/** Retry poll when viewer not ready in aircraft mode (ms). */
export const VIEWPORT_POLL_VIEWER_RETRY_MS = 1500;

/** Debounce camera moveEnd before refetching flights (ms). */
export const VIEWPORT_POLL_DEBOUNCE_MS = 500;

/** Enables camera-viewport traffic mode in the HUD. */
export const AIRCRAFT_VIEWPORT_ENABLED = true;
