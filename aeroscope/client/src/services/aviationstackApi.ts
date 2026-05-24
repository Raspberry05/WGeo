import type { AircraftState, AircraftStatus } from "../store/useAircraftStore";
import { geoToScene, classifyStatus } from "../utils/geoMath";

const API_KEY = "57c49026608774a05e887e9d2f774c87"; // paste your free key

export async function fetchAviationStackAircraft(): Promise<AircraftState[]> {
  // Filter to ATL departures/arrivals
  const url = `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&arr_iata=ATL&flight_status=active&limit=50`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`AviationStack error: ${res.status}`);
  const data = await res.json();

  if (!data.data) return [];

  return data.data
    .filter((f: any) => f.live?.latitude && f.live?.longitude)
    .map((f: any): AircraftState => {
      const lat: number = f.live.latitude;
      const lon: number = f.live.longitude;
      const altitude: number = f.live.altitude ?? 0;
      const velocity: number = f.live.speed_horizontal ?? 0;
      const heading: number = f.live.direction ?? 0;
      const onGround: boolean = f.live.is_ground ?? false;
      const callsign: string = f.flight?.iata ?? f.flight?.icao ?? "UNKNOWN";
      const icao24: string = f.aircraft?.icao24 ?? callsign;

      return {
        id: icao24 || callsign,
        callsign,
        icao24,
        position: geoToScene(lat, lon, altitude),
        rawLat: lat,
        rawLon: lon,
        velocity,
        heading,
        altitude,
        onGround,
        status: classifyStatus(altitude, velocity, onGround),
        lastUpdated: Date.now(),
      };
    });
}
