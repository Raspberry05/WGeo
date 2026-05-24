import { useEffect, useRef } from "react";
import { SceneRoot } from "./components/scene/SceneRoot";
import { HUD } from "./components/hud/HUD";
import { startAircraftSystem } from "./systems/aircraftSystem";

export default function App() {
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    startAircraftSystem().then((fn) => {
      cleanup = fn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#020a0e",
      }}
    >
      <SceneRoot />
      <HUD />
    </div>
  );
}
