import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { setupCesiumIon } from "../../config/cesium";
import { useCesiumStore } from "../../store/useCesiumStore";
import { attachCameraSystem } from "../../utils/cesiumCamera";
import { initCesiumScene } from "../../utils/cesiumScene";

export function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const setViewer = useCesiumStore((s) => s.setViewer);
  const setSceneTerrainReady = useCesiumStore((s) => s.setSceneTerrainReady);

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
      try {
        const scene = await initCesiumScene(viewer);
        if (cancelled) {
          scene.destroy();
          return;
        }
        sceneCleanup = scene.destroy;
        cameraCleanup = attachCameraSystem(viewer);
        setSceneTerrainReady(scene.terrainReady);
      } catch (err) {
        console.error("[Aeroscope] CesiumViewer init failed:", err);
        setSceneTerrainReady(false);
      }
    })();

    return () => {
      cancelled = true;
      setSceneTerrainReady(false);
      cameraCleanup?.();
      sceneCleanup?.();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      setViewer(null);
    };
  }, [setViewer, setSceneTerrainReady]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}
