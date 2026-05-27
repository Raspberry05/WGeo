import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { HudIcon } from "./HudIcon";
import { hudMuted, HUD_FONT_SM, HUD_PANEL_GAP } from "./hudTheme";

export interface HudGroupProps {
  title: string;
  icon?: IconType;
  children: ReactNode;
}

/** Sidebar section grouping related HUD panels (Airport, Airplane, …). */
export function HudGroup({ title, icon, children }: HudGroupProps) {
  return (
    <section
      aria-label={title}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: HUD_PANEL_GAP,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 2px",
          color: hudMuted,
          fontFamily: "monospace",
          fontSize: HUD_FONT_SM,
          letterSpacing: "2px",
          fontWeight: 600,
        }}
      >
        {icon && <HudIcon icon={icon} size={15} muted />}
        <span>{title}</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: HUD_PANEL_GAP,
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </section>
  );
}
