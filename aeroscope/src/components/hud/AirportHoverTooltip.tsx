"use client";

import { getAirport } from "../../data/airports";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAircraftStore } from "../../store/useAircraftStore";
import { HUD_MOBILE_MEDIA } from "./hudTheme";
import {
  hudAccent,
  hudPanelStyle,
  HUD_FONT_MD,
  HUD_FONT_SM,
  hudMuted,
} from "./hudTheme";

const TOOLTIP_OFFSET_X = 14;
const TOOLTIP_OFFSET_Y = 18;

export function AirportHoverTooltip() {
  const isMobile = useMediaQuery(HUD_MOBILE_MEDIA);
  const hoveredAirportId = useAircraftStore((s) => s.hoveredAirportId);
  const hoverScreen = useAircraftStore((s) => s.hoverScreen);
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);

  if (isMobile || !hoveredAirportId || !hoverScreen || !catalogReady) {
    return null;
  }

  const airport = getAirport(hoveredAirportId);
  const label = airport
    ? `${airport.id} · ${airport.name}`
    : hoveredAirportId;

  return (
    <div
      style={{
        position: "absolute",
        left: hoverScreen.x + TOOLTIP_OFFSET_X,
        top: hoverScreen.y + TOOLTIP_OFFSET_Y,
        zIndex: 105,
        pointerEvents: "none",
        ...hudPanelStyle,
        padding: "6px 10px",
        fontSize: HUD_FONT_SM,
        color: hudMuted,
        whiteSpace: "nowrap",
        maxWidth: "min(280px, 90vw)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
      }}
    >
      <span style={{ color: hudAccent, fontSize: HUD_FONT_MD, fontWeight: "bold" }}>
        {label}
      </span>
    </div>
  );
}
