// ATL center coordinates
export const ATL_CENTER = {
  lat: 33.6407,
  lon: -84.4277,
};

// Scale: 1 scene unit ≈ 100 meters
const SCALE = 0.0009; // degrees per unit

export function geoToScene(
  lat: number,
  lon: number,
  altitude: number = 0,
): [number, number, number] {
  const x = (lon - ATL_CENTER.lon) / SCALE;
  const z = -(lat - ATL_CENTER.lat) / SCALE;
  const y = altitude * 0.003;
  return [x, y, z];
}

/** OpenSky barometric altitude is reported in feet. */
export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

export function altitudeToMeters(altitudeFeet: number, onGround: boolean): number {
  if (onGround) return 2;
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
