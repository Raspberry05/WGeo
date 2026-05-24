import type { AircraftState } from "../store/useAircraftStore";
import { geoToScene, classifyStatus } from "../utils/geoMath";

function getAircraftCategory(cat: number | null): string {
  switch (cat) {
    case 2: return "Light";
    case 3: return "Small";
    case 4: return "Large";
    case 5: return "High Vortex Large";
    case 6: return "Heavy";
    case 7: return "High Performance";
    case 8: return "Rotorcraft";
    case 9: return "Glider";
    case 10: return "Balloon";
    case 14: return "UAV";
    default: return "Unknown";
  }
}

export async function fetchOpenSkyAircraft(): Promise<AircraftState[]> {
  const res = await fetch("http://localhost:4000/api/opensky");

  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);

  const data = await res.json();
  if (!data.states || data.states.length === 0) return [];

  return data.states
    .filter((s: any[]) => s?.[5] != null && s?.[6] != null) // must have lon/lat
    .map((s: any[]): AircraftState => {
      const icao24: string = s[0];
      const callsign: string = (s[1] || icao24).trim();
      const lon: number = s[5];
      const lat: number = s[6];
      const altitude: number = s[7] ?? 0; // barometric altitude (feet)
      const onGround: boolean = s[8] ?? false;
      const velocity: number = s[9] ?? 0; // m/s
      const heading: number = s[10] ?? 0; // degrees
      const category = s[17] ?? null;

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
        aircraftType: getAircraftCategory(category),
        lastUpdated: Date.now()

      };
    });
}
