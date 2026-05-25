import { useEffect, useState } from "react";
import { loadAirportCatalog } from "../data/airports";
import { useAircraftStore } from "../store/useAircraftStore";

export type AirportCatalogBootstrapState = {
  catalogReady: boolean;
  catalogError: string | null;
};

export function useAirportCatalogBootstrap(): AirportCatalogBootstrapState {
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadAirportCatalog()
      .then(() => {
        if (!cancelled) {
          useAircraftStore.getState().setAirportCatalogReady(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCatalogError(
            err instanceof Error ? err.message : "Failed to load airports",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalogReady, catalogError };
}
