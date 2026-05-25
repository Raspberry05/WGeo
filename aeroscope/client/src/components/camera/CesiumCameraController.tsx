import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Matrix4,
} from "cesium";
import { useCesium } from "resium";
import { useAircraftStore } from "../../store/useAircraftStore";
import { getInterpolatedGeoState } from "../../systems/interpolationSystem";
import {
  applyLookAtTransform,
  clearLookAtTransform,
  flyToAirportView,
  flyToGlobeView,
  getAirportCenter,
  getLookAtOffset,
  isGlobeView,
} from "../../utils/cameraFocus";

export function CesiumCameraController() {
  const { viewer } = useCesium();
  const cameraMode = useAircraftStore((s) => s.cameraMode);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const cameraFlyToken = useAircraftStore((s) => s.cameraFlyToken);
  const cameraFlyTarget = useAircraftStore((s) => s.cameraFlyTarget);
  const cameraFlyTargetId = useAircraftStore((s) => s.cameraFlyTargetId);
  const setViewMode = useAircraftStore((s) => s.setViewMode);

  const lastFlyTokenRef = useRef(-1);
  const initialFlyDoneRef = useRef(false);

  useEffect(() => {
    if (!viewer) return;
    viewer.trackedEntity = undefined;
  }, [viewer, cameraMode, selectedId]);

  useEffect(() => {
    if (!viewer) return;

    if (!initialFlyDoneRef.current) {
      initialFlyDoneRef.current = true;
      flyToAirportView(viewer.camera, activeAirportId, 0);
      lastFlyTokenRef.current = cameraFlyToken;
      return;
    }

    if (cameraFlyToken === lastFlyTokenRef.current) return;
    lastFlyTokenRef.current = cameraFlyToken;

    if (cameraFlyTarget === "globe") {
      flyToGlobeView(viewer.camera);
      return;
    }

    if (cameraFlyTarget === "aircraft" && cameraFlyTargetId) {
      const ac = useAircraftStore.getState().aircraft[cameraFlyTargetId];
      if (ac) {
        const geo = getInterpolatedGeoState(ac);
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            geo.lon - 0.01,
            geo.lat - 0.01,
            Math.max(geo.altMeters + 800, 500),
          ),
          duration: 1.2,
        });
      }
      return;
    }

    const airportId =
      cameraFlyTarget === "airport" && cameraFlyTargetId
        ? cameraFlyTargetId
        : activeAirportId;
    flyToAirportView(viewer.camera, airportId);
  }, [
    viewer,
    cameraFlyToken,
    cameraFlyTarget,
    cameraFlyTargetId,
    activeAirportId,
  ]);

  useEffect(() => {
    if (!viewer) return;

    const onPostRender = () => {
      const { camera } = viewer;
      const state = useAircraftStore.getState();
      const globe = isGlobeView(camera.position, state.activeAirportId);
      const nextViewMode = globe ? "globe" : "local";

      if (state.viewMode !== nextViewMode) {
        setViewMode(nextViewMode);
      }

      if (state.cameraMode === "follow" && state.selectedId) {
        const ac = state.aircraft[state.selectedId];
        if (ac) {
          const geo = getInterpolatedGeoState(ac);
          const target = Cartesian3.fromDegrees(
            geo.lon,
            geo.lat,
            geo.altMeters,
          );
          applyLookAtTransform(
            camera,
            target,
            getLookAtOffset("aircraft"),
          );
        }
        return;
      }

      if (globe) {
        clearLookAtTransform(camera);
        return;
      }

      if (
        state.cameraFlyTarget === "aircraft" &&
        state.selectedId &&
        state.aircraft[state.selectedId]
      ) {
        const ac = state.aircraft[state.selectedId];
        const geo = getInterpolatedGeoState(ac);
        const target = Cartesian3.fromDegrees(geo.lon, geo.lat, geo.altMeters);
        applyLookAtTransform(camera, target, getLookAtOffset("aircraft"));
        return;
      }

      const center = getAirportCenter(state.activeAirportId, 0);
      applyLookAtTransform(camera, center, getLookAtOffset("airport"));
    };

    viewer.scene.postRender.addEventListener(onPostRender);
    return () => {
      viewer.scene.postRender.removeEventListener(onPostRender);
      clearLookAtTransform(viewer.camera);
    };
  }, [viewer, setViewMode]);

  return null;
}
