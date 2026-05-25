import type { ReactNode } from "react";
import { HUD_FONT_MD, HUD_FONT_SM, hudMuted } from "./hudTheme";

export interface InspectorFieldProps {
  label: string;
  value: string | number | ReactNode;
}

export function InspectorField({ label, value }: InspectorFieldProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid #0d1f10",
        gap: "10px",
      }}
    >
      <span style={{ color: hudMuted, fontSize: HUD_FONT_SM }}>{label}</span>
      <span
        style={{
          color: "#ccddcc",
          fontFamily: "monospace",
          fontSize: HUD_FONT_MD,
        }}
      >
        {value}
      </span>
    </div>
  );
}
