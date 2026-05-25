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
      } else {
        setFollowControllerMode(viewer, false);
        releaseCameraLock(viewer.camera);
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
