import { FILTERABLE_CATEGORIES } from "../../utils/aircraftCategory";
import { useAircraftStore } from "../../store/useAircraftStore";

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
        position: "absolute",
        top: "340px",
        left: "8px",
        width: "200px",
        background: "rgba(0,8,16,0.88)",
        border: "1px solid #1a3a2a",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "9px",
        zIndex: 100,
        padding: "6px 8px",
      }}
    >
      <div
        style={{
          color: "#4a6a5a",
          letterSpacing: "1px",
          marginBottom: "6px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>CATEGORY</span>
        <button
          type="button"
          onClick={() => setCategoryFilter(null)}
          style={{
            background: "transparent",
            border: "none",
            color: filter ? "#7a9a8a" : "#00ff88",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "9px",
          }}
        >
          ALL
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {FILTERABLE_CATEGORIES.map(({ code, label }) => {
          const on = !filter || filter.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              style={{
                padding: "3px 6px",
                borderRadius: "2px",
                border: `1px solid ${on ? "#00ff88" : "#1a3a2a"}`,
                background: on ? "rgba(0,255,136,0.12)" : "transparent",
                color: on ? "#00ff88" : "#5a6a6a",
                cursor: "pointer",
                fontFamily: "inherit",
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
