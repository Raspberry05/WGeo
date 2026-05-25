import type { useAircraftStore } from "./useAircraftStore";
import type { useCesiumStore } from "./useCesiumStore";

type AircraftState = ReturnType<typeof useAircraftStore.getState>;
type CesiumState = ReturnType<typeof useCesiumStore.getState>;

export const selectActiveAirportId = (s: AircraftState) => s.activeAirportId;
export const selectAirportCatalogReady = (s: AircraftState) => s.airportCatalogReady;
export const selectSelectedAircraftId = (s: AircraftState) => s.selectedId;
export const selectCesiumViewer = (s: CesiumState) => s.viewer;
export const selectSceneTerrainReady = (s: CesiumState) => s.sceneTerrainReady;
