"use client";

import { useEffect, useRef } from "react";
import {
  IonImageryProvider,
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  type ImageryProvider,
} from "cesium";
import { getImageryOption } from "@/config/imageryOptions";
import { imageryBlockedBy3d } from "@/config/tilesetOptions";
import { useCesiumStore } from "@/store/useCesiumStore";
import { useMapSettingsStore } from "@/store/useMapSettingsStore";

function createEsriWorldImagery(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    credit: "Esri World Imagery",
  });
}

async function createImageryProvider(
  imageryId: ReturnType<typeof useMapSettingsStore.getState>["imageryId"],
): Promise<ImageryProvider> {
  const option = getImageryOption(imageryId);

  if (option.ionAssetId != null) {
    return IonImageryProvider.fromAssetId(option.ionAssetId);
  }

  if (option.provider === "osm") {
    return new OpenStreetMapImageryProvider({});
  }

  return createEsriWorldImagery();
}

export function ImageryLayerManager() {
  const viewer = useCesiumStore((s) => s.viewer);
  const imageryId = useMapSettingsStore((s) => s.imageryId);
  const buildings3dId = useMapSettingsStore((s) => s.buildings3dId);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const blocked = imageryBlockedBy3d(buildings3dId);
    const key = blocked ? "__google_3d_blocked__" : imageryId;

    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    if (blocked) {
      viewer.imageryLayers.removeAll();
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const provider = await createImageryProvider(imageryId);
        if (cancelled || viewer.isDestroyed()) return;

        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(provider);
      } catch (error) {
        console.error("[Aeroscope] Imagery provider failed:", imageryId, error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewer, imageryId, buildings3dId]);

  return null;
}
