import { useEffect, useRef } from "react";
import { startAircraftSystem } from "../systems/aircraftSystem";

export function useAircraftSystemLifecycle(catalogReady: boolean): void {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!catalogReady) return;

    void startAircraftSystem().then((cleanup) => {
      cleanupRef.current = cleanup;
    });

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [catalogReady]);
}
