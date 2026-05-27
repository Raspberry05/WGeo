import {
  MdAccessTime,
  MdAirlines,
  MdCategory,
  MdExpandLess,
  MdExpandMore,
  MdExplore,
  MdHeight,
  MdMyLocation,
  MdPlace,
  MdPublic,
  MdRoute,
  MdScale,
  MdSpeed,
  MdStraighten,
  MdTimeline,
} from "react-icons/md";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useHudStore } from "../../store/useHudStore";
import {
  formatDistanceToAirport,
  routeDistanceNm,
} from "../../utils/aircraftDistance";
import { hasValidApiTrack } from "../../utils/flightTrack";
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
import { AircraftStatusIcon } from "./AircraftStatusIcon";
import { AlternatingWeight } from "./AlternatingWeight";
import { InspectorScheduleSection } from "./InspectorScheduleSection";
import { InspectorField } from "./InspectorField";
import { InspectorGrid } from "./InspectorGrid";
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
  const trackLoadingId = useAircraftStore((s) => s.trackLoadingId);
  const trackByFlightId = useAircraftStore((s) => s.trackByFlightId);
  const showTrail = useAircraftStore((s) => s.showTrail);
  const setShowTrail = useAircraftStore((s) => s.setShowTrail);
  const inspectorMinimized = useHudStore(
    (s) => Boolean(s.minimizedPanels["aircraft-inspector"]),
  );
  const togglePanelMinimized = useHudStore((s) => s.togglePanelMinimized);
  const statusBarHeight = useHudStore((s) => s.statusBarHeight);

  const ac = selectedId ? aircraft[selectedId] : null;
  if (!ac) return null;

  const layout = inspectorLayout(isMobile, statusBarHeight);
  const hasTrack = hasValidApiTrack(trackByFlightId, ac.id);

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
        top: layout.top,
        width: layout.width,
        maxHeight: inspectorMinimized ? "none" : layout.maxHeight,
        overflowY: "auto",
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
      <div style={{ marginBottom: inspectorMinimized ? "0" : "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CountryFlagByName countryName={ac.originCountry} size={24} />
          <div style={{ flex: 1, minWidth: 0 }}>
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
            <div
              style={{
                color: hudMuted,
                fontSize: HUD_FONT_SM,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AircraftStatusIcon status={ac.status} size={14} color={color} />
              {(ac.registration ?? ac.icao24).toUpperCase()}
            </div>
          </div>
          <button
            type="button"
            aria-label={
              inspectorMinimized
                ? "Expand aircraft panel"
                : "Minimize aircraft panel"
            }
            onClick={() => togglePanelMinimized("aircraft-inspector")}
            style={{
              border: "1px solid #1a3a2a",
              background: "transparent",
              color,
              borderRadius: "4px",
              width: "26px",
              height: "26px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              flexShrink: 0,
            }}
          >
            {inspectorMinimized ? (
              <MdExpandMore size={16} aria-hidden />
            ) : (
              <MdExpandLess size={16} aria-hidden />
            )}
          </button>
        </div>
      </div>

      {inspectorMinimized ? (
        <InspectorGrid isMobile={isMobile} columns={1}>
          <InspectorField
            layout="stack"
            icon={MdHeight}
            label="ALT"
            value={formatAltitudeFeet(ac.altitudeMeters)}
          />
          <InspectorField
            layout="stack"
            icon={MdSpeed}
            label="SPD"
            value={formatSpeedKnots(ac.velocity)}
          />
          <InspectorField
            layout="stack"
            icon={MdRoute}
            label="ROUTE"
            value={
              hasAnyRoute ? `${origin} -> ${destination}` : "No flight plan"
            }
          />
        </InspectorGrid>
      ) : (
        <>
      <InspectorGrid isMobile={isMobile} columns={isMobile ? 1 : 2}>
        <InspectorField
          layout="stack"
          icon={MdHeight}
          label="ALTITUDE"
          value={formatAltitudeFeet(ac.altitudeMeters)}
        />
        <InspectorField
          layout="stack"
          icon={MdSpeed}
          label="SPEED"
          value={formatSpeedKnots(ac.velocity)}
        />
        <InspectorField
          layout="stack"
          icon={MdExplore}
          label="HEADING"
          value={`${Math.round(ac.heading)}°`}
        />
        <InspectorField
          layout="stack"
          label="STATUS"
          value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <AircraftStatusIcon status={ac.status} size={14} color={color} />
              {ac.status.toUpperCase()}
            </span>
          }
        />
        <InspectorField
          layout="stack"
          icon={MdAccessTime}
          label="LAST FIX"
          value={formatUtcDateTime(ac.lastUpdated)}
        />
      </InspectorGrid>

      <InspectorGrid isMobile={isMobile} columns={isMobile ? 1 : 2}>
        <InspectorField
          layout="stack"
          icon={MdCategory}
          label="CATEGORY"
          value={ac.aircraftType}
        />
        <InspectorField
          layout="stack"
          icon={MdAirlines}
          label="BRAND / TYPE"
          value={brand}
        />
        <div style={{ gridColumn: isMobile ? undefined : "1 / -1" }}>
          <InspectorField
            layout="stack"
            icon={MdRoute}
            label="ROUTE"
            value={
              hasAnyRoute ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
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
        </div>
        {routeNm !== null && (
          <InspectorField
            layout="stack"
            icon={MdStraighten}
            label="ROUTE DIST"
            value={`${routeNm < 10 ? routeNm.toFixed(1) : Math.round(routeNm)} NM`}
          />
        )}
        <InspectorField
          layout="stack"
          icon={MdPlace}
          label="FROM FIELD"
          value={formatDistanceToAirport(ac.rawLat, ac.rawLon, activeAirportId)}
        />
        <InspectorField
          layout="stack"
          icon={MdPublic}
          label="REG. COUNTRY"
          value={ac.originCountry || "—"}
        />
        <InspectorField
          layout="stack"
          icon={MdScale}
          label="WEIGHT (EST)"
          value={<AlternatingWeight massKg={massKg} />}
        />
      </InspectorGrid>

      <InspectorScheduleSection
        detail={ac.flightDetail}
        trackLoading={trackLoadingId === ac.id}
        isMobile={isMobile}
      />

      {hasTrack && (
        <button
          type="button"
          onClick={() => setShowTrail(!showTrail)}
          style={{
            marginTop: "12px",
            width: "100%",
            minHeight: isMobile ? HUD_TOUCH_MIN : undefined,
            padding: "8px",
            background: showTrail ? hexWithAlpha(color, "15") : "transparent",
            border: `1px solid ${hexWithAlpha(color, "44")}`,
            color,
            fontFamily: "monospace",
            fontSize: HUD_FONT_SM,
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <MdTimeline size={16} color={color} aria-hidden />
            {showTrail ? "TRAIL ON" : "TRAIL OFF"}
          </span>
        </button>
      )}

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
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <MdMyLocation size={16} color={color} aria-hidden />
          {cameraMode === "follow" ? "FOLLOWING" : "FOLLOW"}
        </span>
      </button>
        </>
      )}
    </div>
  );
}
