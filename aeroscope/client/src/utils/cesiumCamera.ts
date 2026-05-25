import {
  Cartesian3,
  EasingFunction,
  HeadingPitchRange,
  Math as CesiumMath,
  Matrix4,
  Transforms,
  type Camera,
  type Viewer,
} from "cesium";
import { ATL_COORDS } from "../config/cesium";
import { getAirport } from "../data/airports";
import { getInterpolatedGeoState } from "../systems/interpolationSystem";
import { useAircraftStore } from "../store/useAircraftStore";

export const MIN_ZOOM_M = 80;
export const MAX_ZOOM_M = 12_000_000;
export const FLY_DURATION_S = 2.0;
export const FOLLOW_MIN_RANGE_M = 150;
export const FOLLOW_MAX_RANGE_M = 50_000;
export const FOLLOW_DEFAULT_RANGE_M = 1200;

const FLY_EASING = EasingFunction.QUADRATIC_IN_OUT;

let followOrbitRangeM = FOLLOW_DEFAULT_RANGE_M;
let lastFollowAircraftId: string | null = null;
let syncingFollowRange = false;

export function configureCameraController(viewer: Viewer): void {
  const ctrl = viewer.scene.screenSpaceCameraController;
  ctrl.enableCollisionDetection = true;
  ctrl.enableRotate = true;
  ctrl.enableTranslate = true;
  ctrl.enableZoom = true;
  ctrl.enableTilt = true;
  ctrl.enableLook = true;
  ctrl.minimumZoomDistance = MIN_ZOOM_M;
  ctrl.maximumZoomDistance = MAX_ZOOM_M;
  ctrl.inertiaZoom = 0.5;
  ctrl.inertiaSpin = 0.9;
  ctrl.inertiaTranslate = 0.9;
}

export function setFollowControllerMode(viewer: Viewer, follow: boolean): void {
  const ctrl = viewer.scene.screenSpaceCameraController;
  if (follow) {
    ctrl.enableTranslate = false;
    ctrl.enableLook = false;
    ctrl.enableRotate = true;
    ctrl.enableZoom = true;
    ctrl.enableTilt = true;
  } else {
    ctrl.enableTranslate = true;
    ctrl.enableLook = true;
    ctrl.enableRotate = true;
    ctrl.enableZoom = true;
    ctrl.enableTilt = true;
  }
}

export function releaseCameraLock(camera: Camera): void {
  camera.lookAtTransform(Matrix4.IDENTITY);
}

function clampFollowRange(range: number): number {
  return CesiumMath.clamp(range, FOLLOW_MIN_RANGE_M, FOLLOW_MAX_RANGE_M);
}

function getAircraftCenter(icao24: string): Cartesian3 | null {
  const ac = useAircraftStore.getState().aircraft[icao24];
  if (!ac) return null;
  const geo = getInterpolatedGeoState(ac);
  return Cartesian3.fromDegrees(geo.lon, geo.lat, geo.altMeters);
}

function syncFollowRangeFromCamera(viewer: Viewer, icao24: string): void {
  const center = getAircraftCenter(icao24);
  if (!center) return;
  const dist = Cartesian3.distance(viewer.camera.position, center);
  if (Number.isFinite(dist) && dist > 0) {
    followOrbitRangeM = clampFollowRange(dist);
  }
}

function resetFollowRangeForAircraft(icao24: string, viewer: Viewer): void {
  if (lastFollowAircraftId === icao24) return;
  lastFollowAircraftId = icao24;
  const center = getAircraftCenter(icao24);
  if (!center) {
    followOrbitRangeM = FOLLOW_DEFAULT_RANGE_M;
    return;
  }
  const dist = Cartesian3.distance(viewer.camera.position, center);
  followOrbitRangeM = clampFollowRange(
    Number.isFinite(dist) && dist > 0 ? dist : FOLLOW_DEFAULT_RANGE_M,
  );
}

function clampHeight(camera: Camera): void {
  const carto = camera.positionCartographic;
  const h = carto.height;
  if (h < MIN_ZOOM_M || h > MAX_ZOOM_M) {
    camera.position = Cartesian3.fromRadians(
      carto.longitude,
      carto.latitude,
      CesiumMath.clamp(h, MIN_ZOOM_M, MAX_ZOOM_M),
    );
  }
}

function smoothFly(
  camera: Camera,
  destination: Cartesian3,
  orientation?: { heading: number; pitch: number; roll: number },
  onComplete?: () => void,
): void {
  releaseCameraLock(camera);
  camera.flyTo({
    destination,
    orientation,
    duration: FLY_DURATION_S,
    easingFunction: FLY_EASING,
    complete: onComplete,
  });
}

export function flyToAirport(
  viewer: Viewer,
  airportId: string,
  onComplete?: () => void,
): void {
  const airport = getAirport(airportId);
  smoothFly(
    viewer.camera,
    Cartesian3.fromDegrees(airport.lon - 0.06, airport.lat - 0.05, 2800),
    {
      heading: CesiumMath.toRadians(30),
      pitch: CesiumMath.toRadians(-40),
      roll: 0,
    },
    onComplete,
  );
}

export function flyToAircraft(
  viewer: Viewer,
  lon: number,
  lat: number,
  altMeters: number,
  onGround: boolean,
  onComplete?: () => void,
): void {
  smoothFly(
    viewer.camera,
    Cartesian3.fromDegrees(
      lon - 0.008,
      lat - 0.008,
      Math.max(altMeters + (onGround ? 400 : 900), 500),
    ),
    {
      heading: CesiumMath.toRadians(20),
      pitch: CesiumMath.toRadians(-35),
      roll: 0,
    },
    onComplete,
  );
}

/** Orbit around aircraft; preserves user heading/pitch/range, updates center only. */
export function updateFollowOrbit(viewer: Viewer, icao24: string): void {
  const center = getAircraftCenter(icao24);
  if (!center) return;

  resetFollowRangeForAircraft(icao24, viewer);

  const { camera } = viewer;
  const transform = Transforms.eastNorthUpToFixedFrame(center);
  syncingFollowRange = true;
  camera.lookAtTransform(
    transform,
    new HeadingPitchRange(
      camera.heading,
      camera.pitch,
      followOrbitRangeM,
    ),
  );
  syncingFollowRange = false;
}

export function attachCameraSystem(viewer: Viewer): () => void {
  configureCameraController(viewer);

  let lastFlyToken = -1;
  let lastCameraMode: "free" | "follow" = "free";

  const processFlyRequest = () => {
    const state = useAircraftStore.getState();
    if (state.cameraFlyToken === lastFlyToken) return;
    lastFlyToken = state.cameraFlyToken;

    if (state.cameraFlyTarget === "aircraft" && state.cameraFlyTargetId) {
      const ac = state.aircraft[state.cameraFlyTargetId];
      if (ac) {
        const geo = getInterpolatedGeoState(ac);
        const onComplete =
          state.cameraMode === "follow"
            ? () => updateFollowOrbit(viewer, state.cameraFlyTargetId!)
            : undefined;
        flyToAircraft(
          viewer,
          geo.lon,
          geo.lat,
          geo.altMeters,
          ac.onGround,
          onComplete,
        );
      }
      return;
    }

    const airportId =
      state.cameraFlyTarget === "airport" && state.cameraFlyTargetId
        ? state.cameraFlyTargetId
        : state.activeAirportId;
    setFollowControllerMode(viewer, false);
    flyToAirport(viewer, airportId);
  };

  const onMoveEnd = () => {
    clampHeight(viewer.camera);
    const { cameraMode, selectedId } = useAircraftStore.getState();
    if (cameraMode === "follow" && selectedId) {
      syncFollowRangeFromCamera(viewer, selectedId);
    }
  };

  const onCameraChanged = () => {
    if (syncingFollowRange) return;
    const { cameraMode, selectedId } = useAircraftStore.getState();
    if (cameraMode === "follow" && selectedId) {
      syncFollowRangeFromCamera(viewer, selectedId);
    }
  };

  const onTick = () => {
    const { cameraMode, selectedId } = useAircraftStore.getState();

    if (cameraMode !== lastCameraMode) {
      if (cameraMode === "follow") {
        setFollowControllerMode(viewer, true);
        if (selectedId) {
          lastFollowAircraftId = null;
          updateFollowOrbit(viewer, selectedId);
        }
      } else {
        setFollowControllerMode(viewer, false);
        releaseCameraLock(viewer.camera);
        lastFollowAircraftId = null;
      }
      lastCameraMode = cameraMode;
    }

    if (cameraMode === "follow" && selectedId) {
      updateFollowOrbit(viewer, selectedId);
    }
  };

  const unsubStore = useAircraftStore.subscribe((state, prev) => {
    if (state.cameraFlyToken !== prev.cameraFlyToken) {
      processFlyRequest();
    }
    if (state.selectedId !== prev.selectedId && state.cameraMode === "follow") {
      lastFollowAircraftId = null;
    }
  });

  viewer.camera.moveEnd.addEventListener(onMoveEnd);
  viewer.camera.changed.addEventListener(onCameraChanged);
  viewer.clock.onTick.addEventListener(onTick);

  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(
      ATL_COORDS.lon,
      ATL_COORDS.lat,
      ATL_COORDS.alt,
    ),
    orientation: {
      heading: CesiumMath.toRadians(30),
      pitch: CesiumMath.toRadians(-40),
      roll: 0,
    },
  });
  lastFlyToken = useAircraftStore.getState().cameraFlyToken;

  return () => {
    viewer.camera.moveEnd.removeEventListener(onMoveEnd);
    viewer.camera.changed.removeEventListener(onCameraChanged);
    viewer.clock.onTick.removeEventListener(onTick);
    unsubStore();
    setFollowControllerMode(viewer, false);
    releaseCameraLock(viewer.camera);
  };
}
