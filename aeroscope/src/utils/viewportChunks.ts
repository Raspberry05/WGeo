import type { FlightBounds } from "@/lib/aeroapi/bounds";
import { boundsKey } from "@/lib/aeroapi/bounds";
import { VIEWPORT_CHUNK_CELL_DEG } from "@/config/trafficView";

/**
 * Expand API search bounds to a fixed lat/lon grid so pans within a cell reuse
 * the same AeroAPI query (server cache) and pans across cells load the next chunk.
 */
export function snapBoundsToChunkGrid(
  bounds: FlightBounds,
  cellDeg: number = VIEWPORT_CHUNK_CELL_DEG,
): FlightBounds {
  const lamin = Math.floor(bounds.lamin / cellDeg) * cellDeg;
  const lamax = Math.ceil(bounds.lamax / cellDeg) * cellDeg;
  const lomin = Math.floor(bounds.lomin / cellDeg) * cellDeg;
  const lomax = Math.ceil(bounds.lomax / cellDeg) * cellDeg;

  return {
    lamin: Math.max(-90, lamin),
    lomin: Math.max(-180, lomin),
    lamax: Math.min(90, lamax),
    lomax: Math.min(180, lomax),
  };
}

function clampLat(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

function clampLon(lon: number): number {
  return Math.max(-180, Math.min(180, lon));
}

export function tileBoundsToCells(
  bounds: FlightBounds,
  cellDeg: number = VIEWPORT_CHUNK_CELL_DEG,
): FlightBounds[] {
  const snapped = snapBoundsToChunkGrid(bounds, cellDeg);
  const out: FlightBounds[] = [];

  const latStart = Math.floor(snapped.lamin / cellDeg) * cellDeg;
  const latEnd = Math.ceil(snapped.lamax / cellDeg) * cellDeg;
  const lonStart = Math.floor(snapped.lomin / cellDeg) * cellDeg;
  const lonEnd = Math.ceil(snapped.lomax / cellDeg) * cellDeg;

  for (let lat = latStart; lat < latEnd; lat += cellDeg) {
    const lamin = clampLat(lat);
    const lamax = clampLat(lat + cellDeg);
    if (lamax <= lamin) continue;

    for (let lon = lonStart; lon < lonEnd; lon += cellDeg) {
      const lomin = clampLon(lon);
      const lomax = clampLon(lon + cellDeg);
      if (lomax <= lomin) continue;

      out.push({ lamin, lomin, lamax, lomax });
    }
  }

  return out;
}

export function boundsCenter(bounds: FlightBounds): { lat: number; lon: number } {
  return { lat: (bounds.lamin + bounds.lamax) / 2, lon: (bounds.lomin + bounds.lomax) / 2 };
}

export function viewportChunkKey(bounds: FlightBounds): string {
  return boundsKey(bounds);
}

export function viewportChunkKeys(boundsList: FlightBounds[]): string {
  return boundsList.map((b) => boundsKey(b)).sort().join("|");
}
