import type { Airport, AirportBounds } from "../data/airports";
import type { FlightBounds } from "../lib/aeroapi/bounds";
import type { AircraftDto, FlightDetailDto, FlightTrackDto } from "../lib/aeroapi/types";
import type { AircraftState } from "../store/useAircraftStore";
import {
  classifyStatus,
  geoToSceneForAirport,
  geoToSceneForReference,
  haversineKm,
} from "../utils/geoMath";
import { MAX_VIEWPORT_AIRCRAFT } from "../config/trafficView";
import {
  type CameraRect,
  getRectCenter,
  isLatLonInCameraRect,
} from "../utils/cameraBounds";

function boundsToQuery(bounds: AirportBounds | FlightBounds | FlightBounds[]): string {
  // Airport + legacy single-box flow
  if (!Array.isArray(bounds)) {
    const params = new URLSearchParams({
      lamin: String(bounds.lamin),
      lomin: String(bounds.lomin),
      lamax: String(bounds.lamax),
      lomax: String(bounds.lomax),
    });
    return params.toString();
  }

  // Multi-box flow (antimeridian split).
  const params = new URLSearchParams();
  for (const b of bounds) {
    params.append("box", `${b.lamin},${b.lomin},${b.lamax},${b.lomax}`);
  }
  return params.toString();
}

export type SceneReference = {
  mode: "airport";
  airport: Airport;
} | {
  mode: "viewport";
  refLat: number;
  refLon: number;
};

function dtoToAircraftState(
  dto: AircraftDto,
  scene: SceneReference,
  receivedAtMs: number,
): AircraftState {
  const status = classifyStatus(
    dto.altitudeMeters,
    dto.velocity,
    dto.onGround,
  );

  const position =
    scene.mode === "airport"
      ? geoToSceneForAirport(
          dto.rawLat,
          dto.rawLon,
          dto.altitudeMeters,
          scene.airport.id,
        )
      : geoToSceneForReference(
          dto.rawLat,
          dto.rawLon,
          dto.altitudeMeters,
          scene.refLat,
          scene.refLon,
        );

  return {
    id: dto.id,
    faFlightId: dto.faFlightId,
    registration: dto.registration,
    callsign: dto.callsign,
    icao24: dto.icao24,
    position,
    rawLat: dto.rawLat,
    rawLon: dto.rawLon,
    altitudeMeters: dto.altitudeMeters,
    velocity: dto.velocity,
    heading: dto.heading,
    onGround: dto.onGround,
    status,
    aircraftType: dto.aircraftType,
    categoryCode: dto.categoryCode,
    aircraftClass: dto.aircraftClass,
    wakeCategory: dto.wakeCategory,
    originCountry: dto.originCountry,
    operatorName: dto.operatorName,
    aircraftModel: dto.aircraftModel,
    originAirport: dto.originAirport,
    destinationAirport: dto.destinationAirport,
    flightDetail: dto.detail,
    lastUpdated: receivedAtMs,
    positionTimeMs: dto.positionTimeMs,
  };
}

async function fetchFlightsDto(
  bounds: FlightBounds | FlightBounds[],
  options?: { signal?: AbortSignal },
): Promise<AircraftDto[]> {
  const res = await fetch(`/api/flights?${boundsToQuery(bounds)}`, {
    signal: options?.signal,
  });

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      console.warn(`Flights API unavailable (${res.status})`);
      return [];
    }
    throw new Error(`Flights API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    aircraft?: AircraftDto[];
    error?: string;
    hint?: string;
  };

  if (data.error) {
    console.error("Flights API error:", data.error, data.hint ?? "");
    throw new Error(data.error);
  }

  return data.aircraft ?? [];
}

function sortByDistanceToCenter(
  dtos: AircraftDto[],
  centerLat: number,
  centerLon: number,
): AircraftDto[] {
  return [...dtos].sort((a, b) => {
    const da = haversineKm(a.rawLat, a.rawLon, centerLat, centerLon);
    const db = haversineKm(b.rawLat, b.rawLon, centerLat, centerLon);
    return da - db;
  });
}

export async function fetchFlightsInBounds(
  bounds: FlightBounds | FlightBounds[],
  scene: SceneReference,
  options?: {
    maxAircraft?: number;
    centerLat?: number;
    centerLon?: number;
    cameraRect?: CameraRect;
    signal?: AbortSignal;
  },
): Promise<AircraftState[]> {
  let dtos = await fetchFlightsDto(bounds, { signal: options?.signal });
  if (dtos.length === 0) return [];

  const receivedAtMs = Date.now();
  const centerLat =
    options?.centerLat ??
    (scene.mode === "airport" ? scene.airport.lat : scene.refLat);
  const centerLon =
    options?.centerLon ??
    (scene.mode === "airport" ? scene.airport.lon : scene.refLon);

  if (scene.mode === "viewport" && options?.cameraRect) {
    const rect = options.cameraRect;
    dtos = dtos.filter((dto) =>
      isLatLonInCameraRect(dto.rawLat, dto.rawLon, rect),
    );
    if (dtos.length === 0) return [];
  }

  const max = options?.maxAircraft ?? MAX_VIEWPORT_AIRCRAFT;
  let limited = dtos;

  if (scene.mode === "viewport" && dtos.length > max) {
    const viewCenter =
      options?.cameraRect != null
        ? getRectCenter(options.cameraRect)
        : { lat: centerLat, lon: centerLon };
    limited = sortByDistanceToCenter(
      dtos,
      viewCenter.lat,
      viewCenter.lon,
    ).slice(0, max);
  }

  const states = limited.map((dto) =>
    dtoToAircraftState(dto, scene, receivedAtMs),
  );

  if (scene.mode === "airport") {
    const airport = scene.airport;
    return states.filter(
      (ac) =>
        haversineKm(ac.rawLat, ac.rawLon, airport.lat, airport.lon) <=
        airport.radiusKm,
    );
  }

  return states;
}

export async function fetchFlightsAircraft(
  airport: Airport,
): Promise<AircraftState[]> {
  return fetchFlightsInBounds(airport.bounds, { mode: "airport", airport });
}

export async function fetchFlightDetail(
  flightId: string,
): Promise<FlightDetailDto | null> {
  try {
    const res = await fetch(
      `/api/flights/enrich/${encodeURIComponent(flightId)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as FlightDetailDto;
  } catch {
    return null;
  }
}

export async function fetchFlightTrack(
  flightId: string,
): Promise<FlightTrackDto> {
  const empty: FlightTrackDto = { positions: [] };
  try {
    const res = await fetch(
      `/api/flights/${encodeURIComponent(flightId)}/track`,
    );
    if (!res.ok) return empty;
    return (await res.json()) as FlightTrackDto;
  } catch {
    return empty;
  }
}
