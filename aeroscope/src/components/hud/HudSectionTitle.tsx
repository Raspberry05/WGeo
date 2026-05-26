import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { HudIcon } from "./HudIcon";
import { hudMuted, HUD_FONT_SM } from "./hudTheme";

export interface HudSectionTitleProps {
  children: ReactNode;
  icon?: IconType;
}

export function HudSectionTitle({ children, icon }: HudSectionTitleProps) {
  return (
    <div
      style={{
        marginTop: "12px",
        marginBottom: "6px",
        fontSize: HUD_FONT_SM,
        color: hudMuted,
        letterSpacing: "1.5px",
        borderBottom: "1px solid #1a3a2a",
        paddingBottom: "4px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {icon && <HudIcon icon={icon} size={14} muted />}
      <span>{children}</span>
    </div>
  );
}
