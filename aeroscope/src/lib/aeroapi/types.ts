export type AeroAirportRef = {
  code?: string | null;
  code_icao?: string | null;
  code_iata?: string | null;
  name?: string | null;
  city?: string | null;
};

export type AeroPosition = {
  fa_flight_id?: string | null;
  altitude?: number | null;
  altitude_change?: string | null;
  groundspeed?: number | null;
  heading?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: string | null;
  update_type?: string | null;
};

/** Shared flight fields from search and `/flights/{id}`. */
export type AeroFlight = {
  ident?: string | null;
  ident_icao?: string | null;
  ident_iata?: string | null;
  fa_flight_id?: string | null;
  registration?: string | null;
  aircraft_type?: string | null;
  operator?: string | null;
  operator_icao?: string | null;
  blocked?: boolean | null;
  cancelled?: boolean | null;
  diverted?: boolean | null;
  position_only?: boolean | null;
  status?: string | null;
  progress_percent?: number | null;
  type?: string | null;
  departure_delay?: number | null;
  arrival_delay?: number | null;
  scheduled_out?: string | null;
  estimated_out?: string | null;
  actual_out?: string | null;
  scheduled_off?: string | null;
  estimated_off?: string | null;
  actual_off?: string | null;
  scheduled_on?: string | null;
  estimated_on?: string | null;
  actual_on?: string | null;
  scheduled_in?: string | null;
  estimated_in?: string | null;
  actual_in?: string | null;
  gate_origin?: string | null;
  gate_destination?: string | null;
  terminal_origin?: string | null;
  terminal_destination?: string | null;
  baggage_claim?: string | null;
  origin?: AeroAirportRef | null;
  destination?: AeroAirportRef | null;
  last_position?: AeroPosition | null;
  first_position_time?: string | null;
};

export type AeroSearchResponse = {
  flights?: AeroFlight[] | null;
  num_pages?: number | null;
  links?: { next?: string | null } | null;
};

export type AeroFlightInfoResponse = {
  flights?: AeroFlight[] | null;
};

export type AeroTrackPosition = {
  timestamp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  groundspeed?: number | null;
  heading?: number | null;
};

export type AeroTrackResponse = {
  positions?: AeroTrackPosition[] | null;
};

export type AeroOwnerResponse = {
  owner?: {
    name?: string | null;
    location?: string | null;
    website?: string | null;
  } | null;
};

export type AeroAircraftTypeResponse = {
  manufacturer?: string | null;
  type?: string | null;
  description?: string | null;
};

export type AeroAccountUsageResponse = {
  account?: {
    name?: string | null;
    tier?: string | null;
  } | null;
  usage?: {
    requests?: number | null;
    limit?: number | null;
  } | null;
};

/** Schedule / gate / status fields for HUD (from search or detail). */
export type FlightDetailDto = {
  faFlightId: string;
  ident: string | null;
  identIcao: string | null;
  identIata: string | null;
  registration: string | null;
  operatorName: string | null;
  aircraftModel: string | null;
  aircraftType: string | null;
  originAirport: string | null;
  destinationAirport: string | null;
  flightStatus: string | null;
  progressPercent: number | null;
  flightType: string | null;
  cancelled: boolean;
  diverted: boolean;
  blocked: boolean;
  departureDelay: number | null;
  arrivalDelay: number | null;
  scheduledOut: string | null;
  estimatedOut: string | null;
  actualOut: string | null;
  scheduledOff: string | null;
  estimatedOff: string | null;
  actualOff: string | null;
  scheduledOn: string | null;
  estimatedOn: string | null;
  actualOn: string | null;
  scheduledIn: string | null;
  estimatedIn: string | null;
  actualIn: string | null;
  gateOrigin: string | null;
  gateDestination: string | null;
  terminalOrigin: string | null;
  terminalDestination: string | null;
  baggageClaim: string | null;
};

export type TrackPositionDto = {
  lat: number;
  lon: number;
  altMeters: number;
  timestamp: string | null;
};

export type FlightTrackDto = {
  positions: TrackPositionDto[];
};

/** Serializable aircraft row returned from /api/flights. */
export type AircraftDto = {
  id: string;
  faFlightId: string;
  registration: string | null;
  callsign: string;
  icao24: string;
  rawLat: number;
  rawLon: number;
  altitudeMeters: number;
  velocity: number;
  heading: number;
  onGround: boolean;
  aircraftType: string;
  categoryCode: number | null;
  aircraftClass: import("@/domain/aircraft/openAircraftType").AircraftClass | null;
  wakeCategory: import("@/domain/aircraft/openAircraftType").WakeTurbulenceCategory | null;
  originCountry: string;
  operatorName: string | null;
  aircraftModel: string | null;
  originAirport: string | null;
  destinationAirport: string | null;
  positionTimeMs: number | null;
  detail: FlightDetailDto | null;
};

/** @deprecated Use FlightDetailDto from enrich route. */
export type AircraftEnrichmentDto = Pick<
  FlightDetailDto,
  "operatorName" | "aircraftModel" | "originAirport" | "destinationAirport"
>;
