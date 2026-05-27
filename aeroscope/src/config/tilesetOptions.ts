import type { IconType } from "react-icons";
import { MdApartment, MdLayersClear, MdViewInAr } from "react-icons/md";

/** Cesium Ion 3D Tiles asset ids. */
export const ION_TILESET_ASSET = {
  osmBuildings: 96188,
  googlePhotorealistic: 2275207,
} as const;

export type Buildings3dId = "off" | "osm" | "google";

export type Buildings3dOption = {
  id: Buildings3dId;
  label: string;
  icon: IconType;
  ionAssetId?: number;
};

export const BUILDINGS_3D_OPTIONS: readonly Buildings3dOption[] = [
  { id: "off", label: "3D buildings off", icon: MdLayersClear },
  {
    id: "osm",
    label: "Cesium OSM Buildings",
    icon: MdApartment,
    ionAssetId: ION_TILESET_ASSET.osmBuildings,
  },
  {
    id: "google",
    label: "Google Photorealistic 3D",
    icon: MdViewInAr,
    ionAssetId: ION_TILESET_ASSET.googlePhotorealistic,
  },
] as const;

export function getBuildings3dOption(id: Buildings3dId): Buildings3dOption {
  const found = BUILDINGS_3D_OPTIONS.find((o) => o.id === id);
  return found ?? BUILDINGS_3D_OPTIONS[0]!;
}

/** Google Photorealistic 3D includes its own surface imagery; basemap layers are disabled. */
export function imageryBlockedBy3d(buildings3dId: Buildings3dId): boolean {
  return buildings3dId === "google";
}
