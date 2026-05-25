import type { Viewer } from "cesium";
import { create } from "zustand";

interface CesiumStore {
  viewer: Viewer | null;
  sceneTerrainReady: boolean;
  setViewer: (viewer: Viewer | null) => void;
  setSceneTerrainReady: (ready: boolean) => void;
}

export const useCesiumStore = create<CesiumStore>((set) => ({
  viewer: null,
  sceneTerrainReady: false,
  setViewer: (viewer) => set({ viewer, sceneTerrainReady: false }),
  setSceneTerrainReady: (sceneTerrainReady) => set({ sceneTerrainReady }),
}));
