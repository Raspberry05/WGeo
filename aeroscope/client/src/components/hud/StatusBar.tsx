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

  const airport = getAirport(activeAirportId);
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
      ? "#00ff88"
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
        minHeight: "36px",
        background: "rgba(0,8,16,0.92)",
        borderBottom: "1px solid #1a3a2a",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        padding: "6px 16px 6px 216px",
        gap: "12px 20px",
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
        {!activeAirportPickEnabled && (
          <span style={{ color: "#5a8a6a", marginLeft: "8px" }}>
            (aircraft pick mode)
          </span>
        )}
      </span>

      <WeatherPanel />

      <UtcClock />

      {selected && (
        <>
          <div style={{ width: "1px", height: "20px", background: "#1a3a2a" }} />

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <CountryFlagByName countryName={selected.originCountry} size={16} />
            <span style={{ color: "#00ff88", fontWeight: "bold" }}>
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <AirportFlag icao={selected.originAirport} />
              <span>{formatAirportCode(selected.originAirport)}</span>
              <span style={{ color: "#4a6a5a" }}>→</span>
              <AirportFlag icao={selected.destinationAirport} />
              <span>{formatAirportCode(selected.destinationAirport)}</span>
            </span>
            {regIso && (
              <FlagIcon iso2={regIso} size={14} title={selected.originCountry} />
            )}
          </span>
        </>
      )}

      <div style={{ flex: 1 }} />

      <span>
        {categoryFilter?.length ? `${filtered}/${total}` : total} AIRCRAFT
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: connectionColor,
            boxShadow: `0 0 6px ${connectionColor}`,
          }}
        />
        <span style={{ color: connectionColor }}>{status}</span>
      </div>
    </div>
  );
}
