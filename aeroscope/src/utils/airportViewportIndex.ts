import {
  enabledViewportTypes,
  passesAirportTypeFilter,
  type AirportType,
} from "../config/airportFilters";
import { AIRPORT_GRID_CELL_DEG } from "../config/airportPointVisuals";
import type { AirportRecord } from "../data/airportCatalog";

function cellKey(lat: number, lon: number): string {
  const latCell = Math.floor(lat / AIRPORT_GRID_CELL_DEG);
  const lonCell = Math.floor(lon / AIRPORT_GRID_CELL_DEG);
  return `${latCell},${lonCell}`;
}

export type AirportViewportIndex = {
  query: (
    west: number,
    south: number,
    east: number,
    north: number,
    typeFilter?: AirportType[] | null,
  ) => AirportRecord[];
};

const VIEWPORT_INDEX_TYPES = new Set([
  "small_airport",
  "heliport",
  "seaplane_base",
]);

/** Spatial grid of viewport-only airport types (not on the global JSON). */
export function buildAirportViewportIndex(
  records: AirportRecord[],
): AirportViewportIndex {
  const grid = new Map<string, AirportRecord[]>();

  for (const record of records) {
    if (!VIEWPORT_INDEX_TYPES.has(record.type)) continue;
    const key = cellKey(record.lat, record.lon);
    const bucket = grid.get(key);
    if (bucket) {
      bucket.push(record);
    } else {
      grid.set(key, [record]);
    }
  }

  return {
    query(
      west: number,
      south: number,
      east: number,
      north: number,
      typeFilter: AirportType[] | null = null,
    ) {
      const allowedViewport = new Set(enabledViewportTypes(typeFilter));
      const minLatCell = Math.floor(south / AIRPORT_GRID_CELL_DEG);
      const maxLatCell = Math.floor(north / AIRPORT_GRID_CELL_DEG);
      const minLonCell = Math.floor(west / AIRPORT_GRID_CELL_DEG);
      const maxLonCell = Math.floor(east / AIRPORT_GRID_CELL_DEG);

      const results: AirportRecord[] = [];
      for (let latCell = minLatCell; latCell <= maxLatCell; latCell++) {
        for (let lonCell = minLonCell; lonCell <= maxLonCell; lonCell++) {
          const bucket = grid.get(`${latCell},${lonCell}`);
          if (!bucket) continue;
          for (const record of bucket) {
            if (!allowedViewport.has(record.type as AirportType)) continue;
            if (!passesAirportTypeFilter(record.type, typeFilter)) continue;
            if (
              record.lon >= west &&
              record.lon <= east &&
              record.lat >= south &&
              record.lat <= north
            ) {
              results.push(record);
            }
          }
        }
      }
      return results;
    },
  };
}
