import { useEffect, useRef } from "react";
import { startAircraftSystem } from "../systems/aircraftSystem";

export function useAircraftSystemLifecycle(catalogReady: boolean): void {
  const cleanupRef = useRef<(() => void) | null>(null);

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
}
