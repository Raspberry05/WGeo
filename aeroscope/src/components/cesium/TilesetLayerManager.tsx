"use client";

import { useEffect, useRef } from "react";
import { Cesium3DTileset, type Viewer } from "cesium";
import {
  getBuildings3dOption,
  imageryBlockedBy3d,
} from "@/config/tilesetOptions";
import {
  getPrefetchedOsmBuildings,
  hidePrefetchedOsmBuildings,
  invalidateTilesetPrefetch,
  isPrefetchedOsmTileset,
  prefetchOsmBuildings,
  showPrefetchedOsmBuildings,
} from "@/lib/cesium/tilesetPrefetch";
import { useCesiumStore } from "@/store/useCesiumStore";
import { useMapSettingsStore } from "@/store/useMapSettingsStore";

function disposeTileset(
  viewer: Viewer | null,
  tileset: Cesium3DTileset | null,
): void {
  if (!tileset || tileset.isDestroyed()) return;
  if (isPrefetchedOsmTileset(tileset)) {
    hidePrefetchedOsmBuildings();
    return;
  }

  if (viewer && !viewer.isDestroyed()) {
    viewer.scene.primitives.remove(tileset);
  }

  if (!tileset.isDestroyed()) {
    tileset.destroy();
  }
}

export function TilesetLayerManager() {
  const viewer = useCesiumStore((s) => s.viewer);
  const buildings3dId = useMapSettingsStore((s) => s.buildings3dId);
  const tilesetRef = useRef<Cesium3DTileset | null>(null);
  const activeKeyRef = useRef<string>("");

  // Warm OSM Buildings in the background while the globe is idle.
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    void prefetchOsmBuildings(viewer);
    return () => invalidateTilesetPrefetch(viewer);
  }, [viewer]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    viewer.scene.globe.show = !imageryBlockedBy3d(buildings3dId);

    const key = buildings3dId;
    if (key === activeKeyRef.current && tilesetRef.current) return;

    let cancelled = false;

    void (async () => {
      disposeTileset(viewer, tilesetRef.current);
      tilesetRef.current = null;
      activeKeyRef.current = "";

      const option = getBuildings3dOption(buildings3dId);
      if (!option.ionAssetId) return;

      if (buildings3dId === "osm") {
        if (!showPrefetchedOsmBuildings()) {
          await prefetchOsmBuildings(viewer);
          if (cancelled || viewer.isDestroyed()) return;
          showPrefetchedOsmBuildings();
        }
        tilesetRef.current = getPrefetchedOsmBuildings();
        activeKeyRef.current = key;
        return;
      }

      try {
        const tileset = await Cesium3DTileset.fromIonAssetId(option.ionAssetId);
        if (cancelled || viewer.isDestroyed()) {
          disposeTileset(viewer, tileset);
          return;
        }

        viewer.scene.primitives.add(tileset);
        tilesetRef.current = tileset;
        activeKeyRef.current = key;
      } catch (error) {
        console.error(
          "[Aeroscope] 3D tileset failed:",
          buildings3dId,
          error,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewer, buildings3dId]);

  useEffect(() => {
    return () => {
      disposeTileset(viewer, tilesetRef.current);
      tilesetRef.current = null;
      activeKeyRef.current = "";
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.globe.show = true;
      }
      invalidateTilesetPrefetch(viewer);
    };
  }, [viewer]);

  return null;
}
