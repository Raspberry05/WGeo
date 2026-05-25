import type { Airport, AirportBounds } from "../data/airports";
import type { AircraftState } from "../store/useAircraftStore";
import {
  classifyStatus,
  geoToSceneForAirport,
  haversineKm,
} from "../utils/geoMath";

function getAircraftCategory(cat: number | null): string {
  switch (cat) {
    case 2:
      return "Light";
    case 3:
      return "Small";
    case 4:
      return "Large";
    case 5:
      return "High Vortex Large";
    case 6:
      return "Heavy";
    case 7:
      return "High Performance";
    case 8:
      return "Rotorcraft";
    case 9:
      return "Glider";
    case 10:
      return "Balloon";
    case 14:
      return "UAV";
    default:
      return "Unknown";
  }
}

function boundsToQuery(bounds: AirportBounds): string {
  const params = new URLSearchParams({
    lamin: String(bounds.lamin),
    lomin: String(bounds.lomin),
    lamax: String(bounds.lamax),
    lomax: String(bounds.lomax),
  });
  return params.toString();
}

export async function fetchOpenSkyAircraft(
  airport: Airport,
): Promise<AircraftState[]> {
  const res = await fetch(
    `http://localhost:4000/api/opensky?${boundsToQuery(airport.bounds)}`,
  );

  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);

  const data = await res.json();
  if (!data.states || data.states.length === 0) return [];

  return data.states
    .filter((s: unknown[]) => s?.[5] != null && s?.[6] != null)
    .map((s: unknown[]): AircraftState => {
      const row = s as (string | number | boolean | null)[];
      const icao24 = String(row[0] ?? "");
      const callsign = String(row[1] || icao24).trim();
      const lon = Number(row[5]);
      const lat = Number(row[6]);
      const altitude = Number(row[7] ?? 0);
      const onGround = Boolean(row[8] ?? false);
      const velocity = Number(row[9] ?? 0);
      const heading = Number(row[10] ?? 0);
      const categoryRaw = row[17];
      const categoryCode =
        categoryRaw === null || categoryRaw === undefined
          ? null
          : Number(categoryRaw);

      return {
        id: icao24,
        callsign,
        icao24,
        position: geoToSceneForAirport(lat, lon, altitude, airport.id),
        rawLat: lat,
        rawLon: lon,
        altitude,
        velocity,
        heading,
        onGround,
        status: classifyStatus(altitude, velocity, onGround),
        aircraftType: getAircraftCategory(categoryCode),
        categoryCode,
        lastUpdated: Date.now(),
      };
    })
    .filter(
      (ac: AircraftState) =>
        haversineKm(ac.rawLat, ac.rawLon, airport.lat, airport.lon) <=
        airport.radiusKm,
    );
}
