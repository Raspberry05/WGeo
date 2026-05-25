import { useEffect } from "react";
import {
  Cartesian2,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium";
import { airportIdFromPickId } from "./AirportEntities";
import { enrichSelectedAircraft } from "../../services/aircraftEnrichment";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useCesiumStore } from "../../store/useCesiumStore";

function entityIdString(id: unknown): string | null {
  if (id == null) return null;
  if (typeof id === "string") return id;
  if (
    typeof id === "object" &&
    "id" in id &&
    typeof (id as { id: string }).id === "string"
  ) {
    return (id as { id: string }).id;
  }
  return String(id);
}

export function ScenePickHandler() {
  const viewer = useCesiumStore((s) => s.viewer);

  useEffect(() => {
    if (!viewer) return;

    const handler = new ScreenSpaceEventHandler(viewer.canvas);

    handler.setInputAction((click: { position: Cartesian2 }) => {
      const picks = viewer.scene.drillPick(click.position, 12);
      const state = useAircraftStore.getState();

      for (const pick of picks) {
        const id = entityIdString(pick.id);
        if (!id) continue;

        const ac = state.aircraft[id];
        if (ac) {
          const isSelected = state.selectedId === id;
          if (isSelected) {
            useAircraftStore.getState().selectAircraft(null);
          } else {
            useAircraftStore.getState().selectAircraft(id);
            useAircraftStore.getState().requestCameraFly("aircraft", id);
            void enrichSelectedAircraft(id);
          }
          return;
        }
      }

      for (const pick of picks) {
        const airportId = airportIdFromPickId(pick.id);
        if (!airportId) continue;

        if (
          airportId === state.activeAirportId &&
          !state.activeAirportPickEnabled
        ) {
          return;
        }

        useAircraftStore.getState().setActiveAirport(airportId);
        useAircraftStore.getState().requestCameraFly("airport", airportId);
        return;
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [viewer]);

  return null;
}
