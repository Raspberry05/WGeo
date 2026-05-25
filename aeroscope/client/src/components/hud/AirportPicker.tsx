import { getAllAirports } from "../../data/airports";
import { useAircraftStore } from "../../store/useAircraftStore";

export function AirportPicker() {
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const setActiveAirport = useAircraftStore((s) => s.setActiveAirport);
  const requestCameraFly = useAircraftStore((s) => s.requestCameraFly);

  return (
    <div
      style={{
        position: "absolute",
        top: "44px",
        left: "8px",
        width: "200px",
        maxHeight: "320px",
        overflowY: "auto",
        background: "rgba(0,8,16,0.92)",
        border: "1px solid #1a3a2a",
        borderRadius: "2px",
        fontFamily: "monospace",
        fontSize: "10px",
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: "8px 10px",
          borderBottom: "1px solid #1a3a2a",
          color: "#4a6a5a",
          letterSpacing: "1px",
        }}
      >
        AIRPORTS
      </div>
      {getAllAirports().map((airport) => {
        const isActive = airport.id === activeAirportId;
        return (
          <button
            key={airport.id}
            type="button"
            onClick={() => {
              setActiveAirport(airport.id);
              requestCameraFly("airport", airport.id);
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 10px",
              textAlign: "left",
              background: isActive ? "rgba(0,255,136,0.12)" : "transparent",
              border: "none",
              borderBottom: "1px solid #0d1f10",
              color: isActive ? "#00ff88" : "#7a9a8a",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: "bold", letterSpacing: "0.5px" }}>
              {airport.id}
            </div>
            <div
              style={{
                color: isActive ? "#5a8a6a" : "#4a5a5a",
                fontSize: "9px",
                marginTop: "2px",
              }}
            >
              {airport.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}
