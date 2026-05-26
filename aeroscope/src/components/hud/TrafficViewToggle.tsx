import { useAircraftStore, type TrafficViewMode } from "@/store/useAircraftStore";
import {
  hudAccent,
  hudMuted,
  HUD_FONT_SM,
  HUD_TOUCH_MIN,
  hudText,
} from "./hudTheme";

const MODES: { id: TrafficViewMode; label: string }[] = [
  { id: "airport", label: "Airport" },
  { id: "aircraft", label: "Viewport" },
];

export interface TrafficViewToggleProps {
  isMobile: boolean;
}

export function TrafficViewToggle({ isMobile }: TrafficViewToggleProps) {
  const mode = useAircraftStore((s) => s.trafficViewMode);
  const clamped = useAircraftStore((s) => s.viewportBoundsClamped);
  const setTrafficViewMode = useAircraftStore((s) => s.setTrafficViewMode);

  const hint =
    mode === "airport"
      ? "Traffic near the selected airport"
      : clamped
        ? "Map area capped (~8°) for API quota"
        : "Traffic in the current map view";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        minWidth: isMobile ? undefined : "200px",
      }}
    >
      <span
        style={{
          fontSize: HUD_FONT_SM,
          color: hudMuted,
          letterSpacing: "1px",
        }}
      >
        TRAFFIC
      </span>
      <div
        style={{
          display: "flex",
          border: "1px solid #1a3a2a",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {MODES.map(({ id, label }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTrafficViewMode(id)}
              style={{
                flex: 1,
                minHeight: isMobile ? HUD_TOUCH_MIN : "32px",
                padding: "6px 10px",
                background: active ? "rgba(0,255,136,0.12)" : "transparent",
                border: "none",
                borderRight: id === "airport" ? "1px solid #1a3a2a" : undefined,
                color: active ? hudAccent : hudText,
                fontFamily: "monospace",
                fontSize: HUD_FONT_SM,
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <span style={{ fontSize: HUD_FONT_SM, color: hudMuted }}>{hint}</span>
    </div>
  );
}
