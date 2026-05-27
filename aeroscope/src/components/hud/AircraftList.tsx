import { MdAirplanemodeActive, MdHeight, MdSpeed } from "react-icons/md";
import { enrichSelectedAircraft } from "../../services/aircraftEnrichment";
import {
  passesClassFilter,
  passesWakeFilter,
  useAircraftStore,
} from "../../store/useAircraftStore";
import { formatAltitudeFeet, formatSpeedKnots } from "../../utils/flightUnits";
import { AircraftStatusIcon } from "./AircraftStatusIcon";
import { HudIcon } from "./HudIcon";
import { HudPanel } from "./HudPanel";
import { hudMuted, HUD_FONT_MD, HUD_FONT_SM, hudText } from "./hudTheme";

const STATUS_COLORS: Record<string, string> = {
  airborne: "#00ff88",
  landing: "#ffaa00",
  taxiing: "#00aaff",
  parked: "#666666",
};

export function AircraftList() {
  const aircraft = useAircraftStore((s) => s.aircraft);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const classFilter = useAircraftStore((s) => s.classFilter);
  const wakeFilter = useAircraftStore((s) => s.wakeFilter);
  const selectAircraft = useAircraftStore((s) => s.selectAircraft);
  const requestCameraFly = useAircraftStore((s) => s.requestCameraFly);

  const list = Object.values(aircraft)
    .filter(
      (ac) =>
        passesClassFilter(ac.aircraftClass, classFilter) &&
        passesWakeFilter(ac.wakeCategory, wakeFilter),
    )
    .sort((a, b) => b.altitudeMeters - a.altitudeMeters);

  return (
    <HudPanel
      panelId="aircraft-list"
      title={`TRAFFIC · ${list.length}`}
      titleIcon={MdAirplanemodeActive}
      minimizedSummary={`${list.length} in view`}
      flex={1}
      minHeight="140px"
    >
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
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <AircraftStatusIcon status={ac.status} size={14} color={color} />
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
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "4px",
                  }}
                >
                  <HudIcon icon={MdHeight} size={12} muted />
                  {formatAltitudeFeet(ac.altitudeMeters)}
                </span>
                <div
                  style={{
                    fontSize: HUD_FONT_SM,
                    color: hudMuted,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "4px",
                    marginTop: "2px",
                  }}
                >
                  <HudIcon icon={MdSpeed} size={12} muted />
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
    </HudPanel>
  );
}
