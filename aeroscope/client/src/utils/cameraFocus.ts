import {
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Matrix4,
  Transforms,
} from "cesium";
import { getAirport } from "../data/airports";

export const GLOBE_VIEW_HEIGHT_M = 2_000_000;
export const LOCAL_VIEW_RADIUS_MULTIPLIER = 3;

export function getAirportCenter(airportId: string, heightM = 0): Cartesian3 {
  const airport = getAirport(airportId);
  return Cartesian3.fromDegrees(airport.lon, airport.lat, heightM);
}

export function getCameraHeightM(cameraPosition: Cartesian3): number {
  const carto = Cartographic.fromCartesian(cameraPosition);
  return carto.height;
}

export function isGlobeView(
  cameraPosition: Cartesian3,
  airportId: string,
): boolean {
  const height = getCameraHeightM(cameraPosition);
  if (height > GLOBE_VIEW_HEIGHT_M) return true;

  const airport = getAirport(airportId);
  const airportCenter = getAirportCenter(airportId);
  const dist = Cartesian3.distance(cameraPosition, airportCenter);
  return dist > airport.radiusKm * 1000 * LOCAL_VIEW_RADIUS_MULTIPLIER;
}

export function getLookAtOffset(target: "globe" | "airport" | "aircraft"): Cartesian3 {
  switch (target) {
    case "globe":
      return new Cartesian3(0, 0, 25_000_000);
    case "aircraft":
      return new Cartesian3(-1200, -900, 600);
    default:
      return new Cartesian3(-2800, -2100, 1800);
  }
}

export function applyLookAtTransform(
  camera: {
    lookAtTransform: (transform: Matrix4, offset: Cartesian3) => void;
  },
  center: Cartesian3,
  offset: Cartesian3,
): void {
  const transform = Transforms.eastNorthUpToFixedFrame(center);
  camera.lookAtTransform(transform, offset);
}

export function clearLookAtTransform(camera: {
  lookAtTransform: (transform: Matrix4) => void;
}): void {
  camera.lookAtTransform(Matrix4.IDENTITY);
}

export function flyToAirportView(
  camera: {
    flyTo: (options: object) => void;
  },
  airportId: string,
  duration = 1.5,
): void {
  const airport = getAirport(airportId);
  camera.flyTo({
    destination: Cartesian3.fromDegrees(
      airport.lon - 0.06,
      airport.lat - 0.05,
      2800,
    ),
    orientation: {
      heading: CesiumMath.toRadians(25),
      pitch: CesiumMath.toRadians(-45),
      roll: 0,
    },
    duration,
  });
}

export function flyToGlobeView(
  camera: { flyTo: (options: object) => void },
  duration = 1.5,
): void {
  camera.flyTo({
    destination: Cartesian3.fromDegrees(-30, 20, 18_000_000),
    duration,
  });
}
