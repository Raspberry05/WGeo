import { useEffect, useMemo, useState } from "react";
import { searchAirports } from "../../data/airportCatalog";
import { useAircraftStore } from "../../store/useAircraftStore";
import {
  hudAccent,
  hudMuted,
  hudPanelStyle,
  HUD_FONT_MD,
  HUD_FONT_SM,
  hudText,
} from "./hudTheme";

const SEARCH_DEBOUNCE_MS = 200;

export function AirportPicker() {
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const setActiveAirport = useAircraftStore((s) => s.setActiveAirport);
  const requestCameraFly = useAircraftStore((s) => s.requestCameraFly);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  const results = useMemo(
    () => searchAirports(debouncedQuery, 50),
    [debouncedQuery],
  );

  return (
    <div
      style={{
        ...hudPanelStyle,
        display: "flex",
        flexDirection: "column",
        maxHeight: "38vh",
        minHeight: "160px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #1a3a2a",
          color: hudMuted,
          letterSpacing: "1px",
          fontSize: HUD_FONT_SM,
        }}
      >
        AIRPORTS
      </div>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #0d1f10" }}>
        <input
          type="search"
          placeholder="ICAO, name, city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 10px",
            background: "rgba(0,16,32,0.9)",
            border: "1px solid #1a3a2a",
            borderRadius: "4px",
            color: "#ccddcc",
            fontFamily: "monospace",
            fontSize: HUD_FONT_SM,
            outline: "none",
          }}
        />
      </div>
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        {results.map((airport) => {
          const isActive = airport.id === activeAirportId;
          return (
            <button
              key={airport.id}
              type="button"
              onClick={() => {
                setActiveAirport(airport.id);
                requestCameraFly("airport", airport.id);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 12px",
                textAlign: "left",
                background: isActive ? "rgba(0,255,136,0.12)" : "transparent",
                border: "none",
                borderBottom: "1px solid #0d1f10",
                color: isActive ? hudAccent : hudText,
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                  fontSize: HUD_FONT_MD,
                }}
              >
                {airport.id}
              </div>
              <div
                style={{
                  color: isActive ? "#5a8a6a" : hudMuted,
                  fontSize: HUD_FONT_SM,
                  marginTop: "3px",
                }}
              >
                {airport.name}
                {airport.municipality
                  ? ` · ${airport.municipality}`
                  : ""}
              </div>
            </button>
          );
        })}
        {results.length === 0 && (
          <div
            style={{
              padding: "12px",
              color: hudMuted,
              fontSize: HUD_FONT_SM,
            }}
          >
            No matches
          </div>
        )}
      </div>
    </div>
  );
}
