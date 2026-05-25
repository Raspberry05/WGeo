import type { ReactNode } from "react";
import { AircraftInspector } from "./AircraftInspector";
import { AircraftList } from "./AircraftList";
import { AirportPicker } from "./AirportPicker";
import { CategoryFilter } from "./CategoryFilter";
import { StatusBar } from "./StatusBar";
import {
  HUD_PANEL_GAP,
  HUD_SIDEBAR_WIDTH,
  HUD_STATUS_BAR_MIN_HEIGHT,
} from "./hudTheme";

function HudSidebar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        top: HUD_STATUS_BAR_MIN_HEIGHT,
        left: 0,
        bottom: 0,
        width: HUD_SIDEBAR_WIDTH,
        display: "flex",
        flexDirection: "column",
        gap: HUD_PANEL_GAP,
        padding: HUD_PANEL_GAP,
        boxSizing: "border-box",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: HUD_PANEL_GAP,
          flex: 1,
          minHeight: 0,
          pointerEvents: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function HUD() {
  return (
    <>
      <StatusBar />
      <HudSidebar>
        <AirportPicker />
        <CategoryFilter />
        <AircraftList />
      </HudSidebar>
      <AircraftInspector />
    </>
  );
}
