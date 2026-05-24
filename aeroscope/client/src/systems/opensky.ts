import type { AircraftState, AircraftStatus } from "../store/useAircraftStore";
import { geoToScene, classifyStatus } from "../utils/geoMath";

export async function fetchOpenSkyAircraft(): Promise<AircraftState[]> {
  const res = await fetch("http://localhost:4000/api/opensky");

  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);

  const data = await res.json();
  if (!data.states) return [];

  return data.states
    .filter((s: any[]) => s?.[5] != null && s?.[6] != null)
    .map((s: any[]): AircraftState => {
      const icao24 = s[0];
      const callsign = (s[1] || icao24).trim();

      const lon = s[5];
      const lat = s[6];

      const altitude = s[7] ?? s[13] ?? 0;
      const onGround = s[8];
      const velocity = s[9] ?? 0;
      const heading = s[10] ?? 0;

      return {
        id: icao24,
        callsign,
        icao24,
        position: geoToScene(lat, lon, altitude),
        rawLat: lat,
        rawLon: lon,
        altitude,
        velocity,
        heading,
        onGround,
        status: classifyStatus(altitude, velocity, onGround),
        lastUpdated: Date.now(),
      };
    });
}
