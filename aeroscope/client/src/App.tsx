import { useEffect, useRef } from "react";
import { AircraftEntities } from "./components/cesium/AircraftEntities";
import { AirportEntities } from "./components/cesium/AirportEntities";
import { CesiumViewer } from "./components/cesium/CesiumViewer";
import { ScenePickHandler } from "./components/cesium/ScenePickHandler";
import { HUD } from "./components/hud/HUD";
import { startAircraftSystem } from "./systems/aircraftSystem";

export default function App() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    startAircraftSystem().then((cleanup) => {
      cleanupRef.current = cleanup;
    });
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#0d0d0f",
      }}
    >
      <CesiumViewer />
      <AircraftEntities />
      <AirportEntities />
      <ScenePickHandler />
      <HUD />
    </div>
  );
}
