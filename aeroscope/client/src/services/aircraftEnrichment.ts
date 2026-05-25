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

    const patch: Partial<AircraftState> = {
      operatorName: data.operatorName,
      aircraftModel: data.aircraftModel,
      originAirport: data.originAirport,
      destinationAirport: data.destinationAirport,
    };

    if (data.aircraftModel) {
      patch.aircraftModel = data.aircraftModel;
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

    useAircraftStore.getState().enrichAircraft(icao24, patch);
  } finally {
    enrichmentInflight.delete(icao24);
  }
}
