import { useAircraftStore } from "../../store/useAircraftStore";
import {
  formatDistanceToAirport,
  routeDistanceNm,
} from "../../utils/aircraftDistance";
import {
  AirportFlag,
  CountryFlagByName,
} from "../../utils/countryFlags";
import {
  estimateMassKg,
  formatAltitudeFeet,
  formatSpeedKnots,
  formatUtcDateTime,
} from "../../utils/flightUnits";
import { AlternatingWeight } from "./AlternatingWeight";

export function AircraftInspector() {
  const selectedId = useAircraftStore((s) => s.selectedId);
  const aircraft = useAircraftStore((s) => s.aircraft);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const setCameraMode = useAircraftStore((s) => s.setCameraMode);
  const cameraMode = useAircraftStore((s) => s.cameraMode);

  const ac = selectedId ? aircraft[selectedId] : null;
  if (!ac) return null;

  const STATUS_COLORS: Record<string, string> = {
    airborne: "#00ff88",
    landing: "#ffaa00",
    taxiing: "#00aaff",
    parked: "#666666",
  };
  const color = STATUS_COLORS[ac.status] ?? "#ffffff";

  const brand = ac.aircraftModel ?? ac.operatorName ?? "—";
  const origin = ac.originAirport?.toUpperCase() ?? "—";
  const dest = ac.destinationAirport?.toUpperCase() ?? "—";
  const routeNm = routeDistanceNm(ac.originAirport, ac.destinationAirport);
  const massKg = estimateMassKg(ac.categoryCode);

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | React.ReactNode;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: "1px solid #0d1f10",
        gap: "8px",
      }}
    >
      <span style={{ color: "#4a6a5a", fontSize: "10px" }}>{label}</span>
      <span
        style={{ color: "#ccddcc", fontFamily: "monospace", fontSize: "11px" }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        left: "8px",
        width: "200px",
        zIndex: 101,
        background: "rgba(0,8,16,0.92)",
        border: `1px solid ${color}44`,
        borderTop: `2px solid ${color}`,
        borderRadius: "4px",
        padding: "10px",
        fontFamily: "monospace",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CountryFlagByName countryName={ac.originCountry} size={20} />
          <div>
            <div
              style={{
                color,
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              {ac.callsign}
            </div>
            <div style={{ color: "#4a6a5a", fontSize: "9px" }}>
              {ac.icao24.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <Field label="CATEGORY" value={ac.aircraftType} />
      <Field label="BRAND / TYPE" value={brand} />
      <Field
        label="ROUTE"
        value={
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <AirportFlag icao={ac.originAirport} />
            {origin}
            <span style={{ color: "#4a6a5a" }}>→</span>
            <AirportFlag icao={ac.destinationAirport} />
            {dest}
          </span>
        }
      />
      {routeNm !== null && (
        <Field
          label="ROUTE DIST"
          value={`${routeNm < 10 ? routeNm.toFixed(1) : Math.round(routeNm)} NM`}
        />
      )}
      <Field
        label="FROM FIELD"
        value={formatDistanceToAirport(ac.rawLat, ac.rawLon, activeAirportId)}
      />
      <Field label="COUNTRY" value={ac.originCountry || "—"} />
      <Field label="STATUS" value={ac.status.toUpperCase()} />
      <Field
        label="ALTITUDE"
        value={formatAltitudeFeet(ac.altitudeMeters)}
      />
      <Field label="SPEED" value={formatSpeedKnots(ac.velocity)} />
      <Field label="HEADING" value={`${Math.round(ac.heading)}°`} />
      <Field
        label="WEIGHT (EST)"
        value={<AlternatingWeight massKg={massKg} />}
      />
      <Field
        label="LAST FIX"
        value={formatUtcDateTime(ac.lastUpdated)}
      />

      <button
        type="button"
        onClick={() =>
          setCameraMode(cameraMode === "follow" ? "free" : "follow")
        }
        style={{
          marginTop: "8px",
          width: "100%",
          padding: "5px",
          background: cameraMode === "follow" ? `${color}22` : "transparent",
          border: `1px solid ${color}66`,
          color,
          fontFamily: "monospace",
          fontSize: "10px",
          cursor: "pointer",
          borderRadius: "2px",
          letterSpacing: "1px",
        }}
      >
        {cameraMode === "follow" ? "◉ FOLLOWING" : "○ FOLLOW"}
      </button>
    </div>
  );
}
