import { Ion } from "cesium";
import { getAirport } from "../data/airports";
import { DEFAULT_AIRPORT_ID } from "../data/airports";

export const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as
  | string
  | undefined;

const atl = getAirport(DEFAULT_AIRPORT_ID);

/** Initial tower-style view over default airport (ATL). */
export const ATL_COORDS = {
  lon: atl.lon,
  lat: atl.lat,
  alt: 4500,
};

export function setupCesiumIon(): void {
  if (CESIUM_ION_TOKEN) {
    Ion.defaultAccessToken = CESIUM_ION_TOKEN;
    return;
  }
  console.warn(
    "[Aeroscope] VITE_CESIUM_ION_TOKEN is not set. Terrain and OSM buildings require Cesium ion.",
  );
}
