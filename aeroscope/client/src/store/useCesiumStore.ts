import type { Viewer } from "cesium";
import { create } from "zustand";

interface CesiumStore {
  viewer: Viewer | null;
  setViewer: (viewer: Viewer | null) => void;
}

export const useCesiumStore = create<CesiumStore>((set) => ({
  viewer: null,
  setViewer: (viewer) => set({ viewer }),
}));
