import { memo, type ReactNode } from "react";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import type { IconType } from "react-icons";
import { useHudStore, type HudPanelId } from "../../store/useHudStore";
import { HudIcon } from "./HudIcon";
import { hudAccent, hudMuted, hudPanelStyle, HUD_FONT_SM } from "./hudTheme";

export interface HudPanelProps {
  panelId: HudPanelId;
  title: string;
  titleIcon?: IconType;
  children: ReactNode;
  minimizedSummary?: string;
  maxHeight?: string;
  minHeight?: string;
  flexShrink?: number;
  flex?: number;
}

export const HudPanel = memo(function HudPanel({
  panelId,
  title,
  titleIcon,
  children,
  minimizedSummary,
  maxHeight,
  minHeight,
  flexShrink = 0,
  flex,
}: HudPanelProps) {
  const minimized = useHudStore((s) => Boolean(s.minimizedPanels[panelId]));
  const togglePanelMinimized = useHudStore((s) => s.togglePanelMinimized);

  return (
    <div
      style={{
        ...hudPanelStyle,
        display: "flex",
        flexDirection: "column",
        maxHeight: minimized ? undefined : maxHeight,
        minHeight: minimized ? undefined : minHeight,
        flexShrink: minimized ? 0 : flexShrink,
        flex: minimized ? undefined : flex,
        overflow: flex !== undefined ? "hidden" : undefined,
        fontSize: HUD_FONT_SM,
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #1a3a2a",
          color: hudMuted,
          letterSpacing: "1px",
          fontSize: HUD_FONT_SM,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {titleIcon && <HudIcon icon={titleIcon} size={15} muted />}
        <span style={{ flex: 1 }}>{title}</span>
        {minimized && minimizedSummary && (
          <span style={{ color: hudAccent, fontSize: HUD_FONT_SM }}>
            {minimizedSummary}
          </span>
        )}
        <button
          type="button"
          onClick={() => togglePanelMinimized(panelId)}
          aria-label={minimized ? `Expand ${title}` : `Minimize ${title}`}
          style={{
            border: "1px solid #1a3a2a",
            background: "transparent",
            color: hudAccent,
            borderRadius: "4px",
            width: "24px",
            height: "24px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <HudIcon icon={minimized ? MdExpandMore : MdExpandLess} size={16} />
        </button>
      </div>
      {!minimized && children}
    </div>
  );
});
