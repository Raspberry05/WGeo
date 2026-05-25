import { getAirport } from "../data/airports";
import { lookupAirport } from "../data/airportRegistry";
import { haversineKm } from "./geoMath";
import { metersToNauticalMiles } from "./flightUnits";

const KM_TO_M = 1000;

export function distanceToAirportNm(
  aircraftLat: number,
  aircraftLon: number,
  airportId: string,
): number {
  const airport = getAirport(airportId);
  const km = haversineKm(
    aircraftLat,
    aircraftLon,
    airport.lat,
    airport.lon,
  );
  return metersToNauticalMiles(km * KM_TO_M);
}

export function routeDistanceNm(
  originIcao: string | null,
  destIcao: string | null,
): number | null {
  if (!originIcao || !destIcao) return null;

  const origin = lookupAirport(originIcao);
  const dest = lookupAirport(destIcao);
  if (!origin?.lat || !origin?.lon || !dest?.lat || !dest?.lon) return null;

  const km = haversineKm(origin.lat, origin.lon, dest.lat, dest.lon);
  return metersToNauticalMiles(km * KM_TO_M);
}

export function formatDistanceToAirport(
  aircraftLat: number,
  aircraftLon: number,
  airportId: string,
): string {
  const nm = distanceToAirportNm(aircraftLat, aircraftLon, airportId);
  return `${nm < 10 ? nm.toFixed(1) : Math.round(nm)} NM`;
}
