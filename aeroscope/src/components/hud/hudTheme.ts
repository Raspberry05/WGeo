import type { CSSProperties } from "react";

export const HUD_MOBILE_BREAKPOINT_PX = 768;
export const HUD_MOBILE_MEDIA = `(max-width: ${HUD_MOBILE_BREAKPOINT_PX}px)`;

/** Status bar stacks stats above brand / flight info below this width. */
export const HUD_STATUS_BAR_COMPACT_BREAKPOINT_PX = 1100;
export const HUD_STATUS_BAR_COMPACT_MEDIA = `(max-width: ${HUD_STATUS_BAR_COMPACT_BREAKPOINT_PX}px)`;

export const HUD_SIDEBAR_WIDTH = 320;
export const HUD_SIDEBAR_WIDTH_MOBILE = 300;
export const HUD_STATUS_BAR_MIN_HEIGHT = 52;
export const HUD_PANEL_GAP = 12;
export const HUD_FONT_SM = 13;
export const HUD_FONT_MD = 15;
export const HUD_FONT_LG = 17;
export const HUD_INSPECTOR_WIDTH = 360;
export const HUD_INSPECTOR_MAX_HEIGHT = "calc(100vh - 84px)";
export const HUD_TOUCH_MIN = 44;

export const hudPanelStyle: CSSProperties = {
  background: "rgba(0,8,16,0.92)",
  border: "1px solid #1a3a2a",
  borderRadius: "6px",
  fontFamily: "monospace",
};

/** Full-height left sidebar shell (behind grouped panels). */
export const hudSidebarStyle: CSSProperties = {
  background: "rgba(0, 8, 16, 0.94)",
  borderRight: "1px solid #1a3a2a",
  boxShadow: "4px 0 20px rgba(0, 0, 0, 0.4)",
  fontFamily: "monospace",
};

export const hudMuted = "#4a6a5a";
export const hudText = "#7a9a8a";
export const hudAccent = "#00ff88";

/** Append 2-digit hex alpha — avoid `${color}44` (parsed as octal escape in some bundlers). */
export function hexWithAlpha(color: string, alphaHex: string): string {
  return color + alphaHex;
}

/** Responsive horizontal inset for the status bar (sidebar + breathing room on desktop). */
export function statusBarHorizontalPadding(isMobile: boolean): {
  paddingLeft: string;
  paddingRight: string;
} {
  const edgeInset = "clamp(10px, 1.8vw, 28px)";
  const sidebarGap = "clamp(6px, 1vw, 18px)";
  if (isMobile) {
    return {
      paddingLeft: `max(${edgeInset}, env(safe-area-inset-left))`,
      paddingRight: `max(${edgeInset}, env(safe-area-inset-right))`,
    };
  }
  return {
    paddingLeft: `calc(${HUD_SIDEBAR_WIDTH}px + ${sidebarGap})`,
    paddingRight: `max(${edgeInset}, env(safe-area-inset-right))`,
  };
}

/** @deprecated Use statusBarHorizontalPadding */
export function statusBarPaddingLeft(isMobile: boolean): number {
  return isMobile ? 16 : HUD_SIDEBAR_WIDTH + 16;
}

export function inspectorLayout(isMobile: boolean, topBarHeight: number): {
  left: number | string;
  right: number | string;
  width: number | string;
  maxHeight: string;
  bottom: number | string;
  top?: number | string;
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
    left: "auto",
    right: 16,
    top: topBarHeight + 12,
    width: `min(${HUD_INSPECTOR_WIDTH}px, calc(100vw - ${HUD_SIDEBAR_WIDTH + 40}px))`,
    maxHeight: HUD_INSPECTOR_MAX_HEIGHT,
    bottom: "auto",
  };
}
