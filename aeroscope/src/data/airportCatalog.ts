import {
  passesAirportTypeFilter,
  type AirportType,
} from "../config/airportFilters";
import { AIRPORTS_GLOBAL_URL, AIRPORTS_INDEX_URL } from "../config/dataPaths";
import { boundsFromCenter } from "../utils/geoMath";
import {
  buildAirportViewportIndex,
  type AirportViewportIndex,
} from "../utils/airportViewportIndex";
import type { Airport } from "./airports";

/** Minimal fields for map rendering (global layer). */
export interface AirportMapRecord {
  id: string;
  lat: number;
  lon: number;
  type: string;
}

export interface AirportRecord extends AirportMapRecord {
  name: string;
  country: string;
  municipality: string;
}

const RADIUS_BY_TYPE: Record<string, number> = {
  large_airport: 80,
  medium_airport: 50,
  small_airport: 35,
  seaplane_base: 25,
  heliport: 20,
};

let globalCatalog: AirportMapRecord[] = [];
let catalog: AirportRecord[] = [];
let byId = new Map<string, AirportRecord>();
let loadPromise: Promise<void> | null = null;
let fullLoadPromise: Promise<void> | null = null;
let viewportIndex: AirportViewportIndex | null = null;
let searchPrefixIndex: Map<string, AirportRecord[]> | null = null;
const fullCatalogListeners = new Set<() => void>();

function notifyFullCatalogLoaded(): void {
  for (const listener of fullCatalogListeners) {
    listener();
  }
}

export function subscribeFullCatalogLoaded(listener: () => void): () => void {
  if (catalog.length > 0) {
    listener();
  }
  fullCatalogListeners.add(listener);
  return () => {
    fullCatalogListeners.delete(listener);
  };
}

function mapToRecord(map: AirportMapRecord): AirportRecord {
  const full = byId.get(map.id);
  if (full) return full;
  return {
    ...map,
    name: map.id,
    country: "",
    municipality: "",
  };
}

function buildSearchPrefixIndex(records: AirportRecord[]): void {
  const index = new Map<string, AirportRecord[]>();
  for (const a of records) {
    const id = a.id.toUpperCase();
    for (let len = 2; len <= Math.min(4, id.length); len++) {
      const prefix = id.slice(0, len);
      const bucket = index.get(prefix);
      if (bucket) {
        bucket.push(a);
      } else {
        index.set(prefix, [a]);
      }
    }
  }
  searchPrefixIndex = index;
}

async function loadFullCatalogInBackground(): Promise<void> {
  if (catalog.length > 0) return fullLoadPromise ?? Promise.resolve();
  if (fullLoadPromise) return fullLoadPromise;

  fullLoadPromise = (async () => {
    const res = await fetch(AIRPORTS_INDEX_URL);
    if (!res.ok) {
      throw new Error(`Failed to load full airport index: ${res.status}`);
    }
    const data = (await res.json()) as AirportRecord[];
    catalog = data;
    byId = new Map(data.map((a) => [a.id, a]));
    viewportIndex = buildAirportViewportIndex(data);
    buildSearchPrefixIndex(data);
    notifyFullCatalogLoaded();
  })();

  return fullLoadPromise;
}

export function isAirportCatalogLoaded(): boolean {
  return globalCatalog.length > 0;
}

export function isFullCatalogLoaded(): boolean {
  return catalog.length > 0;
}

export function getViewportIndex(): AirportViewportIndex | null {
  return viewportIndex;
}

export async function loadAirportCatalog(): Promise<void> {
  if (globalCatalog.length > 0) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const res = await fetch(AIRPORTS_GLOBAL_URL);
    if (!res.ok) {
      throw new Error(`Failed to load airport catalog: ${res.status}`);
    }
    const data = (await res.json()) as AirportMapRecord[];
    globalCatalog = data;
    byId = new Map(data.map((a) => [a.id, mapToRecord(a)]));

    void loadFullCatalogInBackground().catch((err: unknown) => {
      console.warn("[Aeroscope] Full airport index load failed:", err);
    });
  })();

  return loadPromise;
}

/** All airport types for the global map layer (filtered by HUD type). */
export function getAirportRecordsForMap(
  typeFilter: AirportType[] | null = null,
): AirportMapRecord[] {
  return globalCatalog.filter((r) => passesAirportTypeFilter(r.type, typeFilter));
}

export function getAirportRecords(): AirportRecord[] {
  return catalog.length > 0 ? catalog : globalCatalog.map(mapToRecord);
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
    const firstGlobal = globalCatalog[0];
    const fallback = byId.get("KATL") ?? (firstGlobal ? mapToRecord(firstGlobal) : undefined);
    if (!fallback) {
      throw new Error("Airport catalog not loaded");
    }
    return recordToAirport(fallback);
  }
  return recordToAirport(record);
}

export function searchAirports(query: string, limit = 50): AirportRecord[] {
  const q = query.trim().toUpperCase();
  const source = catalog.length > 0 ? catalog : globalCatalog.map(mapToRecord);

  if (!q) return source.slice(0, limit);

  if (searchPrefixIndex && q.length >= 2) {
    const idPrefix = searchPrefixIndex.get(q.slice(0, Math.min(4, q.length)));
    if (idPrefix) {
      const results: AirportRecord[] = [];
      for (const a of idPrefix) {
        if (results.length >= limit) break;
        if (
          a.id.includes(q) ||
          a.name.toUpperCase().includes(q) ||
          a.municipality.toUpperCase().includes(q)
        ) {
          results.push(a);
        }
      }
      if (results.length > 0) return results;
    }
  }

  const results: AirportRecord[] = [];
  for (const a of source) {
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

export { mapToRecord };
