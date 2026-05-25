import { useEffect, useState } from "react";
import {
  isFullCatalogLoaded,
  subscribeFullCatalogLoaded,
} from "../data/airportCatalog";

/** Re-renders when the full airport index finishes loading in the background. */
export function useFullCatalogLoaded(): boolean {
  const [loaded, setLoaded] = useState(isFullCatalogLoaded);

  useEffect(() => {
    if (loaded) return;
    return subscribeFullCatalogLoaded(() => {
      setLoaded(true);
    });
  }, [loaded]);

  return loaded;
}
