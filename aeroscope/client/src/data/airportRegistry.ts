import {
  getAirportRecord,
  getCountryCodeForIcao,
  isAirportCatalogLoaded,
} from "./airportCatalog";

export interface AirportRegistryEntry {
  name: string;
  countryCode: string;
  lat?: number;
  lon?: number;
}

/** Legacy manual overrides when catalog is not yet loaded */
const FALLBACK_REGISTRY: Record<string, AirportRegistryEntry> = {
  KATL: { name: "Atlanta", countryCode: "US", lat: 33.6407, lon: -84.4277 },
  EGLL: { name: "London Heathrow", countryCode: "GB", lat: 51.47, lon: -0.4543 },
  LFPG: { name: "Paris CDG", countryCode: "FR", lat: 49.0097, lon: 2.5479 },
  RJTT: { name: "Tokyo Haneda", countryCode: "JP", lat: 35.5494, lon: 139.7798 },
};

export function lookupAirport(
  icao: string | null | undefined,
): AirportRegistryEntry | null {
  if (!icao) return null;
  const key = icao.trim().toUpperCase();

  if (isAirportCatalogLoaded()) {
    const record = getAirportRecord(key);
    if (record) {
      return {
        name: record.name,
        countryCode: record.country,
        lat: record.lat,
        lon: record.lon,
      };
    }
  }

  return FALLBACK_REGISTRY[key] ?? null;
}

export function airportCountryCode(icao: string | null | undefined): string | null {
  if (!icao) return null;
  const fromCatalog = getCountryCodeForIcao(icao);
  if (fromCatalog) return fromCatalog;
  return lookupAirport(icao)?.countryCode ?? null;
}
