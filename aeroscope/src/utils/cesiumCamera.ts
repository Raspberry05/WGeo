import {
  BoundingSphere,
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
import { useHudStore } from "../store/useHudStore";
import {
  HUD_INSPECTOR_WIDTH,
  HUD_MOBILE_BREAKPOINT_PX,
  HUD_SIDEBAR_WIDTH,
} from "../components/hud/hudTheme";

export const MIN_ZOOM_M = 80;
export const MAX_ZOOM_M = 12_000_000;
export const FLY_DURATION_S = 2.0;
export const FOLLOW_MIN_RANGE_M = 80;
export const FOLLOW_MAX_RANGE_M = 50_000;
/** Default chase distance when follow starts (m). */
export const FOLLOW_DEFAULT_RANGE_M = 420;

const FLY_EASING = EasingFunction.QUADRATIC_IN_OUT;
const FOLLOW_DEFAULT_HEADING = CesiumMath.toRadians(25);
const FOLLOW_DEFAULT_PITCH = CesiumMath.toRadians(-28);

type FollowView = {
  heading: number;
  pitch: number;
  range: number;
};

const defaultFollowView = (): FollowView => ({
  heading: FOLLOW_DEFAULT_HEADING,
  pitch: FOLLOW_DEFAULT_PITCH,
  range: FOLLOW_DEFAULT_RANGE_M,
});

let followView: FollowView = defaultFollowView();
let lastFollowAircraftId: string | null = null;
let syncingFollowTransform = false;

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

/**
 * Follow: orbit + zoom around the aircraft; no pan so the target stays the orbit axis.
 */
export function setFollowControllerMode(viewer: Viewer, follow: boolean): void {
  const ctrl = viewer.scene.screenSpaceCameraController;
  ctrl.enableRotate = true;
  ctrl.enableZoom = true;
  ctrl.enableTilt = true;
  ctrl.enableLook = false;
  ctrl.enableTranslate = !follow;
  ctrl.enableCollisionDetection = !follow;
}

export function releaseCameraLock(camera: Camera): void {
  camera.lookAtTransform(Matrix4.IDENTITY);
}

/** Release lookAt lock without changing the view (avoids camera jump to space). */
export function releaseCameraLockPreservePose(camera: Camera): void {
  if (Matrix4.equals(camera.transform, Matrix4.IDENTITY)) {
    return;
  }

  const position = Cartesian3.clone(camera.positionWC);
  const direction = Cartesian3.clone(camera.directionWC);
  const up = Cartesian3.clone(camera.upWC);

  camera.lookAtTransform(Matrix4.IDENTITY);
  camera.position = position;
  camera.direction = direction;
  camera.up = up;
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

function applyFollowTransform(
  viewer: Viewer,
  center: Cartesian3,
  view: FollowView,
): void {
  const transform = Transforms.eastNorthUpToFixedFrame(center);
  syncingFollowTransform = true;
  viewer.camera.lookAtTransform(
    transform,
    new HeadingPitchRange(view.heading, view.pitch, view.range),
  );
  syncingFollowTransform = false;
}

/**
 * Re-lock the camera to the aircraft center using the current orbit offsets.
 * Runs each preRender so user rotate/zoom from the prior frame are preserved.
 */
function exitFollowMode(viewer: Viewer): void {
  const state = useAircraftStore.getState();
  if (state.cameraMode !== "follow") return;

  releaseCameraLockPreservePose(viewer.camera);
  setFollowControllerMode(viewer, false);
  lastFollowAircraftId = null;
  useAircraftStore.getState().setCameraMode("free");
}

/** User ended follow (drag or click); keeps selection and camera pose. */
export function exitFollowFromUser(viewer: Viewer): void {
  exitFollowMode(viewer);
}

function updateFollowCamera(viewer: Viewer, icao24: string): void {
  const center = getAircraftCenter(icao24);
  if (!center) return;

  const { camera } = viewer;
  const range = Cartesian3.distance(camera.position, center);

  if (Number.isFinite(range) && range > 0) {
    followView = {
      heading: camera.heading,
      pitch: camera.pitch,
      range: clampFollowRange(range),
    };
  }

  applyFollowTransform(viewer, center, followView);
}

/** Exit follow when the user drags or rotates the globe (not programmatic camera moves). */
function attachFollowInteractionExit(viewer: Viewer): () => void {
  const canvas = viewer.scene.canvas;
  let userGestureActive = false;

  const markUserGesture = (): void => {
    userGestureActive = true;
  };
  const clearUserGesture = (): void => {
    userGestureActive = false;
  };

  const onMoveStart = (): void => {
    if (!userGestureActive || syncingFollowTransform) return;
    if (useAircraftStore.getState().cameraMode !== "follow") return;
    exitFollowMode(viewer);
    clearUserGesture();
  };

  canvas.addEventListener("pointerdown", markUserGesture);
  canvas.addEventListener("pointerup", clearUserGesture);
  canvas.addEventListener("pointercancel", clearUserGesture);
  const removeMoveStart = viewer.camera.moveStart.addEventListener(onMoveStart);

  return () => {
    canvas.removeEventListener("pointerdown", markUserGesture);
    canvas.removeEventListener("pointerup", clearUserGesture);
    canvas.removeEventListener("pointercancel", clearUserGesture);
    removeMoveStart();
  };
}

function beginFollowAircraft(viewer: Viewer, icao24: string): void {
  lastFollowAircraftId = icao24;
  followView = defaultFollowView();

  const center = getAircraftCenter(icao24);
  if (center) {
    applyFollowTransform(viewer, center, followView);
  }
}

/** Snap orbit to default close chase on the current aircraft. */
export function updateFollowOrbit(viewer: Viewer, icao24: string): void {
  beginFollowAircraft(viewer, icao24);
}

export function attachCameraSystem(viewer: Viewer): () => void {
  configureCameraController(viewer);

  let lastFlyToken = -1;

  const processFlyRequest = () => {
    const state = useAircraftStore.getState();
    if (state.cameraFlyToken === lastFlyToken) return;
    lastFlyToken = state.cameraFlyToken;

    if (state.cameraFlyTarget === "aircraft" && state.cameraFlyTargetId) {
      const icao24 = state.cameraFlyTargetId;

      if (state.cameraMode === "follow") {
        beginFollowAircraft(viewer, icao24);
        return;
      }

      const ac = state.aircraft[icao24];
      if (ac) {
        const geo = getInterpolatedGeoState(ac);
        flyToAircraft(
          viewer,
          geo.lon,
          geo.lat,
          geo.altMeters,
          ac.onGround,
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

  const onPreRender = () => {
    const { cameraMode, selectedId } = useAircraftStore.getState();
    if (cameraMode !== "follow" || !selectedId) return;

    if (selectedId !== lastFollowAircraftId) {
      beginFollowAircraft(viewer, selectedId);
    }

    updateFollowCamera(viewer, selectedId);
  };

  const onMoveEnd = () => {
    if (syncingFollowTransform) return;
    clampHeight(viewer.camera);
  };

  const unsubStore = useAircraftStore.subscribe((state, prev) => {
    if (state.cameraFlyToken !== prev.cameraFlyToken) {
      processFlyRequest();
    }

    if (state.cameraMode !== prev.cameraMode) {
      if (state.cameraMode === "follow") {
        setFollowControllerMode(viewer, true);
        if (state.selectedId) {
          beginFollowAircraft(viewer, state.selectedId);
        }
      } else if (prev.cameraMode === "follow") {
        setFollowControllerMode(viewer, false);
        releaseCameraLockPreservePose(viewer.camera);
        lastFollowAircraftId = null;
      }
    }

    if (
      state.selectedId !== prev.selectedId &&
      state.cameraMode === "follow" &&
      state.selectedId
    ) {
      beginFollowAircraft(viewer, state.selectedId);
    }
  });

  viewer.scene.preRender.addEventListener(onPreRender);
  viewer.camera.moveEnd.addEventListener(onMoveEnd);
  const removeFollowExit = attachFollowInteractionExit(viewer);

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

  if (useAircraftStore.getState().cameraMode === "follow") {
    setFollowControllerMode(viewer, true);
    const id = useAircraftStore.getState().selectedId;
    if (id) beginFollowAircraft(viewer, id);
  }

  return () => {
    viewer.scene.preRender.removeEventListener(onPreRender);
    viewer.camera.moveEnd.removeEventListener(onMoveEnd);
    removeFollowExit();
    unsubStore();
    setFollowControllerMode(viewer, false);
    releaseCameraLock(viewer.camera);
    lastFollowAircraftId = null;
  };
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

type UiInsetsPx = { left: number; right: number; top: number; bottom: number };

function resolveUiInsetsPx(): UiInsetsPx {
  if (typeof window === "undefined") return { left: 0, right: 0, top: 0, bottom: 0 };

  const isMobile = window.innerWidth <= HUD_MOBILE_BREAKPOINT_PX;
  const top = useHudStore.getState().statusBarHeight ?? 0;

  // Sidebar is always present on desktop; on mobile it can slide out.
  const left = isMobile ? 0 : HUD_SIDEBAR_WIDTH + 16;

  // Aircraft inspector only shows when an aircraft is selected (desktop).
  const hasInspector = !isMobile && Boolean(useAircraftStore.getState().selectedId);
  const right = hasInspector ? HUD_INSPECTOR_WIDTH + 24 : 0;

  // Bottom-right layer controls + safe area.
  const bottom = 96;

  return { left, right, top, bottom };
}

/** Slight heading bias so the target lands near the HUD-visible center (not full canvas). */
function airportFlyHeadingRad(viewer: Viewer): number {
  const base = CesiumMath.toRadians(30);
  if (typeof window === "undefined") return base;

  const insets = resolveUiInsetsPx();
  const rect = viewer.scene.canvas.getBoundingClientRect();
  const usableW = Math.max(1, rect.width - insets.left - insets.right);
  const bias = ((insets.left - insets.right) / usableW) * 0.4;
  return base + bias;
}

export function flyToAirport(
  viewer: Viewer,
  airportId: string,
  onComplete?: () => void,
): void {
  const airport = getAirport(airportId);
  const targetWorld = Cartesian3.fromDegrees(airport.lon, airport.lat, 0);
  const rangeM = 3200;
  const heading = airportFlyHeadingRad(viewer);
  const pitch = CesiumMath.toRadians(-40);

  releaseCameraLock(viewer.camera);
  viewer.camera.flyToBoundingSphere(
    new BoundingSphere(targetWorld, 120),
    {
      offset: new HeadingPitchRange(heading, pitch, rangeM),
      duration: FLY_DURATION_S,
      easingFunction: FLY_EASING,
      complete: onComplete,
    },
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
  const range = onGround ? 650 : 1100;
  smoothFly(
    viewer.camera,
    Cartesian3.fromDegrees(lon, lat, altMeters + range * 0.35),
    {
      heading: FOLLOW_DEFAULT_HEADING,
      pitch: FOLLOW_DEFAULT_PITCH,
      roll: 0,
    },
    onComplete,
  );
}
