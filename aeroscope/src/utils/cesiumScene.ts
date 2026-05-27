import {
  createWorldTerrainAsync,
  Ion,
  IonImageryProvider,
  type Viewer,
} from "cesium";
import { CESIUM_ION_TOKEN } from "../config/cesium";
import { ION_IMAGERY_ASSET } from "../config/imageryOptions";
import { terrainProviderSupportsSampling } from "./airportTerrainHeight";
import { isViewerUsable, waitForViewerReady } from "./cesiumViewerReady";

export type CesiumSceneHandle = {
  terrainReady: boolean;
  destroy: () => void;
};

export type InitCesiumSceneOptions = {
  isCancelled?: () => boolean;
};

function createDestroy(viewer: Viewer): () => void {
  return () => {
    if (!viewer.isDestroyed() && viewer.scene?.globe) {
      viewer.scene.globe.material = undefined;
    }
  };
}

function earlyExitHandle(viewer: Viewer): CesiumSceneHandle {
  return {
    terrainReady: false,
    destroy: createDestroy(viewer),
  };
}

function shouldAbort(
  viewer: Viewer,
  isCancelled?: () => boolean,
): boolean {
  return viewer.isDestroyed() || !isViewerUsable(viewer) || Boolean(isCancelled?.());
}

export async function initCesiumScene(
  viewer: Viewer,
  options?: InitCesiumSceneOptions,
): Promise<CesiumSceneHandle> {
  const isCancelled = options?.isCancelled;

  const ready = await waitForViewerReady(viewer);
  if (!ready || shouldAbort(viewer, isCancelled)) {
    console.warn(
      "[Aeroscope] Cesium viewer not ready before scene init (timeout, destroyed, or cancelled).",
    );
    return earlyExitHandle(viewer);
  }

  const scene = viewer.scene;
  const globe = scene.globe;

  globe.enableLighting = true;
  globe.showGroundAtmosphere = false;
  globe.showWaterEffect = true;
  globe.depthTestAgainstTerrain = true;
  // if (scene.skyAtmosphere) {
  //   scene.skyAtmosphere.show = false;
  // }
  // scene.backgroundColor = SCENE_PALETTE.sky;
  // globe.baseColor = SCENE_PALETTE.land;
  // globe.material = Material.fromType("Color", {
  //   color: SCENE_PALETTE.land,
  // });

  viewer.imageryLayers.removeAll();

  if (shouldAbort(viewer, isCancelled)) {
    return earlyExitHandle(viewer);
  }

  let terrainReady = false;

  try {
    const imagery = await IonImageryProvider.fromAssetId(
      ION_IMAGERY_ASSET.googleSatellite,
    );
    if (shouldAbort(viewer, isCancelled)) {
      return earlyExitHandle(viewer);
    }
    viewer.imageryLayers.addImageryProvider(imagery);
  } catch (error) {
    console.warn("[Aeroscope] Ion imagery failed; globe may have no basemap:", error);
  }

  if (shouldAbort(viewer, isCancelled)) {
    return earlyExitHandle(viewer);
  }

  if (!CESIUM_ION_TOKEN && !Ion.defaultAccessToken) {
    console.warn(
      "[Aeroscope] No Cesium Ion token — keeping ellipsoid terrain. Set NEXT_PUBLIC_CESIUM_ION_TOKEN for 3D terrain.",
    );
  } else {
    try {
      const terrainProvider = await createWorldTerrainAsync({
        requestWaterMask: false,
        requestVertexNormals: false,
      });
      if (shouldAbort(viewer, isCancelled)) {
        return earlyExitHandle(viewer);
      }
      viewer.terrainProvider = terrainProvider;
      terrainReady = terrainProviderSupportsSampling(viewer.terrainProvider);
      if (!terrainReady) {
        console.warn(
          "[Aeroscope] Terrain provider loaded but does not support height sampling.",
        );
      }
    } catch (error) {
      console.error(
        "[Aeroscope] World terrain failed (check NEXT_PUBLIC_CESIUM_ION_TOKEN and network). Using ellipsoid:",
        error,
      );
    }
  }

  return {
    terrainReady,
    destroy: createDestroy(viewer),
  };
}
