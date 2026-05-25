import { FILTERABLE_CATEGORIES } from "../../utils/aircraftCategory";
import { useAircraftStore } from "../../store/useAircraftStore";
import {
  hudAccent,
  hudMuted,
  hudPanelStyle,
  HUD_FONT_SM,
  hudText,
} from "./hudTheme";

export function CategoryFilter() {
  const filter = useAircraftStore((s) => s.categoryFilter);
  const setCategoryFilter = useAircraftStore((s) => s.setCategoryFilter);

  const toggle = (code: number) => {
    if (!filter) {
      setCategoryFilter([code]);
      return;
    }
    if (filter.includes(code)) {
      const next = filter.filter((c) => c !== code);
      setCategoryFilter(next.length ? next : null);
    } else {
      setCategoryFilter([...filter, code]);
    }
  };

  return (
    <div
      style={{
        ...hudPanelStyle,
        flexShrink: 0,
        padding: "10px 12px",
        fontSize: HUD_FONT_SM,
      }}
    >
      <div
        style={{
          color: hudMuted,
          letterSpacing: "1px",
          marginBottom: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>CATEGORY</span>
        <button
          type="button"
          onClick={() => setCategoryFilter(null)}
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {FILTERABLE_CATEGORIES.map(({ code, label }) => {
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
    </div>
  );
}
