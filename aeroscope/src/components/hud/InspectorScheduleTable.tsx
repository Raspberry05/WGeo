import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import { MdDoorFront, MdFlightLand, MdFlightTakeoff } from "react-icons/md";
import { FaClock } from "react-icons/fa6";
import type { FlightDetailDto } from "@/lib/aeroapi/types";
import { formatScheduleTime } from "@/utils/flightScheduleDisplay";
import { HudIcon } from "./HudIcon";
import { hudMuted, HUD_FONT_SM, hudText } from "./hudTheme";

type ScheduleRowDef = {
  key: string;
  label: string;
  icon: IconType;
  scheduled: string | null;
  estimated: string | null;
  actual: string | null;
};

function buildRows(detail: FlightDetailDto): ScheduleRowDef[] {
  const rows: ScheduleRowDef[] = [
    {
      key: "out",
      label: "OUT",
      icon: FaClock,
      scheduled: detail.scheduledOut,
      estimated: detail.estimatedOut,
      actual: detail.actualOut,
    },
    {
      key: "off",
      label: "OFF",
      icon: MdFlightTakeoff,
      scheduled: detail.scheduledOff,
      estimated: detail.estimatedOff,
      actual: detail.actualOff,
    },
    {
      key: "on",
      label: "ON",
      icon: MdFlightLand,
      scheduled: detail.scheduledOn,
      estimated: detail.estimatedOn,
      actual: detail.actualOn,
    },
    {
      key: "in",
      label: "IN",
      icon: MdDoorFront,
      scheduled: detail.scheduledIn,
      estimated: detail.estimatedIn,
      actual: detail.actualIn,
    },
  ];

  return rows.filter((r) => r.scheduled || r.estimated || r.actual);
}

const thStyle: CSSProperties = {
  color: hudMuted,
  fontSize: HUD_FONT_SM,
  fontWeight: "normal",
  textAlign: "left",
  padding: "4px 6px",
  borderBottom: "1px solid #1a3a2a",
};

const tdStyle: CSSProperties = {
  color: hudText,
  fontSize: HUD_FONT_SM,
  padding: "4px 6px",
  borderBottom: "1px solid #0d1f10",
  whiteSpace: "nowrap",
};

function RowLabel({ icon, label }: { icon: IconType; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: hudMuted,
      }}
    >
      <HudIcon icon={icon} size={14} muted />
      {label}
    </span>
  );
}

export interface InspectorScheduleTableProps {
  detail: FlightDetailDto;
}

export function InspectorScheduleTable({ detail }: InspectorScheduleTableProps) {
  const rows = buildRows(detail);
  if (rows.length === 0) return null;

  return (
    <div style={{ overflowX: "auto", marginTop: "4px" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "monospace",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle} />
            <th style={thStyle}>SCH</th>
            <th style={thStyle}>EST</th>
            <th style={thStyle}>ACT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td style={tdStyle}>
                <RowLabel icon={row.icon} label={row.label} />
              </td>
              <td style={tdStyle}>{formatScheduleTime(row.scheduled)}</td>
              <td style={tdStyle}>{formatScheduleTime(row.estimated)}</td>
              <td style={tdStyle}>{formatScheduleTime(row.actual)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
