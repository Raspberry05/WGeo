"use client";

import type { ReactNode } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useHudStore } from "../../store/useHudStore";
import { AircraftInspector } from "./AircraftInspector";
import { AircraftList } from "./AircraftList";
import { AirportHoverTooltip } from "./AirportHoverTooltip";
import { AirportPicker } from "./AirportPicker";
import { CategoryFilter } from "./CategoryFilter";
import { StatusBar } from "./StatusBar";
import { TrafficViewToggle } from "./TrafficViewToggle";
import {
  HUD_MOBILE_MEDIA,
  HUD_PANEL_GAP,
  HUD_SIDEBAR_WIDTH,
  HUD_SIDEBAR_WIDTH_MOBILE,
  HUD_STATUS_BAR_MIN_HEIGHT,
} from "./hudTheme";

function HudSidebar({
  children,
  isMobile,
  drawerOpen,
}: {
  children: ReactNode;
  isMobile: boolean;
  drawerOpen: boolean;
}) {
  const sidebarWidth = isMobile ? HUD_SIDEBAR_WIDTH_MOBILE : HUD_SIDEBAR_WIDTH;
  const translateX =
    isMobile && !drawerOpen ? -sidebarWidth - HUD_PANEL_GAP : 0;

  return (
    <>
      {isMobile && drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => useHudStore.getState().setMobileDrawerOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 99,
            border: "none",
            background: "rgba(0,0,0,0.45)",
            cursor: "pointer",
          }}
        />
      )}
      <div
        className="hud-sidebar"
        style={{
          position: "absolute",
          top: HUD_STATUS_BAR_MIN_HEIGHT,
          left: 0,
          bottom: 0,
          width: sidebarWidth,
          display: "flex",
          flexDirection: "column",
          gap: HUD_PANEL_GAP,
          padding: HUD_PANEL_GAP,
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          boxSizing: "border-box",
          zIndex: 100,
          pointerEvents: "none",
          transform: `translateX(${translateX}px)`,
          transition: "transform 0.22s ease-out",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: HUD_PANEL_GAP,
            flex: 1,
            minHeight: 0,
            pointerEvents: isMobile && !drawerOpen ? "none" : "auto",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export function HUD() {
  const isMobile = useMediaQuery(HUD_MOBILE_MEDIA);
  const drawerOpen = useHudStore((s) => s.mobileDrawerOpen);

  return (
    <>
      <StatusBar isMobile={isMobile} />
      <HudSidebar isMobile={isMobile} drawerOpen={drawerOpen}>
        <AirportPicker isMobile={isMobile} />
        <CategoryFilter />
        <AircraftList />
      </HudSidebar>
      <AircraftInspector isMobile={isMobile} />
      <TrafficViewToggle />
      <AirportHoverTooltip />
    </>
  );
}
