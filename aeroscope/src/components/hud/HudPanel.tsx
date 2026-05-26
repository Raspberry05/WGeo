import { memo, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { HudIcon } from "./HudIcon";
import { hudMuted, hudPanelStyle, HUD_FONT_SM } from "./hudTheme";

export interface HudPanelProps {
  title: string;
  titleIcon?: IconType;
  children: ReactNode;
  maxHeight?: string;
  minHeight?: string;
  flexShrink?: number;
  flex?: number;
}

export const HudPanel = memo(function HudPanel({
  title,
  titleIcon,
  children,
  maxHeight,
  minHeight,
  flexShrink = 0,
  flex,
}: HudPanelProps) {
  return (
    <div
      style={{
        ...hudPanelStyle,
        display: "flex",
        flexDirection: "column",
        maxHeight,
        minHeight,
        flexShrink,
        flex,
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
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
});
