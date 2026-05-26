import type { FlightDetailDto } from "@/lib/aeroapi/types";
import {
  formatDelayMinutes,
  formatFlightStatusLabel,
  formatScheduleTime,
} from "@/utils/flightScheduleDisplay";
import { InspectorField } from "./InspectorField";
import { hudMuted, HUD_FONT_SM } from "./hudTheme";

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        marginTop: "12px",
        marginBottom: "6px",
        fontSize: HUD_FONT_SM,
        color: hudMuted,
        letterSpacing: "1.5px",
        borderBottom: "1px solid #1a3a2a",
        paddingBottom: "4px",
      }}
    >
      {children}
    </div>
  );
}

function ScheduleRow({
  label,
  scheduled,
  estimated,
  actual,
}: {
  label: string;
  scheduled: string | null;
  estimated: string | null;
  actual: string | null;
}) {
  if (!scheduled && !estimated && !actual) return null;
  return (
    <InspectorField
      label={label}
      value={
        <span style={{ display: "block", lineHeight: 1.5 }}>
          {scheduled && (
            <span>
              SCH {formatScheduleTime(scheduled)}
              <br />
            </span>
          )}
          {estimated && (
            <span>
              EST {formatScheduleTime(estimated)}
              <br />
            </span>
          )}
          {actual && <span>ACT {formatScheduleTime(actual)}</span>}
          {!scheduled && !estimated && !actual && "—"}
        </span>
      }
    />
  );
}

export interface InspectorScheduleSectionProps {
  detail: FlightDetailDto | null;
  trackLoading: boolean;
}

export function InspectorScheduleSection({
  detail,
  trackLoading,
}: InspectorScheduleSectionProps) {
  if (!detail) {
    return (
      <SectionTitle>
        {trackLoading ? "LOADING FLIGHT DATA…" : "FLIGHT DATA"}
      </SectionTitle>
    );
  }

  return (
    <>
      <SectionTitle>FLIGHT</SectionTitle>
      <InspectorField
        label="STATUS"
        value={formatFlightStatusLabel(detail.flightStatus)}
      />
      {detail.progressPercent != null && (
        <InspectorField
          label="PROGRESS"
          value={`${Math.round(detail.progressPercent)}%`}
        />
      )}
      {detail.flightType && (
        <InspectorField label="TYPE" value={detail.flightType.toUpperCase()} />
      )}
      {(detail.cancelled || detail.diverted || detail.blocked) && (
        <InspectorField
          label="FLAGS"
          value={[
            detail.cancelled && "CANCELLED",
            detail.diverted && "DIVERTED",
            detail.blocked && "BLOCKED",
          ]
            .filter(Boolean)
            .join(" · ")}
        />
      )}

      <SectionTitle>SCHEDULE (UTC)</SectionTitle>
      <ScheduleRow
        label="OUT"
        scheduled={detail.scheduledOut}
        estimated={detail.estimatedOut}
        actual={detail.actualOut}
      />
      <ScheduleRow
        label="OFF"
        scheduled={detail.scheduledOff}
        estimated={detail.estimatedOff}
        actual={detail.actualOff}
      />
      <ScheduleRow
        label="ON"
        scheduled={detail.scheduledOn}
        estimated={detail.estimatedOn}
        actual={detail.actualOn}
      />
      <ScheduleRow
        label="IN"
        scheduled={detail.scheduledIn}
        estimated={detail.estimatedIn}
        actual={detail.actualIn}
      />

      <SectionTitle>GATES</SectionTitle>
      <InspectorField
        label="ORIGIN GATE"
        value={detail.gateOrigin ?? "—"}
      />
      <InspectorField
        label="DEST GATE"
        value={detail.gateDestination ?? "—"}
      />
      <InspectorField
        label="ORIGIN TERM"
        value={detail.terminalOrigin ?? "—"}
      />
      <InspectorField
        label="DEST TERM"
        value={detail.terminalDestination ?? "—"}
      />
      <InspectorField
        label="BAGGAGE"
        value={detail.baggageClaim ?? "—"}
      />

      <SectionTitle>DELAYS</SectionTitle>
      <InspectorField
        label="DEPARTURE"
        value={formatDelayMinutes(detail.departureDelay)}
      />
      <InspectorField
        label="ARRIVAL"
        value={formatDelayMinutes(detail.arrivalDelay)}
      />
    </>
  );
}
