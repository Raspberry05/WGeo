import type { AircraftState } from "../store/useAircraftStore";
import { fetchAircraftEnrichment } from "./opensky";
import { useAircraftStore } from "../store/useAircraftStore";
import { resolveCategoryLabel } from "../utils/aircraftCategory";

const enrichmentInflight = new Set<string>();

export async function enrichSelectedAircraft(icao24: string): Promise<void> {
  if (enrichmentInflight.has(icao24)) return;
  enrichmentInflight.add(icao24);

  try {
    const data = await fetchAircraftEnrichment(icao24);
    const ac = useAircraftStore.getState().aircraft[icao24];
    if (!ac) return;

    const patch: Partial<AircraftState> = {};

    if (data.operatorName != null) {
      patch.operatorName = data.operatorName;
    }
    if (data.aircraftModel) {
      patch.aircraftModel = data.aircraftModel;
    }
    if (data.originAirport) {
      patch.originAirport = data.originAirport;
    }
    if (data.destinationAirport) {
      patch.destinationAirport = data.destinationAirport;
    }

    if (ac.categoryCode === null && data.aircraftModel) {
      const inferred = resolveCategoryLabel(
        null,
        ac.altitudeMeters,
        ac.velocity,
        ac.onGround,
      );
      patch.aircraftType = inferred.label;
    }

    if (Object.keys(patch).length > 0) {
      useAircraftStore.getState().enrichAircraft(icao24, patch);
    }
  } finally {
    enrichmentInflight.delete(icao24);
  }
}
