import type { AircraftCategory } from "@/domain/aircraft/aircraftCategory";

/**
 * Aircraft category → GLTF placeholder mapping.
 * Regenerate models: node scripts/generate-placeholders.mjs
 */
export interface AircraftModelConfig {
  uri: string;
  scale: number;
  minimumPixelSize: number;
  /** Play embedded glTF animations (e.g. helicopter rotor spin). */
  runAnimations?: boolean;
}

const MODELS = {
  plane: "/models/plane-placeholder.gltf",
  balloon: "/models/balloon-placeholder.gltf",
  glider: "/models/glider-placeholder.gltf",
  light: "/models/light-placeholder.gltf",
  medium: "/models/medium-placeholder.gltf",
  heavy: "/models/heavy-placeholder.gltf",
  helicopter: "/models/helicopter-placeholder.gltf",
  unknown: "/models/unknown-placeholder.gltf",
} as const;

function scaleForCategory(category: AircraftCategory): number {
  switch (category) {
    case "light":
      return 0.78;
    case "medium":
    case "commercial":
      return 1.0;
    case "heavy":
    case "military":
      return 1.28;
    case "helicopter":
      return 0.92;
    case "balloon":
      return 1.15;
    case "unknown":
      return 0.85;
    default:
      return 1.0;
  }
}

function uriForCategory(category: AircraftCategory): string {
  switch (category) {
    case "helicopter":
      return MODELS.helicopter;
    case "balloon":
      return MODELS.balloon;
    case "light":
      return MODELS.light;
    case "medium":
    case "commercial":
      return MODELS.medium;
    case "heavy":
    case "military":
      return MODELS.heavy;
    case "unknown":
      return MODELS.unknown;
    default:
      return MODELS.plane;
  }
}

/**
 * Maps heuristic aircraft category to 3D placeholder model config.
 */
export function getAircraftModelConfig(
  aircraftCategory: AircraftCategory,
): AircraftModelConfig {
  return {
    uri: uriForCategory(aircraftCategory),
    scale: scaleForCategory(aircraftCategory),
    minimumPixelSize: 32,
    runAnimations: aircraftCategory === "helicopter",
  };
}

/** @deprecated Use getAircraftModelConfig(aircraftCategory). OpenSky numeric codes only. */
export function getAircraftModelConfigFromCode(
  categoryCode: number | null,
): AircraftModelConfig {
  if (categoryCode === 10) {
    return getAircraftModelConfig("balloon");
  }
  if (categoryCode === 8) {
    return getAircraftModelConfig("helicopter");
  }
  if (categoryCode === 2) {
    return getAircraftModelConfig("light");
  }
  if (categoryCode === 3 || categoryCode === 7) {
    return getAircraftModelConfig("medium");
  }
  if (categoryCode === 4 || categoryCode === 5) {
    return getAircraftModelConfig("heavy");
  }
  if (categoryCode === 6) {
    return getAircraftModelConfig("heavy");
  }
  return getAircraftModelConfig("unknown");
}
