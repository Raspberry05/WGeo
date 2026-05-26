import { aeroFetch } from "./client";
import { mapFlightToDetail } from "./mapFlightDetail";
import type {
  AeroAircraftTypeResponse,
  AeroFlightInfoResponse,
  AeroOwnerResponse,
  FlightDetailDto,
} from "./types";

const DETAIL_TTL_MS = 300_000;

const detailCache = new Map<
  string,
  { data: FlightDetailDto; lastFetch: number }
>();

/** FlightAware fa_flight_id (e.g. UAL1234-1234567890-airline-0123). */
export function isValidFaFlightId(flightId: string): boolean {
  const id = flightId.trim();
  if (id.length < 8 || id.length > 120) return false;
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id);
}

export async function fetchFlightDetail(
  faFlightId: string,
): Promise<FlightDetailDto | null> {
  const id = faFlightId.trim();
  if (!isValidFaFlightId(id)) {
    throw new Error("Invalid flight id");
  }

  const cached = detailCache.get(id);
  if (cached && Date.now() - cached.lastFetch < DETAIL_TTL_MS) {
    return cached.data;
  }

  const info = await aeroFetch<AeroFlightInfoResponse>(
    `/flights/${encodeURIComponent(id)}`,
    { searchParams: { ident_type: "fa_flight_id", max_pages: "1" } },
  );

  const flight = info.flights?.[0];
  if (!flight) return null;

  let operatorName: string | null =
    flight.operator?.trim() || flight.operator_icao?.trim() || null;
  let aircraftModel: string | null = flight.aircraft_type?.trim() || null;

  const reg = flight.registration?.trim();
  if (reg) {
    try {
      const owner = await aeroFetch<AeroOwnerResponse>(
        `/aircraft/${encodeURIComponent(reg)}/owner`,
      );
      if (owner.owner?.name) {
        operatorName = owner.owner.name;
      }
    } catch {
      /* owner optional */
    }
  }

  const typeCode = flight.aircraft_type?.trim();
  if (typeCode) {
    try {
      const typeInfo = await aeroFetch<AeroAircraftTypeResponse>(
        `/aircraft/types/${encodeURIComponent(typeCode)}`,
      );
      aircraftModel =
        typeInfo.description?.trim() ||
        typeInfo.type?.trim() ||
        aircraftModel;
    } catch {
      /* type lookup optional */
    }
  }

  const data = mapFlightToDetail(flight, { operatorName, aircraftModel });
  detailCache.set(id, { data, lastFetch: Date.now() });
  return data;
}
