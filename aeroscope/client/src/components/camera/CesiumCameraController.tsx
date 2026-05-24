import { useEffect } from "react";
import { Cartesian3, Math as CesiumMath } from "cesium";
import { CameraFlyTo, useCesium } from "resium";
import { useAircraftStore } from "../../store/useAircraftStore";
import { getInterpolatedGeoState } from "../../systems/interpolationSystem";
import { ATL_CENTER } from "../../utils/geoMath";

export function CesiumCameraController() {
  const { viewer } = useCesium();
  const cameraMode = useAircraftStore((s) => s.cameraMode);
  const selectedId = useAircraftStore((s) => s.selectedId);

  useEffect(() => {
    if (!viewer) return;
    viewer.trackedEntity = undefined;
  }, [viewer, cameraMode, selectedId]);

  useEffect(() => {
    if (!viewer || cameraMode !== "follow" || !selectedId) return;

    let frameId = 0;

    const tick = () => {
      const ac = useAircraftStore.getState().aircraft[selectedId];
      if (ac) {
        const geo = getInterpolatedGeoState(ac);
        const target = Cartesian3.fromDegrees(geo.lon, geo.lat, geo.altMeters);
        const offset = new Cartesian3(-800, -600, 400);
        viewer.camera.lookAt(target, offset);
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [viewer, cameraMode, selectedId]);

  if (cameraMode === "tower") {
    return (
      <CameraFlyTo
        duration={1.5}
        destination={Cartesian3.fromDegrees(
          ATL_CENTER.lon,
          ATL_CENTER.lat,
          2800,
        )}
        orientation={{
          heading: CesiumMath.toRadians(25),
          pitch: CesiumMath.toRadians(-45),
          roll: 0,
        }}
      />
    );
  }

  return null;
}
