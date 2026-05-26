import { create } from "zustand";

export type BaseImagery =
  | "ion_default"
  | "osm"
  | "esri_world_imagery"
  | "bing_aerial"
  | "bing_road"
  | "ion_asset";

export type MapSettingsState = {
  baseImagery: BaseImagery;
  /** Optional Ion imagery asset id when baseImagery = ion_asset. */
  ionImageryAssetId: number | null;
  setBaseImagery: (baseImagery: BaseImagery) => void;
  setIonImageryAssetId: (assetId: number | null) => void;
};

export const useMapSettingsStore = create<MapSettingsState>((set) => ({
  baseImagery: "ion_default",
  ionImageryAssetId: null,
  setBaseImagery: (baseImagery) => set({ baseImagery }),
  setIonImageryAssetId: (ionImageryAssetId) => set({ ionImageryAssetId }),
}));

