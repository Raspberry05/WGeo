"use client";

import { useEffect, useRef } from "react";
import {
  BingMapsImageryProvider,
  BingMapsStyle,
  IonImageryProvider,
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  type Viewer,
} from "cesium";
import { useCesiumStore } from "@/store/useCesiumStore";
import { useMapSettingsStore } from "@/store/useMapSettingsStore";

function createEsriWorldImagery(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    credit: "Esri World Imagery",
  });
}

async function createIonDefaultImagery(): Promise<IonImageryProvider> {
  // Kept consistent with initCesiumScene().
  return IonImageryProvider.fromAssetId(3830182);
}

async function createProvider(
  viewer: Viewer,
  baseImagery: ReturnType<typeof useMapSettingsStore.getState>["baseImagery"],
  ionAssetId: number | null,
) {
  switch (baseImagery) {
    case "osm":
      return new OpenStreetMapImageryProvider({});
    case "esri_world_imagery":
      return createEsriWorldImagery();
    case "bing_aerial":
      return new BingMapsImageryProvider({
        // Uses Cesium's default Bing endpoint; token/keys handled by Cesium/Ion config.
        mapStyle: BingMapsStyle.AERIAL,
      });
    case "bing_road":
      return new BingMapsImageryProvider({
        mapStyle: BingMapsStyle.ROAD,
      });
    case "ion_asset":
      if (!ionAssetId) return createIonDefaultImagery();
      return IonImageryProvider.fromAssetId(ionAssetId);
    case "ion_default":
    default:
      return createIonDefaultImagery();
  }
}

export function ImageryLayerManager() {
  const viewer = useCesiumStore((s) => s.viewer);
  const baseImagery = useMapSettingsStore((s) => s.baseImagery);
  const ionAssetId = useMapSettingsStore((s) => s.ionImageryAssetId);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const key = `${baseImagery}:${ionAssetId ?? ""}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    let cancelled = false;

    void (async () => {
      const provider = await createProvider(viewer, baseImagery, ionAssetId);
      if (cancelled || viewer.isDestroyed()) return;

      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(provider);
    })();

    return () => {
      cancelled = true;
    };
  }, [viewer, baseImagery, ionAssetId]);

  return null;
}

