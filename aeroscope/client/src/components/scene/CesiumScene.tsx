import { Cartesian3, Color } from "cesium";
import {
  Viewer,
  Globe,
  BlackAndWhiteStage,
  CameraFlyTo,
} from "resium";
import { useAircraftStore } from "../../store/useAircraftStore";
import { AircraftEntity } from "../aircraft/AircraftEntity";
import { CesiumCameraController } from "../camera/CesiumCameraController";
import { MonochromeWorld } from "./MonochromeWorld";
import { ATL_CENTER } from "../../utils/geoMath";

export function CesiumScene() {
  const aircraft = useAircraftStore((s) => s.aircraft);

  return (
    <Viewer
      full
      animation={false}
      timeline={false}
      fullscreenButton={false}
      geocoder={false}
      homeButton={false}
      sceneModePicker={false}
      baseLayerPicker={false}
      navigationHelpButton={false}
      infoBox={false}
      selectionIndicator={false}
      scene3DOnly
    >
      <Globe
        baseColor={Color.fromCssColorString("#111214")}
        enableLighting={false}
        showGroundAtmosphere={false}
      />

      <MonochromeWorld />
      <BlackAndWhiteStage gradations={4} />

      {Object.values(aircraft).map((ac) => (
        <AircraftEntity key={ac.id} aircraft={ac} />
      ))}

      <CesiumCameraController />

      <CameraFlyTo
        duration={0}
        destination={Cartesian3.fromDegrees(
          ATL_CENTER.lon - 0.08,
          ATL_CENTER.lat - 0.06,
          4500,
        )}
        orientation={{
          heading: 0.8,
          pitch: -0.55,
          roll: 0,
        }}
      />
    </Viewer>
  );
}
