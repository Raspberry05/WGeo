import { Cesium3DTileset, type Viewer } from "cesium";
import { ION_TILESET_ASSET } from "@/config/tilesetOptions";

type PrefetchSlot = {
  viewerId: number;
  tileset: Cesium3DTileset | null;
  loadPromise: Promise<Cesium3DTileset | null> | null;
};

let viewerEpoch = 0;
let osmSlot: PrefetchSlot = {
  viewerId: -1,
  tileset: null,
  loadPromise: null,
};

function disposeOsmSlot(viewer: Viewer | null): void {
  const ts = osmSlot.tileset;
  if (ts && !ts.isDestroyed()) {
    if (viewer && !viewer.isDestroyed()) {
      viewer.scene.primitives.remove(ts);
    }
    ts.destroy();
  }
  osmSlot = { viewerId: -1, tileset: null, loadPromise: null };
}

/** Call when the Cesium viewer is destroyed or replaced. */
export function invalidateTilesetPrefetch(viewer: Viewer | null): void {
  viewerEpoch += 1;
  disposeOsmSlot(viewer);
}

export function getPrefetchedOsmBuildings(): Cesium3DTileset | null {
  const ts = osmSlot.tileset;
  if (!ts || ts.isDestroyed()) return null;
  return ts;
}

/**
 * Loads OSM Buildings in the background (hidden) so toggling it on is near-instant.
 */
export function prefetchOsmBuildings(viewer: Viewer): Promise<Cesium3DTileset | null> {
  if (viewer.isDestroyed()) return Promise.resolve(null);

  const epoch = viewerEpoch;
  if (osmSlot.viewerId === epoch && osmSlot.tileset && !osmSlot.tileset.isDestroyed()) {
    return Promise.resolve(osmSlot.tileset);
  }

  if (osmSlot.viewerId === epoch && osmSlot.loadPromise) {
    return osmSlot.loadPromise;
  }

  disposeOsmSlot(viewer);
  osmSlot.viewerId = epoch;

  osmSlot.loadPromise = (async () => {
    try {
      const tileset = await Cesium3DTileset.fromIonAssetId(
        ION_TILESET_ASSET.osmBuildings,
      );
      if (viewer.isDestroyed() || epoch !== viewerEpoch) {
        tileset.destroy();
        return null;
      }

      tileset.show = false;
      viewer.scene.primitives.add(tileset);
      osmSlot.tileset = tileset;
      return tileset;
    } catch (error) {
      console.warn("[Aeroscope] OSM Buildings prefetch failed:", error);
      return null;
    } finally {
      if (osmSlot.viewerId === epoch) {
        osmSlot.loadPromise = null;
      }
    }
  })();

  return osmSlot.loadPromise;
}

export function showPrefetchedOsmBuildings(): boolean {
  const ts = getPrefetchedOsmBuildings();
  if (!ts) return false;
  ts.show = true;
  return true;
}

export function hidePrefetchedOsmBuildings(): void {
  const ts = getPrefetchedOsmBuildings();
  if (ts && !ts.isDestroyed()) {
    ts.show = false;
  }
}

export function isPrefetchedOsmTileset(
  tileset: Cesium3DTileset | null,
): boolean {
  if (!tileset) return false;
  const cached = osmSlot.tileset;
  return cached != null && cached === tileset && !cached.isDestroyed();
}
