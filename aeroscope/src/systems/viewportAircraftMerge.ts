import type { CameraRect } from "@/utils/cameraBounds";
import { isLatLonInCameraRect } from "@/utils/cameraBounds";
import type { AircraftState } from "@/store/useAircraftStore";
import {
  removeInterpolationTarget,
  setInterpolationTarget,
  type MotionSyncMeta,
} from "./interpolationSystem";

function mergeRow(
  prev: AircraftState | undefined,
  ac: AircraftState,
): AircraftState {
  if (!prev) return ac;
  return {
    ...ac,
    operatorName: prev.operatorName ?? ac.operatorName,
    aircraftModel: prev.aircraftModel ?? ac.aircraftModel,
    originAirport: prev.originAirport ?? ac.originAirport,
    destinationAirport: prev.destinationAirport ?? ac.destinationAirport,
    flightDetail: prev.flightDetail ?? ac.flightDetail,
  };
}

/**
 * Viewport traffic: keep everything still on screen, apply fresh chunk data,
 * drop aircraft that left the camera. Display is always filtered to cameraRect.
 */
export function mergeViewportAircraftPoll(
  current: Record<string, AircraftState>,
  fresh: AircraftState[],
  cameraRect: CameraRect,
  syncMeta: MotionSyncMeta,
): Record<string, AircraftState> {
  const next: Record<string, AircraftState> = {};

  for (const ac of Object.values(current)) {
    if (isLatLonInCameraRect(ac.rawLat, ac.rawLon, cameraRect)) {
      next[ac.id] = ac;
    }
  }

  for (const ac of fresh) {
    setInterpolationTarget(current[ac.id], ac, syncMeta);
    next[ac.id] = mergeRow(current[ac.id], ac);
  }

  for (const id of Object.keys(current)) {
    if (next[id]) continue;
    removeInterpolationTarget(id);
  }

  return next;
}
