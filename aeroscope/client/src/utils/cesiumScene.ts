import {
  createWorldTerrainAsync,
  Ion,
  IonImageryProvider,
  Material,
  type Viewer,
} from "cesium";
import { CESIUM_ION_TOKEN } from "../config/cesium";
import { SCENE_PALETTE } from "../config/scenePalette";
import { terrainProviderSupportsSampling } from "./airportTerrainHeight";

export type CesiumSceneHandle = {
  terrainReady: boolean;
  destroy: () => void;
};

export async function initCesiumScene(viewer: Viewer): Promise<CesiumSceneHandle> {
  const { scene } = viewer;

  scene.backgroundColor = SCENE_PALETTE.sky.clone();
  scene.fog.enabled = true;
  scene.fog.density = 0.00012;
  if (scene.skyBox) scene.skyBox.show = false;
  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;

  scene.globe.enableLighting = false;
  scene.globe.showGroundAtmosphere = false;
  scene.globe.showWaterEffect = false;
  scene.globe.depthTestAgainstTerrain = true;
  scene.globe.material = Material.fromType("WaterMask", {
    uniforms: {
      landColor: SCENE_PALETTE.land.clone(),
      waterColor: SCENE_PALETTE.water.clone(),
    },
  });

  viewer.imageryLayers.removeAll();

  let terrainReady = false;

  try {
    const imagery = await IonImageryProvider.fromAssetId(3830186);
    viewer.imageryLayers.addImageryProvider(imagery);
  } catch (error) {
    console.warn("[Aeroscope] Ion imagery failed; globe may have no basemap:", error);
  }

  if (!CESIUM_ION_TOKEN && !Ion.defaultAccessToken) {
    console.warn(
      "[Aeroscope] No Cesium Ion token — keeping ellipsoid terrain. Set VITE_CESIUM_ION_TOKEN for 3D terrain.",
    );
  } else {
    try {
      viewer.terrainProvider = await createWorldTerrainAsync({
        requestWaterMask: false,
        requestVertexNormals: false,
      });
      terrainReady = terrainProviderSupportsSampling(viewer.terrainProvider);
      if (!terrainReady) {
        console.warn("[Aeroscope] Terrain provider loaded but does not support height sampling.");
      }
    } catch (error) {
      console.error(
        "[Aeroscope] World terrain failed (check VITE_CESIUM_ION_TOKEN and network). Using ellipsoid:",
        error,
      );
    }
  }

  return {
    terrainReady,
    destroy: () => {
      scene.globe.material = undefined;
    },
  };
}
