import { aeroFetch } from "./client";
import { aeroAltitudeToMeters } from "./mapToAircraftDto";
import { isValidFaFlightId } from "./flightDetail";
import type { AeroTrackResponse, FlightTrackDto, TrackPositionDto } from "./types";

const TRACK_TTL_MS = 300_000;

const trackCache = new Map<
  string,
  { data: FlightTrackDto; lastFetch: number }
>();

export async function fetchFlightTrack(
  faFlightId: string,
): Promise<FlightTrackDto> {
  const id = faFlightId.trim();
  if (!isValidFaFlightId(id)) {
    throw new Error("Invalid flight id");
  }

  const cached = trackCache.get(id);
  if (cached && Date.now() - cached.lastFetch < TRACK_TTL_MS) {
    return cached.data;
  }

  const body = await aeroFetch<AeroTrackResponse>(
    `/flights/${encodeURIComponent(id)}/track`,
    { searchParams: { ident_type: "fa_flight_id", max_pages: "1" } },
  );

  const positions: TrackPositionDto[] = [];

  for (const pos of body.positions ?? []) {
    const lat = pos.latitude;
    const lon = pos.longitude;
    if (lat == null || lon == null) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    positions.push({
      lat: Number(lat),
      lon: Number(lon),
      altMeters: aeroAltitudeToMeters(pos.altitude),
      timestamp: pos.timestamp?.trim() || null,
    });
  }

  const data: FlightTrackDto = { positions };
  trackCache.set(id, { data, lastFetch: Date.now() });
  return data;
}
