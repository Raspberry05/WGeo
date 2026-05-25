import { enrichSelectedAircraft } from "../../services/aircraftEnrichment";
import {
  passesCategoryFilter,
  useAircraftStore,
} from "../../store/useAircraftStore";
import { formatAltitudeFeet, formatSpeedKnots } from "../../utils/flightUnits";
import {
  hudMuted,
  hudPanelStyle,
  HUD_FONT_MD,
  HUD_FONT_SM,
  hudText,
} from "./hudTheme";

const STATUS_COLORS: Record<string, string> = {
  airborne: "#00ff88",
  landing: "#ffaa00",
  taxiing: "#00aaff",
  parked: "#666666",
};

export function AircraftList() {
  const aircraft = useAircraftStore((s) => s.aircraft);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const categoryFilter = useAircraftStore((s) => s.categoryFilter);
  const selectAircraft = useAircraftStore((s) => s.selectAircraft);
  const requestCameraFly = useAircraftStore((s) => s.requestCameraFly);

  const list = Object.values(aircraft)
    .filter((ac) =>
      passesCategoryFilter(
        ac.categoryCode === null ? -1 : ac.categoryCode,
        categoryFilter,
      ),
    )
    .sort((a, b) => b.altitudeMeters - a.altitudeMeters);

  return (
    <div
      style={{
        ...hudPanelStyle,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        fontSize: HUD_FONT_SM,
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #1a3a2a",
          color: hudText,
          fontSize: HUD_FONT_SM,
          letterSpacing: "1px",
          flexShrink: 0,
        }}
      >
        TRAFFIC · {list.length}
      </div>

      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        {list.map((ac) => {
          const color = STATUS_COLORS[ac.status] ?? "#ffffff";
          const isSelected = ac.id === selectedId;

          return (
            <div
              key={ac.id}
              onClick={() => {
                if (isSelected) {
                  selectAircraft(null);
                } else {
                  selectAircraft(ac.id);
                  requestCameraFly("aircraft", ac.id);
                  void enrichSelectedAircraft(ac.id);
                }
              }}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #0d1f10",
                cursor: "pointer",
                background: isSelected ? "rgba(0,255,136,0.08)" : "transparent",
                borderLeft: isSelected
                  ? `3px solid ${color}`
                  : "3px solid transparent",
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
                    fontSize: HUD_FONT_MD,
                  }}
                >
                  {ac.callsign}
                </div>
                <div
                  style={{
                    color: hudMuted,
                    fontSize: HUD_FONT_SM,
                    marginTop: "2px",
                  }}
                >
                  {ac.status.toUpperCase()}
                </div>
                <div style={{ color: hudMuted, fontSize: HUD_FONT_SM }}>
                  {ac.aircraftType.toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: "right", color: hudText }}>
                {formatAltitudeFeet(ac.altitudeMeters)}
                <div style={{ fontSize: HUD_FONT_SM, color: hudMuted }}>
                  {formatSpeedKnots(ac.velocity)}
                </div>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ padding: "16px 12px", color: hudMuted }}>
            No aircraft in range
          </div>
        )}
      </div>
    </div>
  );
}
