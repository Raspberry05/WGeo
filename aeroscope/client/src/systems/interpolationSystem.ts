import type { AircraftState } from "../store/useAircraftStore";
import {
  geoToScene,
  lerp,
  lerpAngle,
  resolveAltitudeMeters,
} from "../utils/geoMath";

const targets = new Map<
  string,
  {
    fromLat: number;
    toLat: number;
    fromLon: number;
    toLon: number;
    fromAltM: number;
    toAltM: number;
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
    fromAltM: prev?.altitudeMeters ?? next.altitudeMeters,
    toAltM: next.altitudeMeters,
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
      altMeters: resolveAltitudeMeters(ac.altitudeMeters, ac.onGround),
      headingRad: -((ac.heading * Math.PI) / 180),
      clampToGround: ac.onGround,
    };
  }

  const elapsed = Date.now() - target.startTime;
  const t = easeInOut(Math.min(elapsed / target.duration, 1));

  const lat = lerp(target.fromLat, target.toLat, t);
  const lon = lerp(target.fromLon, target.toLon, t);
  const altitudeMeters = lerp(target.fromAltM, target.toAltM, t);
  const fromRad = -((target.fromHeading * Math.PI) / 180);
  const toRad = -((target.toHeading * Math.PI) / 180);
  const headingRad = lerpAngle(fromRad, toRad, t);

  const onGround = ac.onGround && altitudeMeters < 150;

  return {
    lat,
    lon,
    altMeters: resolveAltitudeMeters(altitudeMeters, onGround),
    headingRad,
    clampToGround: onGround,
  };
}

/** @deprecated Legacy Three.js scene coordinates */
export function getInterpolatedState(ac: AircraftState): {
  position: [number, number, number];
  headingRad: number;
} {
  const geo = getInterpolatedGeoState(ac);
  return {
    position: geoToScene(geo.lat, geo.lon, geo.altMeters),
    headingRad: geo.headingRad,
  };
}
