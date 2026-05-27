import { FaDoorOpen } from "react-icons/fa6";
import { MdHeight, MdRoute, MdSpeed } from "react-icons/md";
import type { AircraftState } from "../../store/useAircraftStore";
import { formatScheduleTime } from "../../utils/flightScheduleDisplay";
import {
  AirportFlag,
  CountryFlagByName,
  FlagIcon,
} from "../../utils/countryFlags";
import { countryNameToIso2 } from "../../utils/countryFlagUtils";
import { formatAltitudeFeet, formatSpeedKnots } from "../../utils/flightUnits";
import { formatRouteSummary } from "../../utils/routeDisplay";
import { HudIcon } from "./HudIcon";
import styles from "./statusBar.module.css";
import { hudMuted } from "./hudTheme";

export interface StatusBarSelectedSummaryProps {
  selected: AircraftState;
}

export function StatusBarSelectedSummary({
  selected,
}: StatusBarSelectedSummaryProps) {
  const brand =
    selected.aircraftModel ??
    selected.operatorName ??
    selected.aircraftType ??
    null;

  const regIso = countryNameToIso2(selected.originCountry);
  const routeDisplay = formatRouteSummary(
    selected.originAirport,
    selected.destinationAirport,
    selected.onGround,
  );

  return (
    <div className={styles.selectedBlock}>
      <CountryFlagByName countryName={selected.originCountry} size={20} />
      <span className={styles.callsign}>{selected.callsign}</span>
      <span className={styles.sep}>|</span>
      <span>{selected.aircraftType}</span>
      <span className={styles.sep}>|</span>
      <span className={styles.metric}>
        <HudIcon icon={MdHeight} size={14} color="#00ccff" />
        {formatAltitudeFeet(selected.altitudeMeters)}
      </span>
      <span className={styles.sep}>|</span>
      <span className={styles.metric}>
        <HudIcon icon={MdSpeed} size={14} color="#00ccff" />
        {formatSpeedKnots(selected.velocity)}
      </span>
      {brand && (
        <>
          <span className={styles.sep}>|</span>
          <span style={{ color: "#ccddcc" }}>{brand}</span>
        </>
      )}
      <span className={styles.sep}>|</span>
      <span className={styles.routeRow}>
        <HudIcon icon={MdRoute} size={14} muted />
        {routeDisplay.hasAnyRoute ? (
          <>
            <AirportFlag icao={selected.originAirport} />
            <span>{routeDisplay.origin}</span>
            <span style={{ color: hudMuted }}>→</span>
            <AirportFlag icao={selected.destinationAirport} />
            <span>{routeDisplay.destination}</span>
          </>
        ) : (
          <span style={{ color: hudMuted }}>No flight plan</span>
        )}
      </span>
      {regIso && (
        <FlagIcon iso2={regIso} size={18} title={selected.originCountry} />
      )}
      {selected.flightDetail && (
        <>
          <span className={styles.sep}>|</span>
          <span className={styles.schedule}>
            <HudIcon icon={FaDoorOpen} size={13} muted />
            {selected.flightDetail.gateOrigin
              ? `G${selected.flightDetail.gateOrigin}`
              : "—"}
            {" · "}
            ETD{" "}
            {formatScheduleTime(
              selected.flightDetail.estimatedOut ??
                selected.flightDetail.scheduledOut,
            )}
            {" · "}
            ETA{" "}
            {formatScheduleTime(
              selected.flightDetail.estimatedIn ??
                selected.flightDetail.scheduledIn,
            )}
          </span>
        </>
      )}
    </div>
  );
}
