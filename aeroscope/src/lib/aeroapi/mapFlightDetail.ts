import type { AeroAirportRef, AeroFlight, FlightDetailDto } from "./types";

function airportIcao(ref: AeroAirportRef | null | undefined): string | null {
  if (!ref) return null;
  const code = ref.code_icao ?? ref.code ?? ref.code_iata;
  return code ? String(code).toUpperCase() : null;
}

function str(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function num(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return v;
}

export function mapFlightToDetail(
  flight: AeroFlight,
  overrides?: {
    operatorName?: string | null;
    aircraftModel?: string | null;
  },
): FlightDetailDto {
  const faFlightId = String(flight.fa_flight_id ?? "").trim();
  const operatorName =
    overrides?.operatorName ??
    str(flight.operator) ??
    str(flight.operator_icao);
  const aircraftModel =
    overrides?.aircraftModel ?? str(flight.aircraft_type);

  return {
    faFlightId,
    ident: str(flight.ident),
    identIcao: str(flight.ident_icao),
    identIata: str(flight.ident_iata),
    registration: str(flight.registration),
    operatorName,
    aircraftModel,
    aircraftType: str(flight.aircraft_type),
    originAirport: airportIcao(flight.origin),
    destinationAirport: airportIcao(flight.destination),
    flightStatus: str(flight.status),
    progressPercent: num(flight.progress_percent),
    flightType: str(flight.type),
    cancelled: Boolean(flight.cancelled),
    diverted: Boolean(flight.diverted),
    blocked: Boolean(flight.blocked),
    departureDelay: num(flight.departure_delay),
    arrivalDelay: num(flight.arrival_delay),
    scheduledOut: str(flight.scheduled_out),
    estimatedOut: str(flight.estimated_out),
    actualOut: str(flight.actual_out),
    scheduledOff: str(flight.scheduled_off),
    estimatedOff: str(flight.estimated_off),
    actualOff: str(flight.actual_off),
    scheduledOn: str(flight.scheduled_on),
    estimatedOn: str(flight.estimated_on),
    actualOn: str(flight.actual_on),
    scheduledIn: str(flight.scheduled_in),
    estimatedIn: str(flight.estimated_in),
    actualIn: str(flight.actual_in),
    gateOrigin: str(flight.gate_origin),
    gateDestination: str(flight.gate_destination),
    terminalOrigin: str(flight.terminal_origin),
    terminalDestination: str(flight.terminal_destination),
    baggageClaim: str(flight.baggage_claim),
  };
}

export function detailToAircraftPatch(
  detail: FlightDetailDto,
): Record<string, unknown> {
  return {
    operatorName: detail.operatorName,
    aircraftModel: detail.aircraftModel,
    originAirport: detail.originAirport,
    destinationAirport: detail.destinationAirport,
    flightDetail: detail,
  };
}
