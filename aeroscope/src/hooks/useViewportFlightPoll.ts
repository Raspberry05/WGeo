import { useEffect, useRef } from "react";
import {
  AIRCRAFT_VIEWPORT_ENABLED,
  VIEWPORT_POLL_DEBOUNCE_MS,
} from "@/config/trafficView";
import { requestAircraftPoll } from "@/systems/aircraftSystem";
import { useAircraftStore } from "@/store/useAircraftStore";
import { useCesiumStore } from "@/store/useCesiumStore";
import { getViewportBounds } from "@/utils/cameraBounds";
import { viewportChunkKeys } from "@/utils/viewportChunks";

/**
 * Debounced refetch when the camera stops moving in aircraft traffic mode.
 */
export function useViewportFlightPoll(): void {
  const viewer = useCesiumStore((s) => s.viewer);
  const trafficViewMode = useAircraftStore((s) => s.trafficViewMode);
  const viewModeToken = useAircraftStore((s) => s.viewModeToken);

  useEffect(() => {
    if (!AIRCRAFT_VIEWPORT_ENABLED) return;
    if (trafficViewMode === "aircraft" && viewer) {
      requestAircraftPoll();
    }
  }, [trafficViewMode, viewModeToken, viewer]);

  const lastChunkKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!AIRCRAFT_VIEWPORT_ENABLED || !viewer || trafficViewMode !== "aircraft") {
      return;
    }

    lastChunkKeyRef.current = null;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const onMoveEnd = (): void => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const viewport = getViewportBounds(viewer);
        if (!viewport) return;

        const chunkKey = viewportChunkKeys(viewport.bounds);
        if (chunkKey === lastChunkKeyRef.current) return;

        lastChunkKeyRef.current = chunkKey;
        requestAircraftPoll();
      }, VIEWPORT_POLL_DEBOUNCE_MS);
    };

    viewer.camera.moveEnd.addEventListener(onMoveEnd);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      viewer.camera.moveEnd.removeEventListener(onMoveEnd);
    };
  }, [viewer, trafficViewMode, viewModeToken]);
}
