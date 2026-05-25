import { useEffect, useRef } from "react";
import type { Cesium3DTileset } from "cesium";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { setupCesiumIon } from "../../config/cesium";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useCesiumStore } from "../../store/useCesiumStore";
import { attachCameraSystem } from "../../utils/cesiumCamera";
import { initCesiumScene, updateBuildingStyle } from "../../utils/cesiumScene";

export function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const buildingsRef = useRef<Cesium3DTileset | null>(null);
  const setViewer = useCesiumStore((s) => s.setViewer);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    setupCesiumIon();

    const viewer = new Cesium.Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      fullscreenButton: false,
      baseLayer: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    });

    viewerRef.current = viewer;
    setViewer(viewer);

    let sceneCleanup: (() => void) | undefined;
    let cameraCleanup: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const scene = await initCesiumScene(viewer, activeAirportId);
      if (cancelled) {
        scene.destroy();
        return;
      }
      buildingsRef.current = scene.buildings;
      sceneCleanup = scene.destroy;
      cameraCleanup = attachCameraSystem(viewer);
    })();

    return () => {
      cancelled = true;
      cameraCleanup?.();
      sceneCleanup?.();
      buildingsRef.current = null;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      setViewer(null);
    };
  }, [setViewer]);

  useEffect(() => {
    if (buildingsRef.current) {
      updateBuildingStyle(buildingsRef.current, activeAirportId);
    }
  }, [activeAirportId]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}
