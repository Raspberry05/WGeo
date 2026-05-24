import { useEffect } from "react";
import {
  Color,
  Cesium3DTileStyle,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
} from "cesium";
import { useCesium } from "resium";

export function MonochromeWorld() {
  const { viewer } = useCesium();

  useEffect(() => {
    if (!viewer) return;

    const { scene } = viewer;
    scene.backgroundColor = Color.fromCssColorString("#0d0d0f");
    scene.fog.enabled = true;
    scene.fog.density = 0.00025;

    if (scene.skyBox) scene.skyBox.show = false;
    if (scene.sun) scene.sun.show = false;
    if (scene.moon) scene.moon.show = false;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;

    scene.globe.baseColor = Color.fromCssColorString("#111214");
    scene.globe.enableLighting = false;
    scene.globe.showGroundAtmosphere = false;
    scene.globe.depthTestAgainstTerrain = true;

    viewer.imageryLayers.removeAll();

    let buildingsTileset: Awaited<ReturnType<typeof createOsmBuildingsAsync>> | undefined;
    let cancelled = false;

    void (async () => {
      try {
        viewer.terrainProvider = await createWorldTerrainAsync({
          requestWaterMask: false,
          requestVertexNormals: false,
        });

        if (cancelled) return;

        buildingsTileset = await createOsmBuildingsAsync({
          defaultColor: Color.fromCssColorString("#e8eaf0"),
          showOutline: true,
          style: new Cesium3DTileStyle({
            color: {
              conditions: [
                ["${feature['building']} === 'hospital'", "color('#ffffff', 0.95)"],
                ["${feature['building']} === 'school'", "color('#d8dce6', 0.92)"],
                ["true", "color('#f0f2f8', 0.88)"],
              ],
            },
          }),
        });

        if (cancelled) {
          buildingsTileset.destroy();
          return;
        }

        scene.primitives.add(buildingsTileset);
      } catch (error) {
        console.error("[Aeroscope] Failed to load Cesium world data:", error);
      }
    })();

    return () => {
      cancelled = true;
      if (buildingsTileset) {
        scene.primitives.remove(buildingsTileset);
        buildingsTileset.destroy();
      }
    };
  }, [viewer]);

  return null;
}
