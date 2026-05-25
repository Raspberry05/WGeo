import {
  getAirportFromCatalog,
  getAirportRecords,
  isAirportCatalogLoaded,
  loadAirportCatalog,
  recordToAirport,
  type AirportRecord,
} from "./airportCatalog";

export interface AirportBounds {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}

export interface Airport {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radiusKm: number;
  bounds: AirportBounds;
}

export const DEFAULT_AIRPORT_ID = "KATL";

export { loadAirportCatalog, isAirportCatalogLoaded, type AirportRecord };

export function getAirport(id: string): Airport {
  if (!isAirportCatalogLoaded()) {
    throw new Error("Airport catalog not loaded. Call loadAirportCatalog() first.");
  }
  return getAirportFromCatalog(id);
}

export function getAllAirports(): Airport[] {
  if (!isAirportCatalogLoaded()) return [];
  return getAirportRecords().map(recordToAirport);
}
