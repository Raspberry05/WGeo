import type { Viewer } from "cesium";
import { create } from "zustand";

interface CesiumStore {
  viewer: Viewer | null;
  sceneTerrainReady: boolean;
  globeBootReady: boolean;
  setViewer: (viewer: Viewer | null) => void;
  setSceneTerrainReady: (ready: boolean) => void;
  setGlobeBootReady: (ready: boolean) => void;
}

export const useCesiumStore = create<CesiumStore>((set) => ({
  viewer: null,
  sceneTerrainReady: false,
  globeBootReady: false,
  setViewer: (viewer) =>
    set({
      viewer,
      sceneTerrainReady: false,
      globeBootReady: false,
    }),
  setSceneTerrainReady: (sceneTerrainReady) => set({ sceneTerrainReady }),
  setGlobeBootReady: (globeBootReady) => set({ globeBootReady }),
}));
