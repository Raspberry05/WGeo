import { useEffect } from "react";
import { FaDoorOpen } from "react-icons/fa6";
import {
  MdAirplanemodeActive,
  MdHeight,
  MdLocalAirport,
  MdMenu,
  MdRoute,
  MdSpeed,
} from "react-icons/md";
import { getAirport } from "../../data/airports";
import {
  enrichSelectedAircraft,
  loadTrackForSelected,
} from "../../services/aircraftEnrichment";
import { formatScheduleTime } from "../../utils/flightScheduleDisplay";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useHudStore } from "../../store/useHudStore";
import {
  AirportFlag,
  CountryFlagByName,
  FlagIcon,
} from "../../utils/countryFlags";
import { countryNameToIso2 } from "../../utils/countryFlagUtils";
import { formatAltitudeFeet, formatSpeedKnots } from "../../utils/flightUnits";
import { formatRouteSummary } from "../../utils/routeDisplay";
import {
  hudAccent,
  hudMuted,
  HUD_FONT_LG,
  HUD_FONT_MD,
  HUD_FONT_SM,
  HUD_STATUS_BAR_MIN_HEIGHT,
  HUD_TOUCH_MIN,
  hudText,
  statusBarPaddingLeft,
} from "./hudTheme";
import { HudIcon } from "./HudIcon";
import { UtcClock } from "./UtcClock";
import { WeatherPanel } from "./WeatherPanel";

export interface StatusBarProps {
  isMobile: boolean;
}

export function StatusBar({ isMobile }: StatusBarProps) {
  const status = useAircraftStore((s) => s.connectionStatus);
  const aircraft = useAircraftStore((s) => s.aircraft);
  const classFilter = useAircraftStore((s) => s.classFilter);
  const wakeFilter = useAircraftStore((s) => s.wakeFilter);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const activeAirportPickEnabled = useAircraftStore(
    (s) => s.activeAirportPickEnabled,
  );
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);
  const toggleDrawer = useHudStore((s) => s.toggleMobileDrawer);

  const airport = catalogReady ? getAirport(activeAirportId) : null;
  const selected = selectedId ? aircraft[selectedId] : null;

  const total = Object.keys(aircraft).length;
  const filtered = Object.values(aircraft).filter((ac) => {
    const classOk = !classFilter?.length || (ac.aircraftClass !== null && classFilter.includes(ac.aircraftClass));
    const wakeOk = !wakeFilter?.length || (ac.wakeCategory !== null && wakeFilter.includes(ac.wakeCategory));
    return classOk && wakeOk;
  }).length;

  useEffect(() => {
    if (!selectedId) return;
    void enrichSelectedAircraft(selectedId);
    void loadTrackForSelected(selectedId);
  }, [selectedId]);

  const connectionColor =
    status === "LIVE"
      ? hudAccent
      : status === "SIMULATED"
        ? "#888a94"
        : "#404248";

  const brand =
    selected?.aircraftModel ??
    selected?.operatorName ??
    selected?.aircraftType ??
    null;

  const regIso = selected ? countryNameToIso2(selected.originCountry) : null;

  const routeDisplay = selected
    ? formatRouteSummary(
        selected.originAirport,
        selected.destinationAirport,
        selected.onGround,
      )
    : null;

  return (
    <div
      className="hud-status-bar"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        minHeight: HUD_STATUS_BAR_MIN_HEIGHT,
        background: "rgba(0,8,16,0.92)",
        borderBottom: "1px solid #1a3a2a",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        padding: `max(10px, env(safe-area-inset-top)) 16px 10px ${statusBarPaddingLeft(isMobile)}px`,
        gap: isMobile ? "10px 14px" : "14px 22px",
        fontFamily: "monospace",
        fontSize: HUD_FONT_SM,
        color: hudText,
        zIndex: 110,
        boxSizing: "border-box",
      }}
    >
      {isMobile && (
        <button
          type="button"
          aria-label="Open menu"
          onClick={toggleDrawer}
          style={{
            minWidth: HUD_TOUCH_MIN,
            minHeight: HUD_TOUCH_MIN,
            padding: "8px",
            margin: "-8px 0",
            background: "transparent",
            border: "1px solid #1a3a2a",
            borderRadius: "4px",
            color: hudAccent,
            fontFamily: "monospace",
            fontSize: HUD_FONT_LG,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          <HudIcon icon={MdMenu} size={22} />
        </button>
      )}

      <span
        style={{
          color: hudAccent,
          fontWeight: "bold",
          letterSpacing: "2px",
          fontSize: isMobile ? HUD_FONT_MD : HUD_FONT_LG,
        }}
      >
        AEROSCOPE
      </span>

      {!isMobile && (
        <div style={{ width: "1px", height: "24px", background: "#1a3a2a" }} />
      )}

      {airport && (
        <span
          style={{
            fontSize: HUD_FONT_MD,
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: isMobile ? "140px" : undefined,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <HudIcon icon={MdLocalAirport} size={16} />
          {isMobile ? airport.id : `${airport.id} · ${airport.name.toUpperCase()}`}
          {!activeAirportPickEnabled && !isMobile && (
            <span style={{ color: "#5a8a6a", marginLeft: "10px" }}>
              (aircraft pick mode)
            </span>
          )}
        </span>
      )}

      {!isMobile && (
        <>
          <WeatherPanel />
          <UtcClock />
        </>
      )}

      {selected && !isMobile && (
        <>
          <div style={{ width: "1px", height: "24px", background: "#1a3a2a" }} />

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontSize: HUD_FONT_MD,
            }}
          >
            <CountryFlagByName countryName={selected.originCountry} size={20} />
            <span style={{ color: hudAccent, fontWeight: "bold" }}>
              {selected.callsign}
            </span>
            <span style={{ color: "#5a7a6a" }}>|</span>
            <span>{selected.aircraftType}</span>
            <span style={{ color: "#5a7a6a" }}>|</span>
            <span
              style={{
                color: "#00ccff",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <HudIcon icon={MdHeight} size={14} color="#00ccff" />
              {formatAltitudeFeet(selected.altitudeMeters)}
            </span>
            <span style={{ color: "#5a7a6a" }}>|</span>
            <span
              style={{
                color: "#00ccff",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <HudIcon icon={MdSpeed} size={14} color="#00ccff" />
              {formatSpeedKnots(selected.velocity)}
            </span>
            {brand && (
              <>
                <span style={{ color: "#5a7a6a" }}>|</span>
                <span style={{ color: "#ccddcc" }}>{brand}</span>
              </>
            )}
            <span style={{ color: "#5a7a6a" }}>|</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <HudIcon icon={MdRoute} size={14} muted />
              {routeDisplay?.hasAnyRoute ? (
                <>
                  <AirportFlag icao={selected.originAirport} />
                  <span>{routeDisplay.origin}</span>
                  <span style={{ color: hudMuted }}>→</span>
                  <AirportFlag icao={selected.destinationAirport} />
                  <span>{routeDisplay.destination}</span>
                </>
              ) : (
                <span style={{ color: hudMuted }}>No flight plan</span>
              )}
            </span>
            {regIso && (
              <FlagIcon iso2={regIso} size={18} title={selected.originCountry} />
            )}
            {selected.flightDetail && (
              <>
                <span style={{ color: "#5a7a6a" }}>|</span>
                <span
                  style={{
                    color: hudMuted,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <HudIcon icon={FaDoorOpen} size={13} muted />
                  {selected.flightDetail.gateOrigin
                    ? `G${selected.flightDetail.gateOrigin}`
                    : "—"}
                  {" · "}
                  ETD{" "}
                  {formatScheduleTime(
                    selected.flightDetail.estimatedOut ??
                      selected.flightDetail.scheduledOut,
                  )}
                  {" · "}
                  ETA{" "}
                  {formatScheduleTime(
                    selected.flightDetail.estimatedIn ??
                      selected.flightDetail.scheduledIn,
                  )}
                </span>
              </>
            )}
          </span>
        </>
      )}

      <div style={{ flex: 1, minWidth: "8px" }} />

      <span
        style={{
          fontSize: isMobile ? HUD_FONT_SM : HUD_FONT_MD,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <HudIcon icon={MdAirplanemodeActive} size={15} muted />
        {classFilter?.length || wakeFilter?.length ? `${filtered}/${total}` : total}
        {!isMobile && " AIRCRAFT"}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            background: connectionColor,
            boxShadow: `0 0 8px ${connectionColor}`,
          }}
        />
        <span style={{ color: connectionColor, fontSize: HUD_FONT_MD }}>
          {status}
        </span>
      </div>
    </div>
  );
}
