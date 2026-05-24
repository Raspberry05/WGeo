import { useAircraftStore } from "../../store/useAircraftStore";

export function AircraftInspector() {
  const selectedId = useAircraftStore((s) => s.selectedId);
  const aircraft = useAircraftStore((s) => s.aircraft);
  const setCameraMode = useAircraftStore((s) => s.setCameraMode);
  const cameraMode = useAircraftStore((s) => s.cameraMode);

  const ac = selectedId ? aircraft[selectedId] : null;
  if (!ac) return null;

  const STATUS_COLORS: Record<string, string> = {
    airborne: "#00ff88",
    landing: "#ffaa00",
    taxiing: "#00aaff",
    parked: "#666666",
  };
  const color = STATUS_COLORS[ac.status] ?? "#ffffff";

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        borderBottom: "1px solid #0d1f10",
      }}
    >
      <span style={{ color: "#4a6a5a", fontSize: "10px" }}>{label}</span>
      <span
        style={{ color: "#ccddcc", fontFamily: "monospace", fontSize: "11px" }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        left: "8px",
        width: "200px",
        background: "rgba(0,8,16,0.92)",
        border: `1px solid ${color}44`,
        borderTop: `2px solid ${color}`,
        borderRadius: "4px",
        padding: "10px",
        fontFamily: "monospace",
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            color,
            fontSize: "14px",
            fontWeight: "bold",
            letterSpacing: "1px",
          }}
        >
          {ac.callsign}
        </div>
        <div style={{ color: "#4a6a5a", fontSize: "9px" }}>
          {ac.icao24.toUpperCase()}
        </div>
      </div>

      <Field label="STATUS" value={ac.status.toUpperCase()} />
      <Field label="CATEGORY" value={ac.aircraftType.toUpperCase()} />

      <Field
        label="ALTITUDE"
        value={`${Math.round(ac.altitude).toLocaleString()} ft`}
      />
      <Field label="SPEED" value={`${Math.round(ac.velocity)} kts`} />
      <Field label="HEADING" value={`${Math.round(ac.heading)}°`} />
      <Field label="LAT" value={ac.rawLat.toFixed(4)} />
      <Field label="LON" value={ac.rawLon.toFixed(4)} />

      {/* Follow camera toggle */}
      <button
        onClick={() =>
          setCameraMode(cameraMode === "follow" ? "orbit" : "follow")
        }
        style={{
          marginTop: "8px",
          width: "100%",
          padding: "5px",
          background: cameraMode === "follow" ? `${color}22` : "transparent",
          border: `1px solid ${color}66`,
          color,
          fontFamily: "monospace",
          fontSize: "10px",
          cursor: "pointer",
          borderRadius: "2px",
          letterSpacing: "1px",
        }}
      >
        {cameraMode === "follow" ? "◉ FOLLOWING" : "○ FOLLOW"}
      </button>
    </div>
  );
}
