import type {
  AircraftClass,
  WakeTurbulenceCategory,
} from "./openAircraftType";
import { lookupOpenAircraftType } from "./openAircraftType";

export type AircraftClassification = {
  aircraftClass: AircraftClass | null;
  wakeCategory: WakeTurbulenceCategory | null;
  /** Best-effort: human-friendly model name from dataset when present. */
  modelName: string | null;
};

function normalizeTypeDesignator(input: string | null | undefined): string {
  return (input ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export type AircraftClassificationInput = {
  aircraftModel: string | null;
};

/**
 * Classify an aircraft using OpenAircraftType (Doc 8643-like) data.
 *
 * Note: We intentionally do NOT attempt “commercial vs military”.
 */
export function classifyAircraft({
  aircraftModel,
}: AircraftClassificationInput): AircraftClassification {
  const typeDesignator = normalizeTypeDesignator(aircraftModel);
  if (!typeDesignator) {
    return { aircraftClass: null, wakeCategory: null, modelName: null };
  }

  const found = lookupOpenAircraftType(typeDesignator);
  if (!found) {
    return { aircraftClass: null, wakeCategory: null, modelName: null };
  }

  return {
    aircraftClass: found.aircraftClass,
    wakeCategory: found.wakeCategory,
    modelName: found.model,
  };
}

