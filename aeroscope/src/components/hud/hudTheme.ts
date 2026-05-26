import type { CSSProperties } from "react";

export const HUD_MOBILE_BREAKPOINT_PX = 768;
export const HUD_MOBILE_MEDIA = `(max-width: ${HUD_MOBILE_BREAKPOINT_PX}px)`;

export const HUD_SIDEBAR_WIDTH = 300;
export const HUD_SIDEBAR_WIDTH_MOBILE = 300;
export const HUD_STATUS_BAR_MIN_HEIGHT = 52;
export const HUD_PANEL_GAP = 12;
export const HUD_FONT_SM = 13;
export const HUD_FONT_MD = 15;
export const HUD_FONT_LG = 17;
export const HUD_INSPECTOR_WIDTH = 560;
export const HUD_INSPECTOR_MAX_HEIGHT = "min(70dvh, calc(100vh - 88px))";
export const HUD_TOUCH_MIN = 44;

export const hudPanelStyle: CSSProperties = {
  background: "rgba(0,8,16,0.92)",
  border: "1px solid #1a3a2a",
  borderRadius: "6px",
  fontFamily: "monospace",
};

export const hudMuted = "#4a6a5a";
export const hudText = "#7a9a8a";
export const hudAccent = "#00ff88";

/** Append 2-digit hex alpha — avoid `${color}44` (parsed as octal escape in some bundlers). */
export function hexWithAlpha(color: string, alphaHex: string): string {
  return color + alphaHex;
}

export function statusBarPaddingLeft(isMobile: boolean): number {
  return isMobile ? 16 : HUD_SIDEBAR_WIDTH + 16;
}

export function inspectorLayout(isMobile: boolean): {
  left: number | string;
  right: number | string;
  width: number | string;
  maxHeight: string;
  bottom: number | string;
} {
  if (isMobile) {
    return {
      left: 0,
      right: 0,
      width: "auto",
      maxHeight: "40dvh",
      bottom: 0,
    };
  }
  return {
    left: HUD_SIDEBAR_WIDTH + 16,
    right: "auto",
    width: `min(${HUD_INSPECTOR_WIDTH}px, calc(100vw - ${HUD_SIDEBAR_WIDTH + 32}px))`,
    maxHeight: HUD_INSPECTOR_MAX_HEIGHT,
    bottom: 16,
  };
}
