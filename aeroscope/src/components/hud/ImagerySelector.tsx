import { useCallback } from "react";
import { MdLayers } from "react-icons/md";
import { useMapSettingsStore, type BaseImagery } from "@/store/useMapSettingsStore";
import { HudPanel } from "./HudPanel";
import { hudAccent, HUD_FONT_SM, hudText } from "./hudTheme";

const OPTIONS: ReadonlyArray<{ code: BaseImagery; label: string }> = [
  { code: "ion_default", label: "Cesium Ion (default)" },
  { code: "osm", label: "OpenStreetMap" },
  { code: "esri_world_imagery", label: "Esri World Imagery" },
  { code: "bing_aerial", label: "Bing Aerial" },
  { code: "bing_road", label: "Bing Road" },
];

export function ImagerySelector() {
  const baseImagery = useMapSettingsStore((s) => s.baseImagery);
  const setBaseImagery = useMapSettingsStore((s) => s.setBaseImagery);

  const select = useCallback(
    (code: BaseImagery) => setBaseImagery(code),
    [setBaseImagery],
  );

  return (
    <HudPanel title="IMAGERY" titleIcon={MdLayers} flexShrink={0}>
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <select
          value={baseImagery}
          onChange={(e) => select(e.target.value as BaseImagery)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 10px",
            background: "rgba(0,16,32,0.9)",
            border: "1px solid #1a3a2a",
            borderRadius: "4px",
            color: hudText,
            fontFamily: "monospace",
            fontSize: HUD_FONT_SM,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {OPTIONS.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </select>

        <div style={{ fontSize: HUD_FONT_SM, color: hudAccent, opacity: 0.75 }}>
          Base layer updates on selection.
        </div>
      </div>
    </HudPanel>
  );
}

