import type { AircraftState } from '../store/useAircraftStore';
import { lerpPosition, lerpAngle } from '../utils/geoMath';

// Stores interpolation targets per aircraft
const targets = new Map<string, {
  fromPos: [number, number, number];
  toPos: [number, number, number];
  fromHeading: number;
  toHeading: number;
  startTime: number;
  duration: number;
}>();

const INTERP_DURATION = 8000; // ms — matches update interval

export function setInterpolationTarget(prev: AircraftState | undefined, next: AircraftState) {
  targets.set(next.id, {
    fromPos: prev?.position ?? next.position,
    toPos: next.position,
    fromHeading: prev?.heading ?? next.heading,
    toHeading: next.heading,
    startTime: Date.now(),
    duration: INTERP_DURATION,
  });
}

export function getInterpolatedState(ac: AircraftState): {
  position: [number, number, number];
  headingRad: number;
} {
  const target = targets.get(ac.id);
  if (!target) {
    return {
      position: ac.position,
      headingRad: -((ac.heading * Math.PI) / 180),
    };
  }

  const elapsed = Date.now() - target.startTime;
  const t = Math.min(elapsed / target.duration, 1);
  const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out

  const position = lerpPosition(target.fromPos, target.toPos, ease);
  const fromRad = -((target.fromHeading * Math.PI) / 180);
  const toRad = -((target.toHeading * Math.PI) / 180);
  const headingRad = lerpAngle(fromRad, toRad, ease);

  return { position, headingRad };
}