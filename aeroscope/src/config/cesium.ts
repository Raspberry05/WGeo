import { Ion } from "cesium";
import { DEFAULT_AIRPORT_ID } from "../data/airports";

export const CESIUM_ION_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;

/** KATL — used before async airport catalog loads (do not call getAirport here). */
export const DEFAULT_AIRPORT_COORDS = {
  id: DEFAULT_AIRPORT_ID,
  lon: -84.4277,
  lat: 33.6407,
  alt: 4500,
} as const;

/** Initial tower-style view over default airport. */
export const ATL_COORDS = DEFAULT_AIRPORT_COORDS;

export function setupCesiumIon(): void {
  if (CESIUM_ION_TOKEN) {
    Ion.defaultAccessToken = CESIUM_ION_TOKEN;
    return;
  }
  console.warn(
    "[Aeroscope] NEXT_PUBLIC_CESIUM_ION_TOKEN is not set. Cesium Ion world terrain and imagery require a token.",
  );
}
