import type { Viewer } from "cesium";
import { VIEWPORT_BOUNDS_MAX_SPAN_DEG } from "@/config/trafficView";
import type { FlightBounds } from "@/lib/aeroapi/bounds";

export type ViewportBoundsResult = {
  bounds: FlightBounds;
  centerLat: number;
  centerLon: number;
  clamped: boolean;
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

/** Camera view rectangle as flight search bounds, capped to max span. */
export function getViewportBounds(viewer: Viewer): ViewportBoundsResult | null {
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

  const lat = clampSpan(south, north, VIEWPORT_BOUNDS_MAX_SPAN_DEG);
  const lon = clampSpan(west, east, VIEWPORT_BOUNDS_MAX_SPAN_DEG);

  const bounds: FlightBounds = {
    lamin: lat.min,
    lomin: lon.min,
    lamax: lat.max,
    lomax: lon.max,
  };

  return {
    bounds,
    centerLat: (lat.min + lat.max) / 2,
    centerLon: (lon.min + lon.max) / 2,
    clamped: lat.clamped || lon.clamped,
  };
}
