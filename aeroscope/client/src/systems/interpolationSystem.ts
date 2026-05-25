import type { AircraftState } from "../store/useAircraftStore";
import {
  altitudeToMeters,
  geoToScene,
  lerp,
  lerpAngle,
} from "../utils/geoMath";

const targets = new Map<
  string,
  {
    fromLat: number;
    toLat: number;
    fromLon: number;
    toLon: number;
    fromAlt: number;
    toAlt: number;
    fromHeading: number;
    toHeading: number;
    startTime: number;
    duration: number;
  }
>();

const INTERP_DURATION = 8000;

export function setInterpolationTarget(
  prev: AircraftState | undefined,
  next: AircraftState,
): void {
  targets.set(next.id, {
    fromLat: prev?.rawLat ?? next.rawLat,
    toLat: next.rawLat,
    fromLon: prev?.rawLon ?? next.rawLon,
    toLon: next.rawLon,
    fromAlt: prev?.altitude ?? next.altitude,
    toAlt: next.altitude,
    fromHeading: prev?.heading ?? next.heading,
    toHeading: next.heading,
    startTime: Date.now(),
    duration: INTERP_DURATION,
  });
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function getInterpolatedGeoState(ac: AircraftState): {
  lat: number;
  lon: number;
  altMeters: number;
  headingRad: number;
  clampToGround: boolean;
} {
  const target = targets.get(ac.id);
  if (!target) {
    return {
      lat: ac.rawLat,
      lon: ac.rawLon,
      altMeters: altitudeToMeters(ac.altitude, ac.onGround),
      headingRad: -((ac.heading * Math.PI) / 180),
      clampToGround: ac.onGround,
    };
  }

  const elapsed = Date.now() - target.startTime;
  const t = easeInOut(Math.min(elapsed / target.duration, 1));

  const lat = lerp(target.fromLat, target.toLat, t);
  const lon = lerp(target.fromLon, target.toLon, t);
  const altitudeFeet = lerp(target.fromAlt, target.toAlt, t);
  const fromRad = -((target.fromHeading * Math.PI) / 180);
  const toRad = -((target.toHeading * Math.PI) / 180);
  const headingRad = lerpAngle(fromRad, toRad, t);

  const onGround = ac.onGround && altitudeFeet < 500;

  return {
    lat,
    lon,
    altMeters: altitudeToMeters(altitudeFeet, onGround),
    headingRad,
    clampToGround: onGround,
  };
}

/** @deprecated Legacy Three.js scene coordinates — use getInterpolatedGeoState instead. */
export function getInterpolatedState(ac: AircraftState): {
  position: [number, number, number];
  headingRad: number;
} {
  const geo = getInterpolatedGeoState(ac);
  return {
    position: geoToScene(geo.lat, geo.lon, ac.altitude),
    headingRad: geo.headingRad,
  };
}
