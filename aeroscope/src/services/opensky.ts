import type { Airport, AirportBounds } from "../data/airports";
import type { AircraftState } from "../store/useAircraftStore";
import {
  parseCategoryCode,
  resolveCategoryLabel,
} from "../utils/aircraftCategory";
import {
  classifyStatus,
  geoToSceneForAirport,
  haversineKm,
  resolveAltitudeMeters,
} from "../utils/geoMath";

function boundsToQuery(bounds: AirportBounds): string {
  const params = new URLSearchParams({
    lamin: String(bounds.lamin),
    lomin: String(bounds.lomin),
    lamax: String(bounds.lamax),
    lomax: String(bounds.lomax),
  });
  return params.toString();
}

function parseBaroMeters(row: (string | number | boolean | null)[]): number {
  const baro = row[7];
  const geo = row[13];
  if (baro !== null && baro !== undefined && Number.isFinite(Number(baro))) {
    return Number(baro);
  }
  if (geo !== null && geo !== undefined && Number.isFinite(Number(geo))) {
    return Number(geo);
  }
  return 0;
}

export interface AircraftEnrichment {
  operatorName: string | null;
  aircraftModel: string | null;
  originAirport: string | null;
  destinationAirport: string | null;
}

export async function fetchOpenSkyAircraft(
  airport: Airport,
): Promise<AircraftState[]> {
  const res = await fetch(`/api/opensky?${boundsToQuery(airport.bounds)}`);

  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);

  const data = (await res.json()) as {
    states?: unknown[] | null;
    error?: string;
    hint?: string;
    configured?: boolean;
  };

  if (data.error) {
    console.error(
      "OpenSky API error:",
      data.error,
      data.hint ?? "",
      `(configured=${String(data.configured)})`,
    );
    throw new Error(data.error);
  }

  if (!data.states || data.states.length === 0) return [];

  const receivedAtMs = Date.now();
  const rows = data.states as unknown[][];

  return rows
    .filter((s) => s?.[5] != null && s?.[6] != null)
    .map((s): AircraftState => {
      const row = s as (string | number | boolean | null)[];
      const icao24 = String(row[0] ?? "");
      const callsign = String(row[1] || icao24).trim();
      const originCountry = String(row[2] ?? "").trim();
      const timePositionSec = row[3];
      const positionTimeMs =
        timePositionSec != null && Number.isFinite(Number(timePositionSec))
          ? Number(timePositionSec) * 1000
          : null;
      const lon = Number(row[5]);
      const lat = Number(row[6]);
      const baroMeters = parseBaroMeters(row);
      const onGround = Boolean(row[8] ?? false);
      const velocity = Number(row[9] ?? 0);
      const heading = Number(row[10] ?? 0);
      const categoryCode = parseCategoryCode(row[17]);
      const altitudeMeters = resolveAltitudeMeters(baroMeters, onGround);
      const { label } = resolveCategoryLabel(
        categoryCode,
        altitudeMeters,
        velocity,
        onGround,
      );

      return {
        id: icao24,
        callsign,
        icao24,
        position: geoToSceneForAirport(lat, lon, altitudeMeters, airport.id),
        rawLat: lat,
        rawLon: lon,
        altitudeMeters,
        velocity,
        heading,
        onGround,
        status: classifyStatus(altitudeMeters, velocity, onGround),
        aircraftType: label,
        categoryCode,
        originCountry,
        operatorName: null,
        aircraftModel: null,
        originAirport: null,
        destinationAirport: null,
        lastUpdated: receivedAtMs,
        positionTimeMs,
      };
    })
    .filter(
      (ac: AircraftState) =>
        haversineKm(ac.rawLat, ac.rawLon, airport.lat, airport.lon) <=
        airport.radiusKm,
    );
}

export async function fetchAircraftEnrichment(
  icao24: string,
): Promise<AircraftEnrichment> {
  const empty: AircraftEnrichment = {
    operatorName: null,
    aircraftModel: null,
    originAirport: null,
    destinationAirport: null,
  };

  try {
    const res = await fetch(
      `/api/opensky/enrich/${encodeURIComponent(icao24)}`,
    );
    if (!res.ok) return empty;
    return (await res.json()) as AircraftEnrichment;
  } catch {
    return empty;
  }
}
