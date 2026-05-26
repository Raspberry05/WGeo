import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { HudIcon } from "./HudIcon";
import { HUD_FONT_MD, HUD_FONT_SM, hudMuted } from "./hudTheme";

export interface InspectorFieldProps {
  label: string;
  value: string | number | ReactNode;
  layout?: "row" | "stack";
  icon?: IconType;
}

function LabelWithIcon({
  label,
  icon,
}: {
  label: string;
  icon?: IconType;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: hudMuted,
        fontSize: HUD_FONT_SM,
      }}
    >
      {icon && <HudIcon icon={icon} size={13} muted />}
      {label}
    </span>
  );
}

export function InspectorField({
  label,
  value,
  layout = "row",
  icon,
}: InspectorFieldProps) {
  if (layout === "stack") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "4px 0",
        }}
      >
        <LabelWithIcon label={label} icon={icon} />
        <span
          style={{
            color: "#ccddcc",
            fontFamily: "monospace",
            fontSize: HUD_FONT_MD,
            lineHeight: 1.35,
          }}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "4px 0",
        gap: "8px",
      }}
    >
      <LabelWithIcon label={label} icon={icon} />
      <span
        style={{
          color: "#ccddcc",
          fontFamily: "monospace",
          fontSize: HUD_FONT_MD,
          textAlign: "right",
          lineHeight: 1.35,
        }}
      >
        {value}
      </span>
    </div>
  );
}
