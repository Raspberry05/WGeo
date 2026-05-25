import { getAirport } from "../../data/airports";
import { useAircraftStore } from "../../store/useAircraftStore";

export function StatusBar() {
  const status = useAircraftStore((s) => s.connectionStatus);
  const count = useAircraftStore((s) => Object.keys(s.aircraft).length);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const airport = getAirport(activeAirportId);

  const color =
    status === "LIVE"
      ? "#00ff88"
      : status === "SIMULATED"
        ? "#888a94"
        : "#404248";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "36px",
        background: "rgba(0,8,16,0.92)",
        borderBottom: "1px solid #1a3a2a",
        display: "flex",
        alignItems: "center",
        padding: "0 16px 0 216px",
        gap: "24px",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#7a9a8a",
        zIndex: 100,
      }}
    >
      <span
        style={{
          color: "#00ff88",
          fontWeight: "bold",
          letterSpacing: "2px",
          fontSize: "13px",
        }}
      >
        ✈ AEROSCOPE
      </span>

      <div style={{ width: "1px", height: "20px", background: "#1a3a2a" }} />

      <span>
        {airport.id} · {airport.name.toUpperCase()}
      </span>

      <div style={{ flex: 1 }} />

      <span>{count} AIRCRAFT</span>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: status === "LIVE" ? "pulse 1.5s infinite" : "none",
          }}
        />
        <span style={{ color }}>{status}</span>
      </div>
    </div>
  );
}
