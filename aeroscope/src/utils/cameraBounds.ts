import type { Viewer } from "cesium";
import {
  VIEWPORT_BOUNDS_MAX_SPAN_DEG,
  VIEWPORT_SEARCH_PADDING_RATIO,
} from "@/config/trafficView";
import type { FlightBounds } from "@/lib/aeroapi/bounds";
import type { AircraftState } from "@/store/useAircraftStore";

export type CameraRect = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type ViewportBoundsResult = {
  bounds: FlightBounds;
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
  const lonSpan = rect.east - rect.west;
  const latPad = latSpan * ratio;
  const lonPad = lonSpan * ratio;
  return {
    south: rect.south - latPad,
    north: rect.north + latPad,
    west: rect.west - lonPad,
    east: rect.east + lonPad,
  };
}

/** Full camera rectangle in radians-derived degrees. */
export function getCameraRect(viewer: Viewer): CameraRect | null {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return null;

  const west = rect.west;
  const south = rect.south;
  const east = rect.east;
  const north = rect.north;

  if (
    !Number.isFinite(west) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(north)
  ) {
    return null;
  }

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

/**
 * Search bounds for AeroAPI (may clamp span) plus true camera rect for client filter.
 */
export function getViewportBounds(viewer: Viewer): ViewportBoundsResult | null {
  const cameraRect = getCameraRect(viewer);
  if (!cameraRect) return null;

  const padded = padRect(cameraRect, VIEWPORT_SEARCH_PADDING_RATIO);

  const lat = clampSpan(padded.south, padded.north, VIEWPORT_BOUNDS_MAX_SPAN_DEG);
  const lon = clampSpan(padded.west, padded.east, VIEWPORT_BOUNDS_MAX_SPAN_DEG);

  const bounds: FlightBounds = {
    lamin: lat.min,
    lomin: lon.min,
    lamax: lat.max,
    lomax: lon.max,
  };

  return {
    bounds,
    centerLat: (cameraRect.south + cameraRect.north) / 2,
    centerLon: (cameraRect.west + cameraRect.east) / 2,
    clamped: lat.clamped || lon.clamped,
    cameraRect,
  };
}
