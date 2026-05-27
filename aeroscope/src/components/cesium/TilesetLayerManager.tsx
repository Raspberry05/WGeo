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

function getStoreViewer(): Viewer | null {
  const v = useCesiumStore.getState().viewer;
  if (!v || v.isDestroyed()) return null;
  return v;
}

export function TilesetLayerManager() {
  const viewer = useCesiumStore((s) => s.viewer);
  const buildings3dId = useMapSettingsStore((s) => s.buildings3dId);
  const tilesetRef = useRef<Cesium3DTileset | null>(null);
  const activeKeyRef = useRef<string>("");

  // Warm OSM Buildings in the background while the globe is idle.
  useEffect(() => {
    const v = getStoreViewer();
    if (!v) return;
    void prefetchOsmBuildings(v);
    return () => {
      const cleanupViewer = getStoreViewer();
      if (cleanupViewer) invalidateTilesetPrefetch(cleanupViewer);
    };
  }, [viewer]);

  useEffect(() => {
    const v = getStoreViewer();
    if (!v) return;

    v.scene.globe.show = !imageryBlockedBy3d(buildings3dId);

    const key = buildings3dId;
    if (key === activeKeyRef.current && tilesetRef.current) return;

    let cancelled = false;

    void (async () => {
      disposeTileset(v, tilesetRef.current);
      tilesetRef.current = null;
      activeKeyRef.current = "";

      const option = getBuildings3dOption(buildings3dId);
      if (!option.ionAssetId) return;

      if (buildings3dId === "osm") {
        if (!showPrefetchedOsmBuildings()) {
          const prefetchViewer = getStoreViewer();
          if (!prefetchViewer) return;
          await prefetchOsmBuildings(prefetchViewer);
          if (cancelled || !getStoreViewer()) return;
          showPrefetchedOsmBuildings();
        }
        tilesetRef.current = getPrefetchedOsmBuildings();
        activeKeyRef.current = key;
        return;
      }

      try {
        const tileset = await Cesium3DTileset.fromIonAssetId(option.ionAssetId);
        const activeViewer = getStoreViewer();
        if (cancelled || !activeViewer) {
          disposeTileset(activeViewer, tileset);
          return;
        }

        activeViewer.scene.primitives.add(tileset);
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
      const v = getStoreViewer();
      disposeTileset(v, tilesetRef.current);
      tilesetRef.current = null;
      activeKeyRef.current = "";
      if (v) {
        v.scene.globe.show = true;
      }
      invalidateTilesetPrefetch(v);
    };
  }, [viewer]);

  return null;
}
