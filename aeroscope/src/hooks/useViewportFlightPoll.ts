import { useEffect } from "react";
import { VIEWPORT_POLL_DEBOUNCE_MS } from "@/config/trafficView";
import { requestAircraftPoll } from "@/systems/aircraftSystem";
import { useAircraftStore } from "@/store/useAircraftStore";
import { useCesiumStore } from "@/store/useCesiumStore";

/**
 * Debounced refetch when the camera stops moving in aircraft traffic mode.
 */
export function useViewportFlightPoll(): void {
  const viewer = useCesiumStore((s) => s.viewer);
  const trafficViewMode = useAircraftStore((s) => s.trafficViewMode);
  const viewModeToken = useAircraftStore((s) => s.viewModeToken);

  useEffect(() => {
    if (trafficViewMode === "aircraft" && viewer) {
      requestAircraftPoll();
    }
  }, [trafficViewMode, viewModeToken, viewer]);

  useEffect(() => {
    if (!viewer || trafficViewMode !== "aircraft") return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const onMoveEnd = (): void => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
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
