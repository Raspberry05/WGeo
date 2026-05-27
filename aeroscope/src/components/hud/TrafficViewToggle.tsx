"use client";

import { useEffect, type ReactNode } from "react";
import { MdAirplanemodeActive, MdLocalAirport } from "react-icons/md";
import { useAircraftStore, type TrafficViewMode } from "@/store/useAircraftStore";
import { AIRCRAFT_VIEWPORT_ENABLED } from "@/config/trafficView";
import { HudIcon } from "./HudIcon";
import {
  hexWithAlpha,
  hudAccent,
  hudMuted,
  hudPanelStyle,
  HUD_TOUCH_MIN,
} from "./hudTheme";

type ModeButtonProps = {
  mode: TrafficViewMode;
  active: boolean;
  disabled?: boolean;
  label: string;
  title: string;
  onSelect: () => void;
  children: ReactNode;
};

function ModeButton({
  active,
  disabled,
  label,
  title,
  onSelect,
  children,
}: ModeButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: HUD_TOUCH_MIN,
        height: HUD_TOUCH_MIN,
        padding: 0,
        background: active
          ? hexWithAlpha(hudAccent, "18")
          : "transparent",
        border: `1px solid ${active ? hexWithAlpha(hudAccent, "66") : "#1a3a2a"}`,
        borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </button>
  );
}

export type TrafficViewToggleVariant = "floating" | "inline";

export interface TrafficViewToggleProps {
  variant?: TrafficViewToggleVariant;
}

export function TrafficViewToggle({
  variant = "floating",
}: TrafficViewToggleProps) {
  const mode = useAircraftStore((s) => s.trafficViewMode);
  const setTrafficViewMode = useAircraftStore((s) => s.setTrafficViewMode);

  useEffect(() => {
    if (!AIRCRAFT_VIEWPORT_ENABLED && mode === "aircraft") setTrafficViewMode("airport");
  }, [mode, setTrafficViewMode]);

  const iconColor = (active: boolean) => (active ? hudAccent : hudMuted);

  const isInline = variant === "inline";

  return (
    <div
      className="hud-traffic-view-toggle"
      style={{
        ...(isInline
          ? {
              display: "flex",
              flexDirection: "row",
              gap: "8px",
              padding: "10px 12px",
              justifyContent: "center",
            }
          : {
              position: "absolute",
              right: "max(12px, env(safe-area-inset-right))",
              bottom: "max(12px, env(safe-area-inset-bottom))",
              zIndex: 102,
              display: "flex",
              flexDirection: "row",
              gap: "8px",
              padding: "6px",
              pointerEvents: "auto",
            }),
        ...hudPanelStyle,
      }}
      role="group"
      aria-label="Traffic view mode"
    >
      <ModeButton
        mode="airport"
        active={mode === "airport"}
        label="Airport traffic"
        title="Traffic near selected airport"
        onSelect={() => setTrafficViewMode("airport")}
      >
        <HudIcon
          icon={MdLocalAirport}
          size={22}
          color={iconColor(mode === "airport")}
        />
      </ModeButton>

      <ModeButton
        mode="aircraft"
        active={mode === "aircraft"}
        disabled={!AIRCRAFT_VIEWPORT_ENABLED}
        label="Viewport air traffic"
        title={
          AIRCRAFT_VIEWPORT_ENABLED
            ? "Traffic in current map view"
            : "Viewport traffic (coming soon)"
        }
        onSelect={() => {
          if (AIRCRAFT_VIEWPORT_ENABLED) {
            setTrafficViewMode("aircraft");
          }
        }}
      >
        <HudIcon
          icon={MdAirplanemodeActive}
          size={22}
          color={iconColor(mode === "aircraft")}
        />
      </ModeButton>
    </div>
  );
}
