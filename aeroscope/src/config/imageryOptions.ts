import type { IconType } from "react-icons";
import {
  MdLandscape,
  MdLayers,
  MdMap,
  MdPublic,
  MdSatelliteAlt,
  MdTerrain,
  MdTextFields,
} from "react-icons/md";
import { FaRoad } from "react-icons/fa6";

/** Cesium Ion imagery asset ids (see ion.cesium.com asset catalog). */
export const ION_IMAGERY_ASSET = {
  bingAerial: 2,
  bingAerialLabels: 3,
  bingRoad: 4,
  googleSatellite: 3830182,
  googleSatelliteLabels: 3830183,
  googleRoadmap: 3830184,
  googleLabelsOnly: 3830185,
  googleContour: 3830186,
} as const;

export type ImageryId =
  | "google_satellite"
  | "google_satellite_labels"
  | "google_roadmap"
  | "google_labels"
  | "google_contour"
  | "bing_aerial"
  | "bing_aerial_labels"
  | "bing_road"
  | "osm"
  | "esri";

export type ImageryOption = {
  id: ImageryId;
  label: string;
  icon: IconType;
  ionAssetId?: number;
  provider?: "osm" | "esri";
};

export const IMAGERY_OPTIONS: readonly ImageryOption[] = [
  {
    id: "google_satellite",
    label: "Google Satellite",
    icon: MdSatelliteAlt,
    ionAssetId: ION_IMAGERY_ASSET.googleSatellite,
  },
  {
    id: "google_satellite_labels",
    label: "Google Satellite + Labels",
    icon: MdLayers,
    ionAssetId: ION_IMAGERY_ASSET.googleSatelliteLabels,
  },
  {
    id: "google_roadmap",
    label: "Google Roadmap",
    icon: MdMap,
    ionAssetId: ION_IMAGERY_ASSET.googleRoadmap,
  },
  {
    id: "google_labels",
    label: "Google Labels",
    icon: MdTextFields,
    ionAssetId: ION_IMAGERY_ASSET.googleLabelsOnly,
  },
  {
    id: "google_contour",
    label: "Google Contour",
    icon: MdTerrain,
    ionAssetId: ION_IMAGERY_ASSET.googleContour,
  },
  {
    id: "bing_aerial",
    label: "Bing Aerial",
    icon: MdLandscape,
    ionAssetId: ION_IMAGERY_ASSET.bingAerial,
  },
  {
    id: "bing_aerial_labels",
    label: "Bing Aerial + Labels",
    icon: MdLayers,
    ionAssetId: ION_IMAGERY_ASSET.bingAerialLabels,
  },
  {
    id: "bing_road",
    label: "Bing Road",
    icon: FaRoad,
    ionAssetId: ION_IMAGERY_ASSET.bingRoad,
  },
  {
    id: "osm",
    label: "OpenStreetMap",
    icon: MdPublic,
    provider: "osm",
  },
  {
    id: "esri",
    label: "Esri World Imagery",
    icon: MdSatelliteAlt,
    provider: "esri",
  },
] as const;

export const DEFAULT_IMAGERY_ID: ImageryId = "google_satellite";

export function getImageryOption(id: ImageryId): ImageryOption {
  const found = IMAGERY_OPTIONS.find((o) => o.id === id);
  return found ?? IMAGERY_OPTIONS[0]!;
}
