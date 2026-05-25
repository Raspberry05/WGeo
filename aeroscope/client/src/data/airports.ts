import { boundsFromCenter } from "../utils/geoMath";

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

function defineAirport(
  id: string,
  name: string,
  lat: number,
  lon: number,
  radiusKm: number = 50,
): Airport {
  return {
    id,
    name,
    lat,
    lon,
    radiusKm,
    bounds: boundsFromCenter(lat, lon, radiusKm),
  };
}

export const AIRPORTS: Airport[] = [
  defineAirport("KATL", "Hartsfield–Jackson Atlanta", 33.6407, -84.4277),
  defineAirport("KORD", "Chicago O'Hare", 41.9742, -87.9073),
  defineAirport("KDFW", "Dallas/Fort Worth", 32.8998, -97.0403),
  defineAirport("KLAX", "Los Angeles Intl", 33.9416, -118.4085),
  defineAirport("KJFK", "John F. Kennedy", 40.6413, -73.7781),
  defineAirport("KMIA", "Miami Intl", 25.7959, -80.287),
  defineAirport("KSEA", "Seattle-Tacoma", 47.4502, -122.3088),
  defineAirport("KDEN", "Denver Intl", 39.8561, -104.6737),
  defineAirport("KCLT", "Charlotte Douglas", 35.214, -80.9431),
  defineAirport("KLAS", "Harry Reid Las Vegas", 36.084, -115.1537),
];

export const DEFAULT_AIRPORT_ID = "KATL";

const airportMap = new Map(AIRPORTS.map((a) => [a.id, a]));

export function getAirport(id: string): Airport {
  return airportMap.get(id) ?? AIRPORTS[0];
}

export function getAllAirports(): Airport[] {
  return AIRPORTS;
}
