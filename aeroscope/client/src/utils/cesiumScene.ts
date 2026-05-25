import {
  Cartesian3,
  Cesium3DTileStyle,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
  IonImageryProvider,
  Material,
  type Cesium3DTileset,
  type Viewer,
} from "cesium";
import {
  BUILDING_STYLE_COLORS,
  SCENE_PALETTE,
} from "../config/scenePalette";
import type { Airport } from "../data/airports";
import { getAirport } from "../data/airports";

function airportCenterVec3(airport: Airport): string {
  const center = Cartesian3.fromDegrees(airport.lon, airport.lat, 0);
  return `vec3(${center.x}, ${center.y}, ${center.z})`;
}

export function buildBuildingStyle(activeAirportId: string): Cesium3DTileStyle {
  const active = getAirport(activeAirportId);
  const center = airportCenterVec3(active);
  const radiusM = active.radiusKm * 1000;

  return new Cesium3DTileStyle({
    color: {
      conditions: [
        [
          `defined(\${POSITION}) && distance(\${POSITION}, ${center}) < ${radiusM}`,
          `color('${BUILDING_STYLE_COLORS.active}', 0.95)`,
        ],
        ["true", `color('${BUILDING_STYLE_COLORS.default}', 0.85)`],
      ],
    },
  });
}

export async function initCesiumScene(
  viewer: Viewer,
  activeAirportId: string,
): Promise<{
  buildings: Cesium3DTileset | null;
  destroy: () => void;
}> {
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

  let buildings: Cesium3DTileset | null = null;

  try {
    const imagery = await IonImageryProvider.fromAssetId(3830186);
    viewer.imageryLayers.addImageryProvider(imagery);

    viewer.terrainProvider = await createWorldTerrainAsync({
      requestWaterMask: false,
      requestVertexNormals: false,
    });

    buildings = await createOsmBuildingsAsync({
      defaultColor: SCENE_PALETTE.buildingsDefault.clone(),
      showOutline: true,
      style: buildBuildingStyle(activeAirportId),
    });
    buildings.show = true;
    scene.primitives.add(buildings);
  } catch (error) {
    console.error("[Aeroscope] Scene init failed:", error);
  }

  return {
    buildings,
    destroy: () => {
      scene.globe.material = undefined;
      if (buildings) {
        scene.primitives.remove(buildings);
        buildings.destroy();
      }
    },
  };
}

export function updateBuildingStyle(
  tileset: Cesium3DTileset | null,
  activeAirportId: string,
): void {
  if (tileset) {
    tileset.style = buildBuildingStyle(activeAirportId);
  }
}
