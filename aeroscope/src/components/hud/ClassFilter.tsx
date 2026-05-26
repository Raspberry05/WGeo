import { useCallback } from "react";
import { MdFilterAlt } from "react-icons/md";
import {
  AIRCRAFT_CLASS_OPTIONS,
  type AircraftClass,
} from "@/domain/aircraft/openAircraftType";
import { useAircraftStore } from "../../store/useAircraftStore";
import { HudPanel } from "./HudPanel";
import { hudAccent, HUD_FONT_SM, hudText } from "./hudTheme";

export function ClassFilter() {
  const filter = useAircraftStore((s) => s.classFilter);
  const setClassFilter = useAircraftStore((s) => s.setClassFilter);

  const toggle = useCallback(
    (code: AircraftClass) => {
      if (!filter) {
        setClassFilter([code]);
        return;
      }
      if (filter.includes(code)) {
        const next = filter.filter((c) => c !== code);
        setClassFilter(next.length ? next : null);
      } else {
        setClassFilter([...filter, code]);
      }
    },
    [filter, setClassFilter],
  );

  return (
    <HudPanel title="CLASS" titleIcon={MdFilterAlt} flexShrink={0}>
      <div
        style={{
          padding: "0 12px 10px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={() => setClassFilter(null)}
          style={{
            background: "transparent",
            border: "none",
            color: filter ? hudText : hudAccent,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: HUD_FONT_SM,
            padding: "4px 8px",
          }}
        >
          ALL
        </button>
      </div>
      <div
        style={{
          padding: "0 12px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
        }}
      >
        {AIRCRAFT_CLASS_OPTIONS.map(({ code, label }) => {
          const on = !filter || filter.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border: `1px solid ${on ? hudAccent : "#1a3a2a"}`,
                background: on ? "rgba(0,255,136,0.12)" : "transparent",
                color: on ? hudAccent : "#5a6a6a",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: HUD_FONT_SM,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </HudPanel>
  );
}

