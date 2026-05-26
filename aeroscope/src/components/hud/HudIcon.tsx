import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import { hudAccent, hudMuted } from "./hudTheme";

export interface HudIconProps {
  icon: IconType;
  size?: number;
  color?: string;
  muted?: boolean;
  style?: CSSProperties;
  title?: string;
}

export function HudIcon({
  icon: Icon,
  size = 16,
  color,
  muted = false,
  style,
  title,
}: HudIconProps) {
  const fill = color ?? (muted ? hudMuted : hudAccent);

  return (
    <Icon
      size={size}
      color={fill}
      title={title}
      aria-hidden={title ? undefined : true}
      style={{ flexShrink: 0, display: "block", ...style }}
    />
  );
}
