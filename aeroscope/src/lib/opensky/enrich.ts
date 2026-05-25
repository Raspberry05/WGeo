import {
  normalizeAirportIcao,
  pickLatestFlight,
  type OpenSkyFlightRecord,
} from "./flights";
import { getOpenSkyAuthHeaders } from "./tokenManager";

export type AircraftEnrichmentPayload = {
  operatorName: string | null;
  aircraftModel: string | null;
  originAirport: string | null;
  destinationAirport: string | null;
};

const ENRICH_TTL_MS = 300_000;

const enrichCache = new Map<
  string,
  { data: AircraftEnrichmentPayload; lastFetch: number }
>();

const emptyEnrichment = (): AircraftEnrichmentPayload => ({
  operatorName: null,
  aircraftModel: null,
  originAirport: null,
  destinationAirport: null,
});

export function isValidIcao24(icao24: string): boolean {
  return /^[a-f0-9]{6}$/.test(icao24);
}

export async function fetchAircraftEnrichment(
  icao24: string,
): Promise<AircraftEnrichmentPayload> {
  const normalized = icao24.toLowerCase().trim();
  if (!isValidIcao24(normalized)) {
    throw new Error("Invalid icao24");
  }

  const cached = enrichCache.get(normalized);
  if (cached && Date.now() - cached.lastFetch < ENRICH_TTL_MS) {
    return cached.data;
  }

  try {
    const headers = await getOpenSkyAuthHeaders();
    const now = Math.floor(Date.now() / 1000);
    const begin = now - 6 * 3600;
    const end = now;

    const [metaRes, flightsRes] = await Promise.allSettled([
      fetch(
        `https://opensky-network.org/api/metadata/aircraft/icao24/${normalized}`,
        { headers, signal: AbortSignal.timeout(12_000) },
      ),
      fetch(
        `https://opensky-network.org/api/flights/aircraft?icao24=${normalized}&begin=${begin}&end=${end}`,
        { headers, signal: AbortSignal.timeout(12_000) },
      ),
    ]);

    let operatorName: string | null = null;
    let aircraftModel: string | null = null;
    let originAirport: string | null = null;
    let destinationAirport: string | null = null;

    if (metaRes.status === "fulfilled" && metaRes.value.ok) {
      const m = (await metaRes.value.json()) as Record<string, unknown>;
      const owner = m.owner ?? m.operator;
      operatorName = owner != null ? String(owner) : null;
      const typecode = m.typecode ?? m.model;
      aircraftModel = typecode != null ? String(typecode) : null;
    }

    if (flightsRes.status === "fulfilled" && flightsRes.value.ok) {
      const flights = (await flightsRes.value.json()) as OpenSkyFlightRecord[];
      if (Array.isArray(flights)) {
        const latest = pickLatestFlight(flights);
        if (latest) {
          originAirport = normalizeAirportIcao(
            latest.estDepartureAirport ?? latest.estdepartureairport,
          );
          destinationAirport = normalizeAirportIcao(
            latest.estArrivalAirport ?? latest.estarrivalairport,
          );
        }
      }
    }

    const data: AircraftEnrichmentPayload = {
      operatorName,
      aircraftModel,
      originAirport,
      destinationAirport,
    };

    enrichCache.set(normalized, { data, lastFetch: Date.now() });
    return data;
  } catch (err) {
    console.error("[Aeroscope] Enrich error:", err);
    return emptyEnrichment();
  }
}
