export interface AircraftModelConfig {
  uri: string;
  scale: number;
  minimumPixelSize: number;
}

const PLACEHOLDER_URI = "/models/plane-placeholder.gltf";

function scaleForCategory(categoryCode: number | null): number {
  switch (categoryCode) {
    case 2:
    case 3:
      return 0.8;
    case 4:
    case 5:
    case 6:
      return 1.4;
    case 8:
      return 0.6;
    case 9:
    case 10:
      return 0.5;
    case 14:
      return 0.45;
    default:
      return 1.0;
  }
}

/**
 * Maps OpenSky emitter category to 3D model config.
 * Swap `uri` per category when category-specific GLTFs are added.
 */
export function getAircraftModelConfig(
  categoryCode: number | null,
): AircraftModelConfig {
  const scale = scaleForCategory(categoryCode);

  return {
    uri: PLACEHOLDER_URI,
    scale,
    minimumPixelSize: 32,
  };
}
