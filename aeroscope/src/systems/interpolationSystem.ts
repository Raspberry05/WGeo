import type { AircraftState } from "../store/useAircraftStore";
import {
  AIRCRAFT_MOTION_APPLY_DELAY_MS,
  AIRCRAFT_MOTION_POSITION_BLEND,
  AIRCRAFT_POLL_INTERVAL_MS,
} from "../config/aircraftMotion";
import {
  geoToScene,
  haversineKm,
  offsetLatLonByHeading,
  resolveAltitudeMeters,
} from "../utils/geoMath";

export type MotionSyncMeta = {
  receivedAtMs: number;
  fetchRttMs: number;
};

type MotionState = {
  lat: number;
  lon: number;
  altMeters: number;
  headingDeg: number;
  speedMs: number;
  verticalSpeedMs: number;
  anchorTimeMs: number;
};

type PendingMotionUpdate = {
  prev: AircraftState | undefined;
  next: AircraftState;
  applyAtMs: number;
  receivedAtMs: number;
};

const motionById = new Map<string, MotionState>();
const pendingById = new Map<string, PendingMotionUpdate>();

function headingToRad(degrees: number): number {
  return -((degrees * Math.PI) / 180);
}

function sampleIntervalSec(
  prev: AircraftState | undefined,
  next: AircraftState,
): number {
  if (
    prev?.positionTimeMs != null &&
    next.positionTimeMs != null &&
    next.positionTimeMs > prev.positionTimeMs
  ) {
    return (next.positionTimeMs - prev.positionTimeMs) / 1000;
  }
  return AIRCRAFT_POLL_INTERVAL_MS / 1000;
}

function impliedSpeedMs(prev: AircraftState, next: AircraftState): number {
  const distM =
    haversineKm(prev.rawLat, prev.rawLon, next.rawLat, next.rawLon) * 1000;
  const dtSec = sampleIntervalSec(prev, next);
  return dtSec > 0 ? distM / dtSec : 0;
}

function resolveSpeedMs(
  prev: AircraftState | undefined,
  next: AircraftState,
): number {
  if (next.velocity >= 1) return next.velocity;
  if (prev) return impliedSpeedMs(prev, next);
  return 0;
}

function resolveVerticalSpeedMs(
  prev: AircraftState | undefined,
  next: AircraftState,
): number {
  if (!prev || next.onGround) return 0;
  const dtSec = sampleIntervalSec(prev, next);
  if (dtSec <= 0) return 0;
  const rate = (next.altitudeMeters - prev.altitudeMeters) / dtSec;
  return Math.max(-80, Math.min(80, rate));
}

/** Advance a fix to `atTimeMs` using reported ground speed and heading. */
function timeAdjustedFix(
  next: AircraftState,
  prev: AircraftState | undefined,
  atTimeMs: number,
  receivedAtMs: number,
): { lat: number; lon: number; altMeters: number } {
  const speedMs = resolveSpeedMs(prev, next);
  const fixAgeMs =
    next.positionTimeMs != null
      ? Math.max(0, receivedAtMs - next.positionTimeMs)
      : 0;
  const leadMs = fixAgeMs + Math.max(0, atTimeMs - receivedAtMs);

  const { lat, lon } = offsetLatLonByHeading(
    next.rawLat,
    next.rawLon,
    next.heading,
    speedMs * (leadMs / 1000),
  );

  const dtSec = leadMs / 1000;
  const verticalSpeedMs = resolveVerticalSpeedMs(prev, next);
  const altMeters = next.altitudeMeters + verticalSpeedMs * dtSec;

  return { lat, lon, altMeters };
}

function sampleMotionState(
  state: MotionState,
  atTimeMs: number,
  onGround: boolean,
): {
  lat: number;
  lon: number;
  altMeters: number;
  headingRad: number;
  clampToGround: boolean;
} {
  const dtSec = Math.max(0, (atTimeMs - state.anchorTimeMs) / 1000);
  const distanceM = state.speedMs * dtSec;
  const { lat, lon } = offsetLatLonByHeading(
    state.lat,
    state.lon,
    state.headingDeg,
    distanceM,
  );
  const altitudeMeters = state.altMeters + state.verticalSpeedMs * dtSec;
  const onGroundNow = onGround && altitudeMeters < 150;

  return {
    lat,
    lon,
    altMeters: resolveAltitudeMeters(altitudeMeters, onGroundNow),
    headingRad: headingToRad(state.headingDeg),
    clampToGround: onGroundNow,
  };
}

function applyMotionUpdate(
  prev: AircraftState | undefined,
  next: AircraftState,
  receivedAtMs: number,
  applyAtMs: number,
): void {
  const existing = motionById.get(next.id);
  const adjusted = timeAdjustedFix(next, prev, applyAtMs, receivedAtMs);

  let lat: number;
  let lon: number;
  let altMeters: number;

  if (existing) {
    const current = sampleMotionState(existing, applyAtMs, next.onGround);
    const blend = AIRCRAFT_MOTION_POSITION_BLEND;
    lat = current.lat + (adjusted.lat - current.lat) * blend;
    lon = current.lon + (adjusted.lon - current.lon) * blend;
    altMeters =
      current.altMeters + (adjusted.altMeters - current.altMeters) * blend;
  } else {
    lat = adjusted.lat;
    lon = adjusted.lon;
    altMeters = adjusted.altMeters;
  }

  motionById.set(next.id, {
    lat,
    lon,
    altMeters,
    headingDeg: next.heading,
    speedMs: resolveSpeedMs(prev, next),
    verticalSpeedMs: resolveVerticalSpeedMs(prev, next),
    anchorTimeMs: applyAtMs,
  });
}

function flushPendingUpdates(now: number): void {
  for (const [id, pending] of pendingById) {
    if (now < pending.applyAtMs) continue;
    pendingById.delete(id);
    applyMotionUpdate(
      pending.prev,
      pending.next,
      pending.receivedAtMs,
      pending.applyAtMs,
    );
  }
}

export function setInterpolationTarget(
  prev: AircraftState | undefined,
  next: AircraftState,
  meta: MotionSyncMeta,
): void {
  const applyAtMs = meta.receivedAtMs + AIRCRAFT_MOTION_APPLY_DELAY_MS;

  pendingById.set(next.id, {
    prev,
    next,
    applyAtMs,
    receivedAtMs: meta.receivedAtMs,
  });

  if (!motionById.has(next.id)) {
    pendingById.delete(next.id);
    applyMotionUpdate(prev, next, meta.receivedAtMs, applyAtMs);
  }
}

export function removeInterpolationTarget(id: string): void {
  motionById.delete(id);
  pendingById.delete(id);
}

export function getInterpolatedGeoState(ac: AircraftState): {
  lat: number;
  lon: number;
  altMeters: number;
  headingRad: number;
  clampToGround: boolean;
} {
  const now = Date.now();
  flushPendingUpdates(now);

  const state = motionById.get(ac.id);
  if (!state) {
    return {
      lat: ac.rawLat,
      lon: ac.rawLon,
      altMeters: resolveAltitudeMeters(ac.altitudeMeters, ac.onGround),
      headingRad: headingToRad(ac.heading),
      clampToGround: ac.onGround && ac.altitudeMeters < 150,
    };
  }

  return sampleMotionState(state, now, ac.onGround);
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
