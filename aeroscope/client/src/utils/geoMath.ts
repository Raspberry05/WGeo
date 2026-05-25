import { getAirport } from "../data/airports";

export const ATL_CENTER = {
  lat: 33.6407,
  lon: -84.4277,
};

const SCALE = 0.0009;
const GROUND_CLAMP_HEIGHT_M = 4;

export interface GeoBounds {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}

export function boundsFromCenter(
  lat: number,
  lon: number,
  radiusKm: number,
): GeoBounds {
  const latDelta = radiusKm / 111.32;
  const lonDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return {
    lamin: lat - latDelta,
    lamax: lat + latDelta,
    lomin: lon - lonDelta,
    lomax: lon + lonDelta,
  };
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function geoToScene(
  lat: number,
  lon: number,
  altitude: number = 0,
  centerLat: number = ATL_CENTER.lat,
  centerLon: number = ATL_CENTER.lon,
): [number, number, number] {
  const x = (lon - centerLon) / SCALE;
  const z = -(lat - centerLat) / SCALE;
  const y = altitude * 0.003;
  return [x, y, z];
}

export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

export function altitudeToMeters(altitudeFeet: number, onGround: boolean): number {
  if (onGround) return GROUND_CLAMP_HEIGHT_M;
  return Math.max(feetToMeters(altitudeFeet), 50);
}

export function classifyStatus(
  altitude: number,
  velocity: number,
  onGround: boolean,
): import("../store/useAircraftStore").AircraftStatus {
  if (onGround) {
    if (velocity > 5) return "taxiing";
    return "parked";
  }
  if (altitude < 1000 && velocity > 50) return "landing";
  return "airborne";
}

export function headingToRotation(heading: number): number {
  return -((heading * Math.PI) / 180);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPosition(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
}

export function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export function airportHighlightRadiusDeg(radiusKm: number): number {
  return radiusKm / 111.32;
}

export function geoToSceneForAirport(
  lat: number,
  lon: number,
  altitude: number,
  airportId: string,
): [number, number, number] {
  const airport = getAirport(airportId);
  return geoToScene(lat, lon, altitude, airport.lat, airport.lon);
}
