import { useEffect, useRef } from "react";
import { requestAircraftPoll, startAircraftSystem } from "../systems/aircraftSystem";
import { useAircraftStore } from "../store/useAircraftStore";
import { useCesiumStore } from "../store/useCesiumStore";

export function useAircraftSystemLifecycle(catalogReady: boolean): void {
  const cleanupRef = useRef<(() => void) | null>(null);
  const viewer = useCesiumStore((s) => s.viewer);
  const trafficViewMode = useAircraftStore((s) => s.trafficViewMode);

  useEffect(() => {
    if (!catalogReady) return;

    let disposed = false;

    void startAircraftSystem().then((cleanup) => {
      if (disposed) {
        cleanup();
        return;
      }
      cleanupRef.current = cleanup;
    });

    return () => {
      disposed = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [catalogReady]);

  useEffect(() => {
    if (!catalogReady || !viewer || trafficViewMode !== "aircraft") return;
    requestAircraftPoll();
  }, [catalogReady, viewer, trafficViewMode]);
}
