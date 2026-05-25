import type { Cesium3DTileset } from "cesium";
import {
  Cartesian3,
  Cesium3DTileStyle,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
  Material,
} from "cesium";
import { useEffect, useRef } from "react";
import { useCesium } from "resium";
import {
  BUILDING_STYLE_COLORS,
  SCENE_PALETTE,
} from "../../config/scenePalette";
import type { Airport } from "../../data/airports";
import { getAirport } from "../../data/airports";
import { useAircraftStore } from "../../store/useAircraftStore";

function airportCenterVec3(airport: Airport): string {
  const center = Cartesian3.fromDegrees(airport.lon, airport.lat, 0);
  return `vec3(${center.x}, ${center.y}, ${center.z})`;
}

function buildBuildingStyle(activeAirportId: string): Cesium3DTileStyle {
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

export function MonochromeWorld() {
  const { viewer } = useCesium();
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const buildingsRef = useRef<Cesium3DTileset | null>(null);

  useEffect(() => {
    if (!viewer) return;

    const { scene } = viewer;
    scene.backgroundColor = SCENE_PALETTE.sky.clone();
    scene.fog.enabled = true;
    scene.fog.density = 0.00012;
    scene.fog.color = SCENE_PALETTE.sky.clone();

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

    let cancelled = false;

    void (async () => {
      try {
        viewer.terrainProvider = await createWorldTerrainAsync({
          requestWaterMask: true,
          requestVertexNormals: false,
        });

        if (cancelled) return;

        const tileset = await createOsmBuildingsAsync({
          defaultColor: SCENE_PALETTE.buildingsDefault.clone(),
          showOutline: true,
          style: buildBuildingStyle(activeAirportId),
        });

        if (cancelled) {
          tileset.destroy();
          return;
        }

        tileset.show = true;
        buildingsRef.current = tileset;
        scene.primitives.add(tileset);
        console.log("[Aeroscope] OSM buildings loaded");
      } catch (error) {
        console.error("[Aeroscope] Failed to load Cesium world data:", error);
      }
    })();

    return () => {
      cancelled = true;
      scene.globe.material = undefined;
      if (buildingsRef.current) {
        scene.primitives.remove(buildingsRef.current);
        buildingsRef.current.destroy();
        buildingsRef.current = null;
      }
    };
  }, [viewer]);

  useEffect(() => {
    if (buildingsRef.current) {
      buildingsRef.current.style = buildBuildingStyle(activeAirportId);
    }
  }, [activeAirportId]);

  return null;
}
