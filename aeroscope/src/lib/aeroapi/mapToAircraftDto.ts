import { feetToMeters, resolveAltitudeMeters } from "@/utils/geoMath";
import { resolveCategoryLabel } from "@/utils/aircraftCategory";
import { classifyAircraft } from "@/domain/aircraft/aircraftClassification";
import { mapFlightToDetail } from "./mapFlightDetail";
import type { AeroFlight } from "./types";
import type { AircraftDto } from "./types";

const KNOTS_TO_MPS = 0.514444;

function airportIcao(ref: AeroFlight["origin"]): string | null {
  if (!ref) return null;
  const code = ref.code_icao ?? ref.code ?? ref.code_iata;
  return code ? String(code).toUpperCase() : null;
}

/** AeroAPI altitude is hundreds of feet or flight level → meters. */
export function aeroAltitudeToMeters(altHundreds: number | null | undefined): number {
  if (altHundreds == null || !Number.isFinite(altHundreds)) return 0;
  return feetToMeters(altHundreds * 100);
}

export function isUsableFlight(flight: AeroFlight): boolean {
  if (flight.blocked || flight.cancelled) return false;
  const pos = flight.last_position;
  if (!pos) return false;
  if (pos.latitude == null || pos.longitude == null) return false;
  if (!Number.isFinite(pos.latitude) || !Number.isFinite(pos.longitude)) {
    return false;
  }
  const id = flight.fa_flight_id?.trim();
  return Boolean(id);
}

export function mapFlightToDto(flight: AeroFlight): AircraftDto | null {
  if (!isUsableFlight(flight)) return null;

  const pos = flight.last_position!;
  const faFlightId = String(flight.fa_flight_id).trim();
  const registration = flight.registration?.trim() || null;
  const ident = flight.ident?.trim() || flight.ident_icao?.trim() || "";
  const callsign = (ident || registration || faFlightId).toUpperCase();

  const lat = Number(pos.latitude);
  const lon = Number(pos.longitude);
  const groundspeedKts = Number(pos.groundspeed ?? 0);
  const velocity = groundspeedKts * KNOTS_TO_MPS;
  const heading = Number(pos.heading ?? 0);
  const altitudeMeters = aeroAltitudeToMeters(pos.altitude);
  const onGround = altitudeMeters < 50 && groundspeedKts < 40;

  const { label } = resolveCategoryLabel(
    null,
    altitudeMeters,
    velocity,
    onGround,
  );

  const positionTimeMs = pos.timestamp
    ? Date.parse(pos.timestamp)
    : null;

  const originAirport = airportIcao(flight.origin);
  const destinationAirport = airportIcao(flight.destination);
  const aircraftModel = flight.aircraft_type?.trim() || null;
  const operatorName =
    flight.operator?.trim() || flight.operator_icao?.trim() || null;

  const displayId = registration ?? ident ?? faFlightId;
  const detail = mapFlightToDetail(flight, { operatorName, aircraftModel });
  const classification = classifyAircraft({
    aircraftModel,
  });

  return {
    id: faFlightId,
    faFlightId,
    registration,
    callsign,
    icao24: displayId.toUpperCase(),
    rawLat: lat,
    rawLon: lon,
    altitudeMeters: resolveAltitudeMeters(altitudeMeters, onGround),
    velocity,
    heading,
    onGround,
    aircraftType: aircraftModel ?? label,
    categoryCode: null,
    aircraftClass: classification.aircraftClass,
    wakeCategory: classification.wakeCategory,
    originCountry: "",
    operatorName,
    aircraftModel,
    originAirport,
    destinationAirport,
    positionTimeMs:
      positionTimeMs != null && Number.isFinite(positionTimeMs)
        ? positionTimeMs
        : null,
    detail,
  };
}

export function mapFlightsToDtos(flights: AeroFlight[]): AircraftDto[] {
  const out: AircraftDto[] = [];
  const seen = new Set<string>();

  for (const flight of flights) {
    const dto = mapFlightToDto(flight);
    if (!dto || seen.has(dto.id)) continue;
    seen.add(dto.id);
    out.push(dto);
  }

  return out;
}
