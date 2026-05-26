import type { FlightDetailDto } from "../lib/aeroapi/types";
import { detailToAircraftPatch } from "../lib/aeroapi/mapFlightDetail";
import type { AircraftState } from "../store/useAircraftStore";
import { fetchFlightDetail, fetchFlightTrack } from "./flights";
import { useAircraftStore } from "../store/useAircraftStore";
import { resolveCategoryLabel } from "../utils/aircraftCategory";

const enrichmentInflight = new Set<string>();
const trackInflight = new Set<string>();

function applyDetailPatch(
  ac: AircraftState,
  detail: FlightDetailDto,
): Partial<AircraftState> {
  const patch = detailToAircraftPatch(detail) as Partial<AircraftState>;

  if (ac.categoryCode === null && detail.aircraftModel) {
    const inferred = resolveCategoryLabel(
      null,
      ac.altitudeMeters,
      ac.velocity,
      ac.onGround,
    );
    patch.aircraftType = inferred.label;
  }

  return patch;
}

export async function enrichSelectedAircraft(flightId: string): Promise<void> {
  if (enrichmentInflight.has(flightId)) return;
  enrichmentInflight.add(flightId);

  try {
    const detail = await fetchFlightDetail(flightId);
    if (!detail) return;

    const ac = useAircraftStore.getState().aircraft[flightId];
    if (!ac) return;

    const patch = applyDetailPatch(ac, detail);
    if (Object.keys(patch).length > 0) {
      useAircraftStore.getState().enrichAircraft(flightId, patch);
    }
  } finally {
    enrichmentInflight.delete(flightId);
  }
}

export async function loadTrackForSelected(flightId: string): Promise<void> {
  if (trackInflight.has(flightId)) return;

  const ac = useAircraftStore.getState().aircraft[flightId];
  if (!ac?.faFlightId) return;

  const detail = ac.flightDetail;
  if (detail?.blocked) {
    useAircraftStore.getState().setTrackLoading(null);
    return;
  }

  trackInflight.add(flightId);
  useAircraftStore.getState().setTrackLoading(flightId);

  try {
    const track = await fetchFlightTrack(flightId);
    if (useAircraftStore.getState().selectedId !== flightId) return;

    useAircraftStore.getState().setTrackForFlight(
      flightId,
      track.positions.map((p) => ({
        lat: p.lat,
        lon: p.lon,
        altMeters: p.altMeters,
        timestamp: p.timestamp,
      })),
    );
  } finally {
    trackInflight.delete(flightId);
    if (useAircraftStore.getState().trackLoadingId === flightId) {
      useAircraftStore.getState().setTrackLoading(null);
    }
  }
}
