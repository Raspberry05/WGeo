import { StatusBar } from "./StatusBar";
import { AircraftList } from "./AircraftList";
import { AircraftInspector } from "./AircraftInspector";
import { AirportPicker } from "./AirportPicker";
import { useAircraftStore } from "../../store/useAircraftStore";

export function HUD() {
  const setCameraMode = useAircraftStore((s) => s.setCameraMode);
  const cameraMode = useAircraftStore((s) => s.cameraMode);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const requestCameraFly = useAircraftStore((s) => s.requestCameraFly);
  const viewMode = useAircraftStore((s) => s.viewMode);

  return (
    <>
      <StatusBar />
      <AirportPicker />
      <AircraftList />
      <AircraftInspector />

      <div
        style={{
          position: "absolute",
          top: "44px",
          right: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          fontFamily: "monospace",
          fontSize: "10px",
          zIndex: 100,
        }}
      >
        {(["orbit", "tower"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setCameraMode(mode);
              if (mode === "tower") {
                requestCameraFly("airport", activeAirportId);
              }
            }}
            style={{
              padding: "5px 10px",
              background:
                cameraMode === mode ? "rgba(0,255,136,0.15)" : "rgba(0,8,16,0.88)",
              border: `1px solid ${cameraMode === mode ? "#00ff88" : "#1a3a2a"}`,
              color: cameraMode === mode ? "#00ff88" : "#4a6a5a",
              cursor: "pointer",
              borderRadius: "2px",
              letterSpacing: "1px",
            }}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {viewMode === "local" && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "216px",
            fontFamily: "monospace",
            fontSize: "9px",
            color: "#4a6a5a",
            letterSpacing: "0.5px",
            zIndex: 100,
          }}
        >
          HOLD SPACE · WASD · Q/E · MOUSE · SHIFT BOOST
        </div>
      )}
    </>
  );
}
