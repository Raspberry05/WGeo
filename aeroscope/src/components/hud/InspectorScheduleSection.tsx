import type { FlightDetailDto } from "@/lib/aeroapi/types";
import { FaDoorClosed, FaDoorOpen } from "react-icons/fa6";
import {
  MdFlightLand,
  MdFlightTakeoff,
  MdInfoOutline,
  MdLuggage,
  MdSchedule,
  MdTimer,
} from "react-icons/md";
import {
  formatDelayMinutes,
  formatFlightStatusLabel,
} from "@/utils/flightScheduleDisplay";
import { HudSectionTitle } from "./HudSectionTitle";
import { InspectorField } from "./InspectorField";
import { InspectorGrid } from "./InspectorGrid";
import { InspectorScheduleTable } from "./InspectorScheduleTable";
import { hexWithAlpha, hudAccent, HUD_FONT_SM } from "./hudTheme";

function StatusChips({ detail }: { detail: FlightDetailDto }) {
  const chips: string[] = [];
  if (detail.flightStatus) {
    chips.push(formatFlightStatusLabel(detail.flightStatus));
  }
  if (detail.progressPercent != null) {
    chips.push(`${Math.round(detail.progressPercent)}%`);
  }
  if (detail.flightType) {
    chips.push(detail.flightType.toUpperCase());
  }
  if (detail.cancelled) chips.push("CANCELLED");
  if (detail.diverted) chips.push("DIVERTED");
  if (detail.blocked) chips.push("BLOCKED");

  if (chips.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginTop: "4px",
      }}
    >
      {chips.map((chip) => (
        <span
          key={chip}
          style={{
            fontSize: HUD_FONT_SM,
            padding: "2px 8px",
            borderRadius: "4px",
            border: `1px solid ${hexWithAlpha(hudAccent, "44")}`,
            color: hudAccent,
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

export interface InspectorScheduleSectionProps {
  detail: FlightDetailDto | null;
  trackLoading: boolean;
  isMobile: boolean;
}

export function InspectorScheduleSection({
  detail,
  trackLoading,
  isMobile,
}: InspectorScheduleSectionProps) {
  if (!detail) {
    return (
      <HudSectionTitle icon={MdInfoOutline}>
        {trackLoading ? "LOADING FLIGHT DATA…" : "FLIGHT DATA"}
      </HudSectionTitle>
    );
  }

  return (
    <>
      <HudSectionTitle icon={MdInfoOutline}>FLIGHT</HudSectionTitle>
      <StatusChips detail={detail} />

      <HudSectionTitle icon={MdSchedule}>SCHEDULE (UTC)</HudSectionTitle>
      <InspectorScheduleTable detail={detail} />

      <HudSectionTitle icon={FaDoorOpen}>GATES</HudSectionTitle>
      <InspectorGrid isMobile={isMobile} columns={isMobile ? 1 : 2}>
        <InspectorField
          layout="stack"
          icon={FaDoorOpen}
          label="ORIGIN GATE"
          value={detail.gateOrigin ?? "—"}
        />
        <InspectorField
          layout="stack"
          icon={FaDoorClosed}
          label="DEST GATE"
          value={detail.gateDestination ?? "—"}
        />
        <InspectorField
          layout="stack"
          icon={MdLuggage}
          label="ORIGIN TERM"
          value={detail.terminalOrigin ?? "—"}
        />
        <InspectorField
          layout="stack"
          icon={MdLuggage}
          label="DEST TERM"
          value={detail.terminalDestination ?? "—"}
        />
        <InspectorField
          layout="stack"
          icon={MdLuggage}
          label="BAGGAGE"
          value={detail.baggageClaim ?? "—"}
        />
      </InspectorGrid>

      <HudSectionTitle icon={MdTimer}>DELAYS</HudSectionTitle>
      <InspectorGrid isMobile={isMobile} columns={2}>
        <InspectorField
          layout="stack"
          icon={MdFlightTakeoff}
          label="DEPARTURE"
          value={formatDelayMinutes(detail.departureDelay)}
        />
        <InspectorField
          layout="stack"
          icon={MdFlightLand}
          label="ARRIVAL"
          value={formatDelayMinutes(detail.arrivalDelay)}
        />
      </InspectorGrid>
    </>
  );
}
