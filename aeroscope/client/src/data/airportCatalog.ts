import { boundsFromCenter } from "../utils/geoMath";
import type { Airport } from "./airports";

export interface AirportRecord {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  type: string;
  municipality: string;
}

const RADIUS_BY_TYPE: Record<string, number> = {
  large_airport: 80,
  medium_airport: 50,
  small_airport: 35,
};

let catalog: AirportRecord[] = [];
let byId = new Map<string, AirportRecord>();
let loadPromise: Promise<void> | null = null;

export function isAirportCatalogLoaded(): boolean {
  return catalog.length > 0;
}

export async function loadAirportCatalog(): Promise<void> {
  if (catalog.length > 0) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const res = await fetch("/data/airports-index.json");
    if (!res.ok) throw new Error(`Failed to load airport catalog: ${res.status}`);
    const data = (await res.json()) as AirportRecord[];
    catalog = data;
    byId = new Map(data.map((a) => [a.id, a]));
  })();

  return loadPromise;
}

export function getAirportRecords(): AirportRecord[] {
  return catalog;
}

export function getAirportRecord(id: string): AirportRecord | undefined {
  return byId.get(id.toUpperCase());
}

export function radiusKmForType(type: string): number {
  return RADIUS_BY_TYPE[type] ?? 50;
}

export function recordToAirport(record: AirportRecord): Airport {
  const radiusKm = radiusKmForType(record.type);
  return {
    id: record.id,
    name: record.name,
    lat: record.lat,
    lon: record.lon,
    radiusKm,
    bounds: boundsFromCenter(record.lat, record.lon, radiusKm),
  };
}

export function getAirportFromCatalog(id: string): Airport {
  const record = byId.get(id.toUpperCase());
  if (!record) {
    const fallback = byId.get("KATL") ?? catalog[0];
    if (!fallback) {
      throw new Error("Airport catalog not loaded");
    }
    return recordToAirport(fallback);
  }
  return recordToAirport(record);
}

export function searchAirports(query: string, limit = 50): AirportRecord[] {
  const q = query.trim().toUpperCase();
  if (!q) return catalog.slice(0, limit);

  const results: AirportRecord[] = [];
  for (const a of catalog) {
    if (results.length >= limit) break;
    const idMatch = a.id.includes(q);
    const nameMatch = a.name.toUpperCase().includes(q);
    const cityMatch = a.municipality.toUpperCase().includes(q);
    if (idMatch || nameMatch || cityMatch) {
      results.push(a);
    }
  }
  return results;
}

export function getCountryCodeForIcao(icao: string | null | undefined): string | null {
  if (!icao) return null;
  return byId.get(icao.trim().toUpperCase())?.country ?? null;
}
