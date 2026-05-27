import { useCesiumStore } from "../../store/useCesiumStore";
import {
  selectActiveAirportId,
  selectAirportCatalogReady,
  selectSceneTerrainReady,
  selectCesiumViewer,
} from "../../store/selectors";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useActiveAirportOverlay } from "../../hooks/useActiveAirportOverlay";
import { useAirportGlobalLayer } from "../../hooks/useAirportGlobalLayer";
export function AirportEntities() {
  const viewer = useCesiumStore(selectCesiumViewer);
  const sceneTerrainReady = useCesiumStore(selectSceneTerrainReady);
  const catalogReady = useAircraftStore(selectAirportCatalogReady);
  const activeAirportId = useAircraftStore(selectActiveAirportId);
  const trafficViewMode = useAircraftStore((s) => s.trafficViewMode);
  const viewModeToken = useAircraftStore((s) => s.viewModeToken);
  const airportTypeFilter = useAircraftStore((s) => s.airportTypeFilter);
  const airportFilterToken = useAircraftStore((s) => s.airportFilterToken);

  const layer = useAirportGlobalLayer({
    viewer,
    catalogReady,
    sceneTerrainReady,
    activeAirportId,
    trafficViewMode,
    viewModeToken,
    airportTypeFilter,
    airportFilterToken,
  });

  useActiveAirportOverlay({
    viewer,
    catalogReady,
    sceneTerrainReady,
    activeAirportId,
    trafficViewMode,
    viewModeToken,
    layer,
  });

  return null;
}
