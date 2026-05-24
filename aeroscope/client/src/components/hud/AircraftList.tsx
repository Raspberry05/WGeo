import { useAircraftStore } from "../../store/useAircraftStore";

const STATUS_COLORS: Record<string, string> = {
  airborne: "#00ff88",
  landing: "#ffaa00",
  taxiing: "#00aaff",
  parked: "#666666",
};

export function AircraftList() {
  const aircraft = useAircraftStore((s) => s.aircraft);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const selectAircraft = useAircraftStore((s) => s.selectAircraft);

  const list = Object.values(aircraft).sort((a, b) => b.altitude - a.altitude);

  return (
    <div
      style={{
        position: "absolute",
        top: "44px",
        left: "8px",
        width: "200px",
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
        background: "rgba(0,8,16,0.88)",
        border: "1px solid #1a3a2a",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "11px",
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: "6px 10px",
          borderBottom: "1px solid #1a3a2a",
          color: "#7a9a8a",
          fontSize: "10px",
          letterSpacing: "1px",
        }}
      >
        TRAFFIC · {list.length}
      </div>

      {list.map((ac) => {
        const color = STATUS_COLORS[ac.status] ?? "#ffffff";
        const isSelected = ac.id === selectedId;

        return (
          <div
            key={ac.id}
            onClick={() => selectAircraft(isSelected ? null : ac.id)}
            style={{
              padding: "5px 10px",
              borderBottom: "1px solid #0d1f10",
              cursor: "pointer",
              background: isSelected ? "rgba(0,255,136,0.08)" : "transparent",
              borderLeft: isSelected
                ? `2px solid ${color}`
                : "2px solid transparent",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "background 0.15s",
            }}
          >
            <div>
              <div
                style={{
                  color: isSelected ? color : "#ccddcc",
                  fontWeight: "bold",
                }}
              >
                {ac.callsign}
              </div>
              <div
                style={{ color: "#4a6a5a", fontSize: "9px", marginTop: "1px" }}
              >
                {ac.status.toUpperCase()}
              </div>
              <div style={{ color: "#4a6a5a", fontSize: "9px" }}>
                {ac.aircraftType.toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: "right", color: "#7a9a8a" }}>
              <div>{Math.round(ac.altitude).toLocaleString()}ft</div>
              <div style={{ fontSize: "9px", color: "#4a6a5a" }}>
                {Math.round(ac.velocity)}kts
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
