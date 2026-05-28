import { useEffect } from "react";
import {
  AIRCRAFT_VIEWPORT_ENABLED,
  TRAFFIC_VIEW_HUD_ENABLED,
} from "@/config/trafficView";
import { useAircraftStore } from "@/store/useAircraftStore";

/**
 * Keeps traffic mode consistent with feature flags.
 * Airport traffic is the default when the HUD toggle is hidden.
 */
export function useTrafficViewBootstrap(): void {
  useEffect(() => {
    const { trafficViewMode, setTrafficViewMode } = useAircraftStore.getState();

    if (!AIRCRAFT_VIEWPORT_ENABLED && trafficViewMode === "aircraft") {
      setTrafficViewMode("airport");
      return;
    }

    if (!TRAFFIC_VIEW_HUD_ENABLED && trafficViewMode === "aircraft") {
      setTrafficViewMode("airport");
    }
  }, []);
}
