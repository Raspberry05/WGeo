import { useAircraftStore } from "../../store/useAircraftStore";
import {
  formatDistanceToAirport,
  routeDistanceNm,
} from "../../utils/aircraftDistance";
import {
  AirportFlag,
  CountryFlagByName,
} from "../../utils/countryFlags";
import {
  estimateMassKg,
  formatAltitudeFeet,
  formatSpeedKnots,
  formatUtcDateTime,
} from "../../utils/flightUnits";
import { AlternatingWeight } from "./AlternatingWeight";
import {
  hudMuted,
  hudPanelStyle,
  HUD_FONT_LG,
  HUD_FONT_MD,
  HUD_FONT_SM,
  HUD_INSPECTOR_WIDTH,
  HUD_SIDEBAR_WIDTH,
} from "./hudTheme";

export function AircraftInspector() {
  const selectedId = useAircraftStore((s) => s.selectedId);
  const aircraft = useAircraftStore((s) => s.aircraft);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
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

  const brand = ac.aircraftModel ?? ac.operatorName ?? "—";
  const origin = ac.originAirport?.toUpperCase() ?? "—";
  const dest = ac.destinationAirport?.toUpperCase() ?? "—";
  const routeNm = routeDistanceNm(ac.originAirport, ac.destinationAirport);
  const massKg = estimateMassKg(ac.categoryCode);

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | React.ReactNode;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid #0d1f10",
        gap: "10px",
      }}
    >
      <span style={{ color: hudMuted, fontSize: HUD_FONT_SM }}>{label}</span>
      <span
        style={{
          color: "#ccddcc",
          fontFamily: "monospace",
          fontSize: HUD_FONT_MD,
        }}
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
        left: HUD_SIDEBAR_WIDTH + 16,
        width: HUD_INSPECTOR_WIDTH,
        zIndex: 101,
        ...hudPanelStyle,
        border: `1px solid ${color}44`,
        borderTop: `3px solid ${color}`,
        padding: "14px",
        fontFamily: "monospace",
        pointerEvents: "auto",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CountryFlagByName countryName={ac.originCountry} size={24} />
          <div>
            <div
              style={{
                color,
                fontSize: HUD_FONT_LG,
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              {ac.callsign}
            </div>
            <div style={{ color: hudMuted, fontSize: HUD_FONT_SM }}>
              {ac.icao24.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <Field label="CATEGORY" value={ac.aircraftType} />
      <Field label="BRAND / TYPE" value={brand} />
      <Field
        label="ROUTE"
        value={
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <AirportFlag icao={ac.originAirport} />
            {origin}
            <span style={{ color: hudMuted }}>→</span>
            <AirportFlag icao={ac.destinationAirport} />
            {dest}
          </span>
        }
      />
      {routeNm !== null && (
        <Field
          label="ROUTE DIST"
          value={`${routeNm < 10 ? routeNm.toFixed(1) : Math.round(routeNm)} NM`}
        />
      )}
      <Field
        label="FROM FIELD"
        value={formatDistanceToAirport(ac.rawLat, ac.rawLon, activeAirportId)}
      />
      <Field label="COUNTRY" value={ac.originCountry || "—"} />
      <Field label="STATUS" value={ac.status.toUpperCase()} />
      <Field label="ALTITUDE" value={formatAltitudeFeet(ac.altitudeMeters)} />
      <Field label="SPEED" value={formatSpeedKnots(ac.velocity)} />
      <Field label="HEADING" value={`${Math.round(ac.heading)}°`} />
      <Field
        label="WEIGHT (EST)"
        value={<AlternatingWeight massKg={massKg} />}
      />
      <Field label="LAST FIX" value={formatUtcDateTime(ac.lastUpdated)} />

      <button
        type="button"
        onClick={() =>
          setCameraMode(cameraMode === "follow" ? "free" : "follow")
        }
        style={{
          marginTop: "12px",
          width: "100%",
          padding: "10px",
          background: cameraMode === "follow" ? `${color}22` : "transparent",
          border: `1px solid ${color}66`,
          color,
          fontFamily: "monospace",
          fontSize: HUD_FONT_SM,
          cursor: "pointer",
          borderRadius: "4px",
          letterSpacing: "1px",
        }}
      >
        {cameraMode === "follow" ? "FOLLOWING" : "FOLLOW"}
      </button>
    </div>
  );
}
