import { memo, useCallback } from "react";
import {
  hudAccent,
  hudMuted,
  HUD_FONT_MD,
  HUD_FONT_SM,
  hudText,
} from "./hudTheme";

export interface AirportPickerRowProps {
  id: string;
  name: string;
  municipality: string;
  isActive: boolean;
  onSelect: (icao: string) => void;
}

export const AirportPickerRow = memo(function AirportPickerRow({
  id,
  name,
  municipality,
  isActive,
  onSelect,
}: AirportPickerRowProps) {
  const handleClick = useCallback(() => {
    onSelect(id);
  }, [id, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        display: "block",
        width: "100%",
        padding: "10px 12px",
        textAlign: "left",
        background: isActive ? "rgba(0,255,136,0.12)" : "transparent",
        border: "none",
        borderBottom: "1px solid #0d1f10",
        color: isActive ? hudAccent : hudText,
        cursor: "pointer",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          letterSpacing: "0.5px",
          fontSize: HUD_FONT_MD,
        }}
      >
        {id}
      </div>
      <div
        style={{
          color: isActive ? "#5a8a6a" : hudMuted,
          fontSize: HUD_FONT_SM,
          marginTop: "3px",
        }}
      >
        {name}
        {municipality ? ` · ${municipality}` : ""}
      </div>
    </button>
  );
});
