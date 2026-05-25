/**
 * OpenSky category → GLTF mapping.
 * Replace URIs with downloaded models; see docs/AIRCRAFT_GLTF_SOURCES.md.
 */
export interface AircraftModelConfig {
  uri: string;
  scale: number;
  minimumPixelSize: number;
}

const MODELS = {
  default: "/models/plane-placeholder.gltf",
  balloon: "/models/balloon-placeholder.gltf",
  glider: "/models/glider-placeholder.gltf",
  light: "/models/light-placeholder.gltf",
  small: "/models/small-placeholder.gltf",
  large: "/models/large-placeholder.gltf",
  heavy: "/models/heavy-placeholder.gltf",
} as const;

function scaleForCategory(categoryCode: number | null): number {
  switch (categoryCode) {
    case 2:
      return 0.75;
    case 3:
      return 0.9;
    case 4:
    case 5:
      return 1.35;
    case 6:
      return 1.65;
    case 7:
      return 0.95;
    case 8:
      return 0.65;
    case 9:
      return 0.85;
    case 10:
      return 1.1;
    case 13:
      return 0.35;
    case 14:
      return 0.45;
    default:
      return 1.0;
  }
}

function uriForCategory(categoryCode: number | null): string {
  switch (categoryCode) {
    case 10:
      return MODELS.balloon;
    case 9:
      return MODELS.glider;
    case 2:
      return MODELS.light;
    case 3:
    case 7:
      return MODELS.small;
    case 4:
    case 5:
      return MODELS.large;
    case 6:
      return MODELS.heavy;
    default:
      return MODELS.default;
  }
}

/**
 * Maps OpenSky emitter category to 3D model config.
 */
export function getAircraftModelConfig(
  categoryCode: number | null,
): AircraftModelConfig {
  return {
    uri: uriForCategory(categoryCode),
    scale: scaleForCategory(categoryCode),
    minimumPixelSize: 32,
  };
}
