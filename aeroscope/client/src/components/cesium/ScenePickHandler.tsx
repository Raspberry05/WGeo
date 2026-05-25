import { useEffect } from "react";
import {
  Cartesian2,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium";
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

function isAirportEntityId(id: string): boolean {
  return id.startsWith("airport-");
}

export function ScenePickHandler() {
  const viewer = useCesiumStore((s) => s.viewer);

  useEffect(() => {
    if (!viewer) return;

    const handler = new ScreenSpaceEventHandler(viewer.canvas);

    handler.setInputAction((click: { position: Cartesian2 }) => {
      const picks = viewer.scene.drillPick(click.position, 8);
      const state = useAircraftStore.getState();

      for (const pick of picks) {
        const id = entityIdString(pick.id);
        if (!id || isAirportEntityId(id)) continue;

        const ac = state.aircraft[id];
        if (!ac) continue;

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

      for (const pick of picks) {
        const id = entityIdString(pick.id);
        if (!id || !isAirportEntityId(id)) continue;

        const airportId = id.replace(/^airport-/, "");
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
