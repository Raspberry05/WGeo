import { useEffect } from "react";
import { getAirport } from "../../data/airports";
import { enrichSelectedAircraft } from "../../services/aircraftEnrichment";
import { useAircraftStore } from "../../store/useAircraftStore";
import {
  AirportFlag,
  CountryFlagByName,
  FlagIcon,
  countryNameToIso2,
} from "../../utils/countryFlags";
import { formatAltitudeFeet, formatSpeedKnots } from "../../utils/flightUnits";
import {
  hudAccent,
  hudMuted,
  HUD_FONT_LG,
  HUD_FONT_MD,
  HUD_FONT_SM,
  HUD_SIDEBAR_WIDTH,
  HUD_STATUS_BAR_MIN_HEIGHT,
  hudText,
} from "./hudTheme";
import { UtcClock } from "./UtcClock";
import { WeatherPanel } from "./WeatherPanel";

function formatAirportCode(code: string | null): string {
  if (!code) return "—";
  return code.toUpperCase();
}

export function StatusBar() {
  const status = useAircraftStore((s) => s.connectionStatus);
  const aircraft = useAircraftStore((s) => s.aircraft);
  const categoryFilter = useAircraftStore((s) => s.categoryFilter);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const activeAirportPickEnabled = useAircraftStore(
    (s) => s.activeAirportPickEnabled,
  );
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);

  const airport = catalogReady ? getAirport(activeAirportId) : null;
  const selected = selectedId ? aircraft[selectedId] : null;

  const total = Object.keys(aircraft).length;
  const filtered = Object.values(aircraft).filter((ac) => {
    if (!categoryFilter?.length) return true;
    const code = ac.categoryCode ?? -1;
    return categoryFilter.includes(code);
  }).length;

  useEffect(() => {
    if (selectedId) void enrichSelectedAircraft(selectedId);
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

  return (
    <div
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
        padding: `10px 20px 10px ${HUD_SIDEBAR_WIDTH + 16}px`,
        gap: "14px 22px",
        fontFamily: "monospace",
        fontSize: HUD_FONT_SM,
        color: hudText,
        zIndex: 110,
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          color: hudAccent,
          fontWeight: "bold",
          letterSpacing: "2px",
          fontSize: HUD_FONT_LG,
        }}
      >
        AEROSCOPE
      </span>

      <div style={{ width: "1px", height: "24px", background: "#1a3a2a" }} />

      {airport && (
        <span style={{ fontSize: HUD_FONT_MD }}>
          {airport.id} · {airport.name.toUpperCase()}
          {!activeAirportPickEnabled && (
            <span style={{ color: "#5a8a6a", marginLeft: "10px" }}>
              (aircraft pick mode)
            </span>
          )}
        </span>
      )}

      <WeatherPanel />
      <UtcClock />

      {selected && (
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
            <span style={{ color: "#00ccff" }}>
              {formatAltitudeFeet(selected.altitudeMeters)}
            </span>
            <span style={{ color: "#5a7a6a" }}>|</span>
            <span style={{ color: "#00ccff" }}>
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
              <AirportFlag icao={selected.originAirport} />
              <span>{formatAirportCode(selected.originAirport)}</span>
              <span style={{ color: hudMuted }}>→</span>
              <AirportFlag icao={selected.destinationAirport} />
              <span>{formatAirportCode(selected.destinationAirport)}</span>
            </span>
            {regIso && (
              <FlagIcon iso2={regIso} size={18} title={selected.originCountry} />
            )}
          </span>
        </>
      )}

      <div style={{ flex: 1, minWidth: "8px" }} />

      <span style={{ fontSize: HUD_FONT_MD }}>
        {categoryFilter?.length ? `${filtered}/${total}` : total} AIRCRAFT
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
