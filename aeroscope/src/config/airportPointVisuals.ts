import { DistanceDisplayCondition, NearFarScalar } from "cesium";

/** Visible only between 0 m and ~20,000 km from camera. */
export const AIRPORT_POINT_DISPLAY = new DistanceDisplayCondition(0, 2.0e7);

/** Full opacity within ~800 km, invisible beyond ~12,000 km. */
export const AIRPORT_POINT_FADE = new NearFarScalar(8.0e5, 1.0, 1.2e7, 0.0);

/** Active airport stays fully visible at any view distance. */
export const AIRPORT_ACTIVE_FADE = new NearFarScalar(0, 1.0, 5.0e7, 1.0);

/** No size falloff for the active airport marker. */
export const AIRPORT_ACTIVE_SCALE = new NearFarScalar(0, 1.0, 1, 1.0);

/** Slightly shrink distant markers for clarity at globe scale. */
export const AIRPORT_POINT_SCALE = new NearFarScalar(8.0e5, 1.0, 1.2e7, 0.4);

/** Meters above terrain for inactive airport markers (triangle base). */
export const AIRPORT_POINT_HEIGHT_M = 12;

/** Meters above terrain for the active airport marker. */
export const AIRPORT_ACTIVE_HEIGHT_M = 30;

/**
 * Depth test off when camera is within this distance (m).
 * Keeps nearby markers on top of terrain; far points still occlude behind globe.
 */
export const AIRPORT_POINT_DISABLE_DEPTH_TEST_M = 120_000;

/** Show small_airport dots when camera is below this height (m) — airport traffic mode. */
export const AIRPORT_SMALL_AIRPORT_MAX_CAMERA_M = 2_000_000;

/** Stricter threshold in aircraft traffic mode (less map clutter). */
export const AIRPORT_SMALL_AIRPORT_AIRCRAFT_MODE_MAX_CAMERA_M = 800_000;

/** Max airports to terrain-sample per idle chunk. */
export const AIRPORT_TERRAIN_SAMPLE_CHUNK = 500;

/** Max airports queued for terrain sampling at once. */
export const AIRPORT_VIEWPORT_SAMPLE_MAX = 2000;

/** Lat/lon grid cell size (degrees) for small-airport spatial index. */
export const AIRPORT_GRID_CELL_DEG = 2;
