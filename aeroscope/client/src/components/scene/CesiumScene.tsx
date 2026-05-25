import { Viewer, Globe } from "resium";
import { useAircraftStore } from "../../store/useAircraftStore";
import { AircraftEntity } from "../aircraft/AircraftEntity";
import { CesiumCameraController } from "../camera/CesiumCameraController";
import { SpaceFreeCamera } from "../camera/SpaceFreeCamera";
import { AirportMarkers } from "./AirportMarkers";
import { MonochromeWorld } from "./MonochromeWorld";

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
        enableLighting={false}
        showGroundAtmosphere={false}
        showWaterEffect={false}
      />

      <MonochromeWorld />
      <AirportMarkers />

      {Object.values(aircraft).map((ac) => (
        <AircraftEntity key={ac.id} aircraft={ac} />
      ))}

      <CesiumCameraController />
      <SpaceFreeCamera />
    </Viewer>
  );
}
