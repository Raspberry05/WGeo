import { useCallback, useEffect } from "react";
import type { Viewer } from "cesium";
import { AIRPORT_SMALL_AIRPORT_MAX_CAMERA_M } from "../config/airportPointVisuals";
import { getViewportIndex } from "../data/airportCatalog";
import { useFullCatalogLoaded } from "./useFullCatalogLoaded";
import type { AirportLayerRefs } from "../types/airportLayer";
import { addAirportPrimitive } from "../utils/airportPointStyles";

export type UseAirportViewportLayerParams = {
  viewer: Viewer | null;
  catalogReady: boolean;
  sceneTerrainReady: boolean;
  activeAirportId: string;
  layer: AirportLayerRefs;
};

export function useAirportViewportLayer({
  viewer,
  catalogReady,
  sceneTerrainReady,
  activeAirportId,
  layer,
}: UseAirportViewportLayerParams): void {
  const fullCatalogLoaded = useFullCatalogLoaded();

  const syncSmallAirportsInView = useCallback(
    (v: Viewer) => {
      if (!fullCatalogLoaded || !layer.points) return;

      const height = v.camera.positionCartographic.height;
      const collection = layer.points;
      const heights = layer.sampler?.cache ?? new Map();

      if (height >= AIRPORT_SMALL_AIRPORT_MAX_CAMERA_M) {
        for (const id of layer.smallAirportIds) {
          const primitive = layer.primitiveById.get(id);
          if (primitive) {
            collection.remove(primitive);
            layer.primitiveById.delete(id);
          }
        }
        layer.smallAirportIds.clear();
        return;
      }

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
    [fullCatalogLoaded, layer, activeAirportId],
  );

  useEffect(() => {
    if (!viewer || !catalogReady) return;
    if (fullCatalogLoaded) {
      syncSmallAirportsInView(viewer);
    }
  }, [viewer, catalogReady, fullCatalogLoaded, syncSmallAirportsInView]);

  useEffect(() => {
    if (!viewer || !catalogReady) return;

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
  }, [viewer, catalogReady, sceneTerrainReady, syncSmallAirportsInView, layer]);
}
