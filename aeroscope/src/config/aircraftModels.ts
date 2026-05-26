import type {
  AircraftClass,
  WakeTurbulenceCategory,
} from "@/domain/aircraft/openAircraftType";

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

function uriForClassAndWake(
  aircraftClass: AircraftClass | null,
  wakeCategory: WakeTurbulenceCategory | null,
): { uri: string; runAnimations?: boolean } {
  if (aircraftClass === "H") return { uri: MODELS.helicopter, runAnimations: true };
  if (aircraftClass === "B") return { uri: MODELS.balloon };
  if (aircraftClass === "G") return { uri: MODELS.glider };

  if (wakeCategory === "L") return { uri: MODELS.light };
  if (wakeCategory === "M") return { uri: MODELS.medium };
  if (wakeCategory === "H" || wakeCategory === "J" || wakeCategory === "S") {
    return { uri: MODELS.heavy };
  }

  return { uri: MODELS.unknown };
}

function scaleForClassAndWake(
  aircraftClass: AircraftClass | null,
  wakeCategory: WakeTurbulenceCategory | null,
): number {
  if (aircraftClass === "H") return 0.92;
  if (aircraftClass === "B") return 1.15;
  if (aircraftClass === "G") return 0.9;
  if (wakeCategory === "L") return 0.78;
  if (wakeCategory === "M") return 1.0;
  if (wakeCategory === "H" || wakeCategory === "J" || wakeCategory === "S") return 1.28;
  return 0.9;
}

/**
 * Maps heuristic aircraft category to 3D placeholder model config.
 */
export function getAircraftModelConfig(
  aircraftClass: AircraftClass | null,
  wakeCategory: WakeTurbulenceCategory | null,
): AircraftModelConfig {
  const { uri, runAnimations } = uriForClassAndWake(aircraftClass, wakeCategory);
  return {
    uri,
    scale: scaleForClassAndWake(aircraftClass, wakeCategory),
    minimumPixelSize: 32,
    runAnimations,
  };
}

/** @deprecated Use getAircraftModelConfig(aircraftCategory). OpenSky numeric codes only. */
export function getAircraftModelConfigFromCode(
  categoryCode: number | null,
): AircraftModelConfig {
  if (categoryCode === 10) return getAircraftModelConfig("B", null);
  if (categoryCode === 8) return getAircraftModelConfig("H", null);
  if (categoryCode === 2) return getAircraftModelConfig("L", "L");
  if (categoryCode === 3 || categoryCode === 7) return getAircraftModelConfig("L", "M");
  if (categoryCode === 4 || categoryCode === 5) return getAircraftModelConfig("L", "H");
  if (categoryCode === 6) return getAircraftModelConfig("L", "H");
  return getAircraftModelConfig(null, null);
}
