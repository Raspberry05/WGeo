import {
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  type Viewer,
} from "cesium";
import {
  VIEWPORT_BOUNDS_ABSOLUTE_MAX_SPAN_DEG,
  VIEWPORT_CHUNK_CELL_DEG_LEVELS,
  VIEWPORT_MAX_CHUNK_BOXES_PER_POLL_CAP,
  VIEWPORT_MAX_CHUNK_BOXES_PER_POLL_DEFAULT,
  VIEWPORT_SEARCH_PADDING_RATIO,
} from "@/config/trafficView";
import type { FlightBounds } from "@/lib/aeroapi/bounds";
import type { AircraftState } from "@/store/useAircraftStore";
import { snapBoundsToChunkGrid } from "@/utils/viewportChunks";
import { boundsCenter, tileBoundsToCells } from "@/utils/viewportChunks";

export type CameraRect = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type ViewportBoundsResult = {
  /** One or more bboxes to query (split if crossing the antimeridian). */
  bounds: FlightBounds[];
  centerLat: number;
  centerLon: number;
  clamped: boolean;
  cameraRect: CameraRect;
};

function clampSpan(
  min: number,
  max: number,
  maxSpan: number,
): { min: number; max: number; clamped: boolean } {
  const span = max - min;
  if (span <= maxSpan) {
    return { min, max, clamped: false };
  }
  const center = (min + max) / 2;
  const half = maxSpan / 2;
  return { min: center - half, max: center + half, clamped: true };
}

function padRect(rect: CameraRect, ratio: number): CameraRect {
  const latSpan = rect.north - rect.south;
  const lonSpan = lonSpanDegrees(rect.west, rect.east);
  const latPad = latSpan * ratio;
  const lonPad = lonSpan * ratio;
  return {
    south: rect.south - latPad,
    north: rect.north + latPad,
    west: rect.west - lonPad,
    east: rect.east + lonPad,
  };
}

/** Longitude span in degrees, including views that cross the antimeridian. */
function lonSpanDegrees(west: number, east: number): number {
  if (west <= east) return east - west;
  return 360 - (west - east);
}

function normalizeLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

/**
 * Build AeroAPI bounds from the visible camera rectangle.
 * Uses the full padded view (not a fixed small cap) so queries match what is on screen.
 */
function boundsFromPaddedRect(
  padded: CameraRect,
  maxSpanDeg: number,
): { bounds: FlightBounds[]; clamped: boolean } {
  let south = normalizeLatitude(padded.south);
  let north = normalizeLatitude(padded.north);
  let west = padded.west;
  let east = padded.east;
  let clamped = false;

  const latSpan = north - south;
  if (latSpan > maxSpanDeg) {
    const lat = clampSpan(south, north, maxSpanDeg);
    south = lat.min;
    north = lat.max;
    clamped = true;
  }

  if (west <= east) {
    const lonSpan = east - west;
    if (lonSpan > maxSpanDeg) {
      const lon = clampSpan(west, east, maxSpanDeg);
      west = lon.min;
      east = lon.max;
      clamped = true;
    }
    return {
      bounds: [{ lamin: south, lomin: west, lamax: north, lomax: east }],
      clamped,
    };
  }

  // Antimeridian crossing: split into two bboxes instead of querying near-global longitude.
  const left = { lamin: south, lomin: Math.max(-180, west), lamax: north, lomax: 180 };
  const right = { lamin: south, lomin: -180, lamax: north, lomax: Math.min(180, east) };

  // If padding/clamping made either side invalid, fall back to a single safe box.
  const out: FlightBounds[] = [];
  if (left.lomin < left.lomax) out.push(left);
  if (right.lomin < right.lomax) out.push(right);

  return { bounds: out.length ? out : [{ lamin: south, lomin: -180, lamax: north, lomax: 180 }], clamped: true };
}

function viewCenterDegrees(viewer: Viewer): { lat: number; lon: number } {
  const carto = viewer.camera.positionCartographic;
  return {
    lat: CesiumMath.toDegrees(carto.latitude),
    lon: CesiumMath.toDegrees(carto.longitude),
  };
}

/** Full camera rectangle in radians-derived degrees. */
export function getCameraRect(viewer: Viewer): CameraRect | null {
  const rect = viewer.camera.computeViewRectangle();
  if (rect) {
    const west = CesiumMath.toDegrees(rect.west);
    const south = CesiumMath.toDegrees(rect.south);
    const east = CesiumMath.toDegrees(rect.east);
    const north = CesiumMath.toDegrees(rect.north);

    if (
      Number.isFinite(west) &&
      Number.isFinite(south) &&
      Number.isFinite(east) &&
      Number.isFinite(north)
    ) {
      return { west, south, east, north };
    }
  }

  return getCameraRectFromCanvas(viewer);
}

/** Fallback when computeViewRectangle() is null (e.g. steep tilt / poles). */
function getCameraRectFromCanvas(viewer: Viewer): CameraRect | null {
  const canvas = viewer.scene.canvas;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w <= 0 || h <= 0) return null;

  const corners = [
    new Cartesian2(0, 0),
    new Cartesian2(w, 0),
    new Cartesian2(w, h),
    new Cartesian2(0, h),
  ];

  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  let hits = 0;

  for (const screen of corners) {
    const ray = viewer.camera.getPickRay(screen);
    if (!ray) continue;
    const pos = viewer.scene.globe.pick(ray, viewer.scene);
    if (!pos) continue;

    const carto = Cartographic.fromCartesian(pos);
    const lon = CesiumMath.toDegrees(carto.longitude);
    const lat = CesiumMath.toDegrees(carto.latitude);

    west = Math.min(west, lon);
    east = Math.max(east, lon);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    hits++;
  }

  if (hits < 2) return null;

  return { west, south, east, north };
}

export function cameraRectToFlightBounds(rect: CameraRect): FlightBounds {
  return {
    lamin: rect.south,
    lomin: rect.west,
    lamax: rect.north,
    lomax: rect.east,
  };
}

/** Geographic center of the visible rectangle (for fair distance sorting). */
export function getRectCenter(rect: CameraRect): { lat: number; lon: number } {
  const lat = (rect.south + rect.north) / 2;
  if (rect.west <= rect.east) {
    return { lat, lon: (rect.west + rect.east) / 2 };
  }
  let lon = (rect.west + rect.east + 360) / 2;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}

export function isLatLonInCameraRect(
  lat: number,
  lon: number,
  rect: CameraRect,
): boolean {
  if (lat < rect.south || lat > rect.north) return false;

  if (rect.west <= rect.east) {
    return lon >= rect.west && lon <= rect.east;
  }

  return lon >= rect.west || lon <= rect.east;
}

export function filterAircraftInCameraView(
  viewer: Viewer,
  aircraft: AircraftState[],
): AircraftState[] {
  const rect = getCameraRect(viewer);
  if (!rect) return aircraft;
  return aircraft.filter((ac) =>
    isLatLonInCameraRect(ac.rawLat, ac.rawLon, rect),
  );
}

function chooseChunkCellDegForView(bounds: FlightBounds[], centerLat: number): number {
  // Compute rough view extents. This doesn't need to be perfect; it's for performance tradeoffs.
  const latSpan = Math.max(...bounds.map((b) => b.lamax)) - Math.min(...bounds.map((b) => b.lamin));
  const lonSpan = Math.max(...bounds.map((b) => b.lomax)) - Math.min(...bounds.map((b) => b.lomin));

  // Approximate "visible area" scaled by latitude (lon degrees represent fewer km near the poles).
  const lonScale = Math.max(0.15, Math.cos((centerLat * Math.PI) / 180));
  const kmLikeArea = latSpan * (lonSpan * lonScale);

  // Tuned for a balance: close-up gets 2°, regional 4°, continent 8°, very wide 12°.
  const [d2, d4, d8, d12] = VIEWPORT_CHUNK_CELL_DEG_LEVELS;
  if (kmLikeArea <= 25) return d2;     // city/metro
  if (kmLikeArea <= 160) return d4;    // state/region
  if (kmLikeArea <= 900) return d8;    // country/continent
  return d12;                          // very wide
}

function chooseMaxBoxesPerPoll(cellDeg: number): number {
  // Smaller cells -> more potential cells; allow a slightly higher cap to reduce “empty gaps”.
  // Larger cells -> fewer calls needed.
  const base =
    cellDeg <= 2 ? 22 :
    cellDeg <= 4 ? 20 :
    cellDeg <= 8 ? VIEWPORT_MAX_CHUNK_BOXES_PER_POLL_DEFAULT :
    14;
  return Math.min(base, VIEWPORT_MAX_CHUNK_BOXES_PER_POLL_CAP);
}

/**
 * Search bounds for AeroAPI from the full visible camera view (with padding).
 * Only clamps when the view is wider than VIEWPORT_BOUNDS_ABSOLUTE_MAX_SPAN_DEG (near-global zoom).
 */
export function getViewportBounds(viewer: Viewer): ViewportBoundsResult | null {
  const cameraRect = getCameraRect(viewer);
  if (!cameraRect) return null;

  const padded = padRect(cameraRect, VIEWPORT_SEARCH_PADDING_RATIO);
  const { bounds: paddedBoundsList, clamped } = boundsFromPaddedRect(
    padded,
    VIEWPORT_BOUNDS_ABSOLUTE_MAX_SPAN_DEG,
  );
  const center = viewCenterDegrees(viewer);
  const cellDeg = chooseChunkCellDegForView(paddedBoundsList, center.lat);
  const maxBoxes = chooseMaxBoxesPerPoll(cellDeg);
  const allCells = paddedBoundsList.flatMap((b) => tileBoundsToCells(b, cellDeg));

  // Prioritize cells closest to the view center so zoom/pan loads where you're looking first.
  const prioritized = allCells
    .map((b) => {
      const c = boundsCenter(b);
      const dLat = c.lat - center.lat;
      const dLon = c.lon - center.lon;
      const score = dLat * dLat + dLon * dLon;
      return { b, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, maxBoxes)
    .map((x) => x.b);

  // Ensure stable keys and server cache friendliness (already grid-aligned).
  const bounds = prioritized.map((b) => snapBoundsToChunkGrid(b, cellDeg));

  return {
    bounds,
    centerLat: center.lat,
    centerLon: center.lon,
    clamped,
    cameraRect,
  };
}
