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
import { formatRouteSummary } from "../../utils/routeDisplay";
import { AlternatingWeight } from "./AlternatingWeight";
import { InspectorField } from "./InspectorField";
import {
  hexWithAlpha,
  hudMuted,
  hudPanelStyle,
  HUD_FONT_LG,
  HUD_FONT_SM,
  HUD_TOUCH_MIN,
  inspectorLayout,
} from "./hudTheme";

export interface AircraftInspectorProps {
  isMobile: boolean;
}

export function AircraftInspector({ isMobile }: AircraftInspectorProps) {
  const selectedId = useAircraftStore((s) => s.selectedId);
  const aircraft = useAircraftStore((s) => s.aircraft);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const setCameraMode = useAircraftStore((s) => s.setCameraMode);
  const cameraMode = useAircraftStore((s) => s.cameraMode);

  const ac = selectedId ? aircraft[selectedId] : null;
  if (!ac) return null;

  const layout = inspectorLayout(isMobile);

  const STATUS_COLORS: Record<string, string> = {
    airborne: "#00ff88",
    landing: "#ffaa00",
    taxiing: "#00aaff",
    parked: "#666666",
  };
  const color = STATUS_COLORS[ac.status] ?? "#ffffff";

  const brand = ac.aircraftModel ?? ac.operatorName ?? "—";
  const { origin, destination, hasAnyRoute } = formatRouteSummary(
    ac.originAirport,
    ac.destinationAirport,
    ac.onGround,
  );
  const routeNm = routeDistanceNm(ac.originAirport, ac.destinationAirport);
  const massKg = estimateMassKg(ac.categoryCode);

  return (
    <div
      className="hud-inspector"
      style={{
        position: "absolute",
        bottom: layout.bottom,
        left: layout.left,
        right: layout.right,
        width: layout.width,
        maxHeight: layout.maxHeight,
        overflowY: isMobile ? "auto" : undefined,
        zIndex: 101,
        ...hudPanelStyle,
        border: `1px solid ${hexWithAlpha(color, "44")}`,
        borderTop: `3px solid ${color}`,
        padding: "14px",
        paddingBottom: isMobile
          ? "max(14px, env(safe-area-inset-bottom))"
          : "14px",
        fontFamily: "monospace",
        pointerEvents: "auto",
        borderRadius: isMobile ? "12px 12px 0 0" : hudPanelStyle.borderRadius,
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

      <InspectorField label="CATEGORY" value={ac.aircraftType} />
      <InspectorField label="BRAND / TYPE" value={brand} />
      <InspectorField
        label="ROUTE"
        value={
          hasAnyRoute ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <AirportFlag icao={ac.originAirport} />
              {origin}
              <span style={{ color: hudMuted }}>→</span>
              <AirportFlag icao={ac.destinationAirport} />
              {destination}
            </span>
          ) : (
            <span style={{ color: hudMuted }}>No flight plan</span>
          )
        }
      />
      {routeNm !== null && (
        <InspectorField
          label="ROUTE DIST"
          value={`${routeNm < 10 ? routeNm.toFixed(1) : Math.round(routeNm)} NM`}
        />
      )}
      <InspectorField
        label="FROM FIELD"
        value={formatDistanceToAirport(ac.rawLat, ac.rawLon, activeAirportId)}
      />
      <InspectorField label="REG. COUNTRY" value={ac.originCountry || "—"} />
      <InspectorField label="STATUS" value={ac.status.toUpperCase()} />
      <InspectorField label="ALTITUDE" value={formatAltitudeFeet(ac.altitudeMeters)} />
      <InspectorField label="SPEED" value={formatSpeedKnots(ac.velocity)} />
      <InspectorField label="HEADING" value={`${Math.round(ac.heading)}°`} />
      <InspectorField
        label="WEIGHT (EST)"
        value={<AlternatingWeight massKg={massKg} />}
      />
      <InspectorField label="LAST FIX" value={formatUtcDateTime(ac.lastUpdated)} />

      <button
        type="button"
        onClick={() =>
          setCameraMode(cameraMode === "follow" ? "free" : "follow")
        }
        style={{
          marginTop: "12px",
          width: "100%",
          minHeight: isMobile ? HUD_TOUCH_MIN : undefined,
          padding: "10px",
          background:
            cameraMode === "follow" ? hexWithAlpha(color, "22") : "transparent",
          border: `1px solid ${hexWithAlpha(color, "66")}`,
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
