import { useEffect, useState } from "react";
import { useAircraftStore } from "@/store/useAircraftStore";
import { useCesiumStore } from "@/store/useCesiumStore";

export type BootPhase = "globe" | "catalog" | null;

export type BootPhaseState = {
  phase: BootPhase;
  message: string;
};

const MESSAGES: Record<Exclude<BootPhase, null>, string> = {
  globe: "Loading globe…",
  catalog: "Loading airports…",
};

/**
 * One-time startup overlay (globe + airport catalog only).
 * Air traffic polling uses the status bar CONNECTING indicator — no full-screen loader.
 */
export function useBootPhase(catalogError: string | null): BootPhaseState {
  const globeBootReady = useCesiumStore((s) => s.globeBootReady);
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);
  const [initialBootDone, setInitialBootDone] = useState(false);

  useEffect(() => {
    if (globeBootReady && catalogReady && !catalogError) {
      setInitialBootDone(true);
    }
  }, [globeBootReady, catalogReady, catalogError]);

  if (catalogError) {
    return { phase: null, message: "" };
  }

  if (initialBootDone) {
    return { phase: null, message: "" };
  }

  if (!globeBootReady) {
    return { phase: "globe", message: MESSAGES.globe };
  }

  if (!catalogReady) {
    return { phase: "catalog", message: MESSAGES.catalog };
  }

  return { phase: null, message: "" };
}
