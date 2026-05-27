import { useEffect, useMemo, useRef } from "react";
import { BillboardCollection, type Viewer } from "cesium";
import type { AirportType } from "@/config/airportFilters";
import {
  getAirportRecord,
  getAirportRecordsForMap,
  isAirportCatalogLoaded,
} from "../data/airportCatalog";
import { useAircraftStore } from "../store/useAircraftStore";
import type { AirportLayerRefs } from "../types/airportLayer";
import {
  addAirportPrimitive,
  applyAirportStyleForId,
  getRecordsInCameraView,
} from "../utils/airportPointStyles";
import { createAirportTerrainSampler } from "../utils/airportTerrainSampling";

export type UseAirportGlobalLayerParams = {
  viewer: Viewer | null;
  catalogReady: boolean;
  sceneTerrainReady: boolean;
  activeAirportId: string;
  trafficViewMode: "airport" | "aircraft";
  viewModeToken: number;
  airportTypeFilter: AirportType[] | null;
  airportFilterToken: number;
};

function createEmptyLayerRefs(): AirportLayerRefs {
  return {
    points: null,
    primitiveById: new Map(),
    smallAirportIds: new Set(),
    sampler: null,
    applyStyleForId: () => {},
  };
}

function teardownLayer(viewer: Viewer, layer: AirportLayerRefs): void {
  layer.sampler?.dispose();
  layer.sampler = null;
  if (layer.points && !layer.points.isDestroyed()) {
    viewer.scene.primitives.remove(layer.points);
    layer.points = null;
  }
  layer.primitiveById.clear();
  layer.smallAirportIds.clear();
}

export function useAirportGlobalLayer({
  viewer,
  catalogReady,
  sceneTerrainReady,
  activeAirportId,
  trafficViewMode,
  viewModeToken,
  airportTypeFilter,
  airportFilterToken,
}: UseAirportGlobalLayerParams): AirportLayerRefs {
  const layerRef = useRef(createEmptyLayerRefs());

  const layerApi = useMemo(
    (): AirportLayerRefs => ({
      get points() {
        return layerRef.current.points;
      },
      get primitiveById() {
        return layerRef.current.primitiveById;
      },
      get smallAirportIds() {
        return layerRef.current.smallAirportIds;
      },
      get sampler() {
        return layerRef.current.sampler;
      },
      applyStyleForId(id: string, activeId: string) {
        const cache = layerRef.current.sampler?.cache ?? new Map();
        applyAirportStyleForId(
          layerRef.current.primitiveById,
          id,
          cache,
          activeId,
        );
      },
    }),
    [],
  );

  useEffect(() => {
    if (!viewer || !catalogReady || !isAirportCatalogLoaded()) {
      return;
    }

    const layer = layerRef.current;

    if (trafficViewMode !== "airport") {
      teardownLayer(viewer, layer);
      return;
    }

    const records = getAirportRecordsForMap(airportTypeFilter);
    const collection = new BillboardCollection();
    viewer.scene.primitives.add(collection);
    layer.points = collection;
    layer.primitiveById.clear();
    layer.smallAirportIds.clear();

    const heights = new Map<string, number>();

    for (const record of records) {
      const primitive = addAirportPrimitive(
        collection,
        record,
        record.id === activeAirportId,
        heights,
      );
      layer.primitiveById.set(record.id, primitive);
    }

    const onHeightsUpdated = (ids: string[]): void => {
      const activeId = useAircraftStore.getState().activeAirportId;
      for (const id of ids) {
        layerApi.applyStyleForId(id, activeId);
      }
    };

    const sampler = createAirportTerrainSampler(
      viewer,
      () => getRecordsInCameraView(viewer),
      () => getAirportRecord(useAircraftStore.getState().activeAirportId),
      onHeightsUpdated,
    );
    layer.sampler = sampler;

    if (sceneTerrainReady) {
      sampler.sampleActive(activeAirportId);
      sampler.sampleViewport();
    }

    return () => {
      teardownLayer(viewer, layer);
    };
  }, [
    viewer,
    catalogReady,
    sceneTerrainReady,
    activeAirportId,
    trafficViewMode,
    viewModeToken,
    airportTypeFilter,
    airportFilterToken,
    layerApi,
  ]);

  const aircraftCount = useAircraftStore((s) => Object.keys(s.aircraft).length);

  useEffect(() => {
    if (
      !viewer ||
      trafficViewMode !== "airport" ||
      !layerRef.current.points
    ) {
      return;
    }

    const activeId = useAircraftStore.getState().activeAirportId;
    layerApi.applyStyleForId(activeId, activeId);
  }, [aircraftCount, activeAirportId, trafficViewMode, viewer, layerApi]);

  return layerApi;
}
