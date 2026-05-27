import { useCallback, useMemo, useState } from "react";
import { MdLocalAirport, MdSearch } from "react-icons/md";
import { searchAirports } from "../../data/airportCatalog";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { selectActiveAirportId } from "../../store/selectors";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useHudStore } from "../../store/useHudStore";
import { AirportPickerRow } from "./AirportPickerRow";
import { HudIcon } from "./HudIcon";
import { HudPanel } from "./HudPanel";
import { hudMuted, HUD_FONT_SM } from "./hudTheme";

const SEARCH_DEBOUNCE_MS = 200;

export interface AirportPickerProps {
  isMobile?: boolean;
}

export function AirportPicker({ isMobile = false }: AirportPickerProps) {
  const activeAirportId = useAircraftStore(selectActiveAirportId);
  const setActiveAirport = useAircraftStore((s) => s.setActiveAirport);
  const requestCameraFly = useAircraftStore((s) => s.requestCameraFly);
  const setMobileDrawerOpen = useHudStore((s) => s.setMobileDrawerOpen);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const results = useMemo(
    () => searchAirports(debouncedQuery, 50),
    [debouncedQuery],
  );

  const handleSelect = useCallback(
    (icao: string) => {
      setActiveAirport(icao);
      requestCameraFly("airport", icao);
      if (isMobile) setMobileDrawerOpen(false);
    },
    [setActiveAirport, requestCameraFly, isMobile, setMobileDrawerOpen],
  );

  return (
    <HudPanel
      panelId="airport-picker"
      title="AIRPORTS"
      titleIcon={MdLocalAirport}
      minimizedSummary={activeAirportId}
      maxHeight={isMobile ? "min(34dvh, 250px)" : "min(34vh, 300px)"}
      minHeight={isMobile ? "100px" : "120px"}
    >
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #0d1f10" }}>
        <div style={{ position: "relative" }}>
          <HudIcon
            icon={MdSearch}
            size={16}
            muted
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            placeholder="ICAO, name, city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 10px 8px 34px",
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
      </div>
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        {results.map((airport) => (
          <AirportPickerRow
            key={airport.id}
            id={airport.id}
            name={airport.name}
            municipality={airport.municipality}
            isActive={airport.id === activeAirportId}
            onSelect={handleSelect}
          />
        ))}
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
    </HudPanel>
  );
}
