import { useEffect } from "react";
import type { Viewer } from "cesium";
import {
  Cartesian2,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium";
import { airportIdFromPicks } from "../../utils/airportPick";
import { exitFollowFromUser } from "../../utils/cesiumCamera";
import { enrichSelectedAircraft } from "../../services/aircraftEnrichment";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useCesiumStore } from "../../store/useCesiumStore";
import { isViewerLive } from "../../utils/cesiumViewerReady";

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

function handleScenePick(viewer: Viewer, position: Cartesian2): void {
  const picks = viewer.scene.drillPick(position, 12);
  const state = useAircraftStore.getState();

  for (const pick of picks) {
    const id = entityIdString(pick.id);
    if (!id) continue;

    const ac = state.aircraft[id];
    if (ac) {
      const isSelected = state.selectedId === id;
      if (isSelected) {
        if (state.cameraMode === "follow") {
          exitFollowFromUser(viewer);
        }
        useAircraftStore.getState().selectAircraft(null);
      } else {
        useAircraftStore.getState().selectAircraft(id);
        useAircraftStore.getState().requestCameraFly("aircraft", id);
        void enrichSelectedAircraft(id);
      }
      return;
    }
  }

  const airportId = airportIdFromPicks(picks);
  if (!airportId) return;

  if (
    airportId === state.activeAirportId &&
    !state.activeAirportPickEnabled
  ) {
    return;
  }

  useAircraftStore.getState().setActiveAirport(airportId);
  useAircraftStore.getState().requestCameraFly("airport", airportId);
}

function resolveHoverAirport(
  viewer: Viewer,
  position: Cartesian2,
): string | null {
  const picks = viewer.scene.drillPick(position, 8);
  const state = useAircraftStore.getState();

  for (const pick of picks) {
    const id = entityIdString(pick.id);
    if (id && state.aircraft[id]) return null;
  }

  return airportIdFromPicks(picks);
}

export function ScenePickHandler() {
  const viewer = useCesiumStore((s) => s.viewer);

  useEffect(() => {
    if (!isViewerLive(viewer)) return;
    const currentViewer = viewer;

    const handler = new ScreenSpaceEventHandler(currentViewer.canvas);
    let hoverRaf = 0;

    const onPick = (position: Cartesian2) => {
      handleScenePick(currentViewer, position);
    };

    const useTouchPick =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    const pickEvent = useTouchPick
      ? ScreenSpaceEventType.LEFT_DOWN
      : ScreenSpaceEventType.LEFT_CLICK;

    handler.setInputAction(
      (evt: { position: Cartesian2 }) => onPick(evt.position),
      pickEvent,
    );

    handler.setInputAction((movement: { endPosition: Cartesian2 }) => {
      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = 0;
        const airportId = resolveHoverAirport(currentViewer, movement.endPosition);
        const canvas = currentViewer.canvas;
        if (airportId) {
          const activeId = useAircraftStore.getState().activeAirportId;
          if (airportId === activeId) {
            useAircraftStore.getState().setAirportHover(null, null);
            canvas.style.cursor = "pointer";
            return;
          }
          useAircraftStore.getState().setAirportHover(airportId, {
            x: movement.endPosition.x,
            y: movement.endPosition.y,
          });
          canvas.style.cursor = "pointer";
        } else {
          useAircraftStore.getState().setAirportHover(null, null);
          canvas.style.cursor = "";
        }
      });
    }, ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      if (currentViewer.canvas) {
        currentViewer.canvas.style.cursor = "";
      }
      useAircraftStore.getState().setAirportHover(null, null);
      if (!handler.isDestroyed()) {
        handler.destroy();
      }
    };
  }, [viewer]);

  return null;
}
