import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { HudIcon } from "./HudIcon";
import { hudAccent, HUD_FONT_SM, HUD_PANEL_GAP } from "./hudTheme";

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
        padding: "10px 8px",
        borderRadius: "6px",
        background: "rgba(0, 20, 32, 0.55)",
        border: "1px solid #143028",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 4px 2px",
          color: hudAccent,
          fontFamily: "monospace",
          fontSize: HUD_FONT_SM,
          letterSpacing: "2px",
          fontWeight: 700,
          borderBottom: "1px solid #1a3a2a",
          paddingBottom: "8px",
          marginBottom: "2px",
        }}
      >
        {icon && <HudIcon icon={icon} size={16} color={hudAccent} />}
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
