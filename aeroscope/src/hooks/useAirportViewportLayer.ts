import { useCallback, useEffect } from "react";
import type { Viewer } from "cesium";
import { getViewportIndex } from "../data/airportCatalog";
import { useFullCatalogLoaded } from "./useFullCatalogLoaded";
import type { AirportLayerRefs } from "../types/airportLayer";
import { addAirportPrimitive } from "../utils/airportPointStyles";

export type UseAirportViewportLayerParams = {
  viewer: Viewer | null;
  catalogReady: boolean;
  sceneTerrainReady: boolean;
  activeAirportId: string;
  trafficViewMode: "airport" | "aircraft";
  viewModeToken: number;
  layer: AirportLayerRefs;
};

function clearSmallAirportBillboards(layer: AirportLayerRefs): void {
  if (!layer.points) return;
  const collection = layer.points;
  for (const id of layer.smallAirportIds) {
    const primitive = layer.primitiveById.get(id);
    if (primitive) {
      collection.remove(primitive);
      layer.primitiveById.delete(id);
    }
  }
  layer.smallAirportIds.clear();
}

export function useAirportViewportLayer({
  viewer,
  catalogReady,
  sceneTerrainReady,
  activeAirportId,
  trafficViewMode,
  viewModeToken,
  layer,
}: UseAirportViewportLayerParams): void {
  const fullCatalogLoaded = useFullCatalogLoaded();

  const syncSmallAirportsInView = useCallback(
    (v: Viewer) => {
      if (trafficViewMode !== "airport") {
        clearSmallAirportBillboards(layer);
        return;
      }

      if (!fullCatalogLoaded || !layer.points) return;

      const collection = layer.points;
      const heights = layer.sampler?.cache ?? new Map();

      const rect = v.camera.computeViewRectangle();
      if (!rect) return;

      const west = rect.west;
      const south = rect.south;
      const east = rect.east;
      const north = rect.north;

      const index = getViewportIndex();
      if (!index) return;

      const visible = index.query(west, south, east, north);
      const nextIds = new Set(visible.map((r) => r.id));

      for (const id of layer.smallAirportIds) {
        if (nextIds.has(id)) continue;
        const primitive = layer.primitiveById.get(id);
        if (primitive) {
          collection.remove(primitive);
          layer.primitiveById.delete(id);
        }
        layer.smallAirportIds.delete(id);
      }

      for (const record of visible) {
        if (layer.primitiveById.has(record.id)) continue;
        const primitive = addAirportPrimitive(
          collection,
          record,
          record.id === activeAirportId,
          heights,
        );
        layer.primitiveById.set(record.id, primitive);
        layer.smallAirportIds.add(record.id);
      }
    },
    [fullCatalogLoaded, layer, activeAirportId, trafficViewMode],
  );

  useEffect(() => {
    if (!viewer || !catalogReady) return;
    if (trafficViewMode !== "airport") {
      clearSmallAirportBillboards(layer);
      return;
    }
    if (fullCatalogLoaded) {
      syncSmallAirportsInView(viewer);
    }
  }, [
    viewer,
    catalogReady,
    fullCatalogLoaded,
    trafficViewMode,
    viewModeToken,
    syncSmallAirportsInView,
    layer,
  ]);

  useEffect(() => {
    if (!viewer || !catalogReady || trafficViewMode !== "airport") return;

    const onMoveEnd = (): void => {
      syncSmallAirportsInView(viewer);
      if (sceneTerrainReady) {
        layer.sampler?.sampleViewport();
      }
    };

    viewer.camera.moveEnd.addEventListener(onMoveEnd);
    syncSmallAirportsInView(viewer);

    return () => {
      viewer.camera.moveEnd.removeEventListener(onMoveEnd);
    };
  }, [
    viewer,
    catalogReady,
    sceneTerrainReady,
    trafficViewMode,
    viewModeToken,
    syncSmallAirportsInView,
    layer,
  ]);
}
