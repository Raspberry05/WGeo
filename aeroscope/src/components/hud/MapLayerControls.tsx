"use client";

import { useCallback } from "react";
import { IMAGERY_OPTIONS, type ImageryId } from "@/config/imageryOptions";
import {
  BUILDINGS_3D_OPTIONS,
  imageryBlockedBy3d,
  type Buildings3dId,
} from "@/config/tilesetOptions";
import { useMapSettingsStore } from "@/store/useMapSettingsStore";
import { HudIcon } from "./HudIcon";
import {
  hexWithAlpha,
  hudAccent,
  hudMuted,
  hudPanelStyle,
  HUD_TOUCH_MIN,
} from "./hudTheme";

const BUTTON_SIZE = HUD_TOUCH_MIN;

function LayerButton({
  label,
  active,
  disabled = false,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: Parameters<typeof HudIcon>[0]["icon"];
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active
          ? hexWithAlpha(hudAccent, "18")
          : "rgba(0,16,32,0.85)",
        border: `1px solid ${active ? hexWithAlpha(hudAccent, "88") : "#1a3a2a"}`,
        borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        boxSizing: "border-box",
      }}
    >
      <HudIcon
        icon={icon}
        size={22}
        color={disabled ? hudMuted : active ? hudAccent : hudMuted}
      />
    </button>
  );
}

/** Bottom-right imagery + optional 3D buildings layer toggles. */
export function MapLayerControls() {
  const imageryId = useMapSettingsStore((s) => s.imageryId);
  const buildings3dId = useMapSettingsStore((s) => s.buildings3dId);
  const setImageryId = useMapSettingsStore((s) => s.setImageryId);
  const setBuildings3dId = useMapSettingsStore((s) => s.setBuildings3dId);

  const selectImagery = useCallback(
    (id: ImageryId) => setImageryId(id),
    [setImageryId],
  );

  const selectBuildings3d = useCallback(
    (id: Buildings3dId) => setBuildings3dId(id),
    [setBuildings3dId],
  );

  const imageryDisabled = imageryBlockedBy3d(buildings3dId);

  return (
    <div
      className="hud-map-layer-controls"
      style={{
        position: "absolute",
        right: "max(12px, env(safe-area-inset-right))",
        bottom: "max(12px, env(safe-area-inset-bottom))",
        zIndex: 102,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "8px",
        maxWidth: "calc(100vw - 24px)",
        boxSizing: "border-box",
        ...hudPanelStyle,
        pointerEvents: "auto",
      }}
    >
      <div
        role="group"
        aria-label={
          imageryDisabled
            ? "Base map imagery (disabled while Google Photorealistic 3D is on)"
            : "Base map imagery"
        }
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(5, ${BUTTON_SIZE}px)`,
          gap: "6px",
          opacity: imageryDisabled ? 0.45 : 1,
          pointerEvents: imageryDisabled ? "none" : "auto",
        }}
      >
        {IMAGERY_OPTIONS.map((option) => (
          <LayerButton
            key={option.id}
            label={
              imageryDisabled
                ? `${option.label} (unavailable with Google 3D)`
                : option.label
            }
            active={!imageryDisabled && imageryId === option.id}
            disabled={imageryDisabled}
            onClick={() => selectImagery(option.id)}
            icon={option.icon}
          />
        ))}
      </div>

      <div
        style={{
          height: "1px",
          background: "#1a3a2a",
          margin: "0 2px",
        }}
      />

      <div
        role="group"
        aria-label="3D buildings layer"
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "6px",
          justifyContent: "flex-end",
        }}
      >
        {BUILDINGS_3D_OPTIONS.map((option) => (
          <LayerButton
            key={option.id}
            label={option.label}
            active={buildings3dId === option.id}
            onClick={() => selectBuildings3d(option.id)}
            icon={option.icon}
          />
        ))}
      </div>
    </div>
  );
}
