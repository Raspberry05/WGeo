import { Ion } from "cesium";

export function setupCesiumIon(): void {
  const token = import.meta.env.VITE_CESIUM_ION_TOKEN;

  if (token) {
    Ion.defaultAccessToken = token;
    return;
  }

  console.warn(
    "[Aeroscope] VITE_CESIUM_ION_TOKEN is not set. Terrain and OSM buildings require a Cesium ion access token.",
  );
}
