"use client";

import { useCallback } from "react";
import { MdLocalAirport } from "react-icons/md";
import {
  AIRPORT_FILTER_OPTIONS,
  type AirportType,
} from "@/config/airportFilters";
import { useAircraftStore } from "@/store/useAircraftStore";
import { HudPanel } from "./HudPanel";
import { hudAccent, HUD_FONT_SM, hudText } from "./hudTheme";

function filterSummary(filter: AirportType[] | null): string {
  if (filter === null) return "ALL";
  if (filter.length === 0) return "NONE";
  if (filter.length === 1) {
    const opt = AIRPORT_FILTER_OPTIONS.find((o) => o.type === filter[0]);
    return opt?.shortLabel ?? filter[0]!;
  }
  return `${filter.length} types`;
}

export function AirportTypeFilter() {
  const filter = useAircraftStore((s) => s.airportTypeFilter);
  const setAirportTypeFilter = useAircraftStore((s) => s.setAirportTypeFilter);
  const bumpAirportFilterToken = useAircraftStore(
    (s) => s.bumpAirportFilterToken,
  );

  const toggle = useCallback(
    (type: AirportType) => {
      if (filter === null) {
        const allExcept = AIRPORT_FILTER_OPTIONS.map((o) => o.type).filter(
          (t) => t !== type,
        );
        setAirportTypeFilter(allExcept);
        bumpAirportFilterToken();
        return;
      }
      if (filter.includes(type)) {
        const next = filter.filter((t) => t !== type);
        setAirportTypeFilter(next.length ? next : []);
        bumpAirportFilterToken();
      } else {
        setAirportTypeFilter([...filter, type]);
        bumpAirportFilterToken();
      }
    },
    [filter, setAirportTypeFilter, bumpAirportFilterToken],
  );

  const showAll = useCallback(() => {
    setAirportTypeFilter(null);
    bumpAirportFilterToken();
  }, [setAirportTypeFilter, bumpAirportFilterToken]);

  const showInternationalOnly = useCallback(() => {
    setAirportTypeFilter(["large_airport"]);
    bumpAirportFilterToken();
  }, [setAirportTypeFilter, bumpAirportFilterToken]);

  const isActive = (type: AirportType): boolean =>
    filter === null || filter.includes(type);

  return (
    <HudPanel
      panelId="airport-type-filter"
      title="FILTER"
      titleIcon={MdLocalAirport}
      minimizedSummary={filterSummary(filter)}
      flexShrink={0}
    >
      <div
        style={{
          padding: "0 12px 8px",
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={showAll}
          style={{
            background: "transparent",
            border: "none",
            color: filter === null ? hudAccent : hudText,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: HUD_FONT_SM,
            padding: "4px 8px",
          }}
        >
          ALL
        </button>
        <button
          type="button"
          onClick={showInternationalOnly}
          style={{
            background: "transparent",
            border: "none",
            color:
              filter?.length === 1 && filter[0] === "large_airport"
                ? hudAccent
                : hudText,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: HUD_FONT_SM,
            padding: "4px 8px",
          }}
        >
          INTL
        </button>
      </div>
      <div
        style={{
          padding: "0 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {AIRPORT_FILTER_OPTIONS.map((option) => {
          const active = isActive(option.type);
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => toggle(option.type)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "8px 10px",
                background: active ? "rgba(0,255,136,0.08)" : "transparent",
                border: `1px solid ${active ? "rgba(0,255,136,0.45)" : "#1a3a2a"}`,
                borderRadius: "4px",
                color: active ? hudAccent : hudText,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: HUD_FONT_SM,
                textAlign: "left",
              }}
            >
              <span>{option.label}</span>
              <span style={{ opacity: 0.65, fontSize: "10px" }}>
                {option.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </HudPanel>
  );
}
