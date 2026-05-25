import { AIRPORT_GRID_CELL_DEG } from "../config/airportPointVisuals";
import type { AirportRecord } from "../data/airportCatalog";

function cellKey(lat: number, lon: number): string {
  const latCell = Math.floor(lat / AIRPORT_GRID_CELL_DEG);
  const lonCell = Math.floor(lon / AIRPORT_GRID_CELL_DEG);
  return `${latCell},${lonCell}`;
}

export type AirportViewportIndex = {
  query: (west: number, south: number, east: number, north: number) => AirportRecord[];
};

/** Spatial grid of small_airport records for viewport culling. */
export function buildAirportViewportIndex(
  records: AirportRecord[],
): AirportViewportIndex {
  const grid = new Map<string, AirportRecord[]>();

  for (const record of records) {
    if (record.type !== "small_airport") continue;
    const key = cellKey(record.lat, record.lon);
    const bucket = grid.get(key);
    if (bucket) {
      bucket.push(record);
    } else {
      grid.set(key, [record]);
    }
  }

  return {
    query(west, south, east, north) {
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
