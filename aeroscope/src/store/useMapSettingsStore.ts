import { create } from "zustand";
import { DEFAULT_IMAGERY_ID, type ImageryId } from "@/config/imageryOptions";
import type { Buildings3dId } from "@/config/tilesetOptions";

export type MapSettingsState = {
  imageryId: ImageryId;
  buildings3dId: Buildings3dId;
  setImageryId: (imageryId: ImageryId) => void;
  setBuildings3dId: (buildings3dId: Buildings3dId) => void;
};

export const useMapSettingsStore = create<MapSettingsState>((set) => ({
  imageryId: DEFAULT_IMAGERY_ID,
  buildings3dId: "off",
  setImageryId: (imageryId) => set({ imageryId }),
  setBuildings3dId: (buildings3dId) => set({ buildings3dId }),
}));
