import { useEffect, useRef, type RefObject } from "react";
import * as Cesium from "cesium";
import { setupCesiumIon } from "../config/cesium";
import { useCesiumStore } from "../store/useCesiumStore";
import { attachCameraSystem } from "../utils/cesiumCamera";
import {
  waitForGlobeTilesSettled,
  waitMinDwell,
} from "../utils/cesiumGlobeBoot";
import { initCesiumScene } from "../utils/cesiumScene";
import {
  isViewerLive,
  safeResize,
  waitForViewerReady,
} from "../utils/cesiumViewerReady";

export function useCesiumViewerInit(
  containerRef: RefObject<HTMLDivElement | null>,
): void {
  const initGenerationRef = useRef(0);
  const setViewer = useCesiumStore((s) => s.setViewer);
  const setSceneTerrainReady = useCesiumStore((s) => s.setSceneTerrainReady);
  const setGlobeBootReady = useCesiumStore((s) => s.setGlobeBootReady);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setupCesiumIon();
    setGlobeBootReady(false);

    const generation = ++initGenerationRef.current;
    let cancelled = false;

    const isActive = (): boolean =>
      !cancelled && generation === initGenerationRef.current;

    const viewer = new Cesium.Viewer(container, {
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

    setViewer(viewer);

    let sceneCleanup: (() => void) | undefined;
    let cameraCleanup: (() => void) | undefined;

    const disposeOwnedViewer = () => {
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      const current = useCesiumStore.getState().viewer;
      if (current === viewer) {
        setViewer(null);
      }
    };

    void (async () => {
      try {
        const ready = await waitForViewerReady(viewer, {
          requireCanvasSize: false,
          timeoutMs: 8000,
        });

        if (!isActive() || viewer.isDestroyed()) {
          return;
        }

        if (!ready) {
          console.warn(
            "[Aeroscope] Viewer scene not fully ready; continuing with best-effort init.",
          );
        }

        safeResize(viewer);

        if (!isActive() || viewer.isDestroyed()) {
          return;
        }

        const scene = await initCesiumScene(viewer, {
          isCancelled: () => !isActive(),
        });

        if (!isActive() || viewer.isDestroyed()) {
          return;
        }

        sceneCleanup = scene.destroy;
        cameraCleanup = attachCameraSystem(viewer);
        setSceneTerrainReady(scene.terrainReady);

        await Promise.all([
          waitForGlobeTilesSettled(viewer, {
            isCancelled: () => !isActive(),
          }),
          waitMinDwell(2500),
        ]);

        if (isActive() && isViewerLive(viewer)) {
          setGlobeBootReady(true);
        }
      } catch (err) {
        console.error("[Aeroscope] CesiumViewer scene init failed:", err);
        if (isActive() && isViewerLive(viewer)) {
          setSceneTerrainReady(false);
          setGlobeBootReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      setGlobeBootReady(false);
      setSceneTerrainReady(false);
      cameraCleanup?.();
      sceneCleanup?.();
      disposeOwnedViewer();
    };
  }, [containerRef, setViewer, setSceneTerrainReady, setGlobeBootReady]);
}
