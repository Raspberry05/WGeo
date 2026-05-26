import index from "./openAircraftTypeIndex.json";

/**
 * OpenAircraftType fields:
 * - CLASS: L=LandPlane,B=Balloon,A=Amphibious,H=Helicopter,G=Gyrocopter,S=SeaPlane,T=TiltRotor
 * - WAKE: L=Light,M=Medium,H=Heavy,J=Jumbo,S=Super
 *
 * Source: https://github.com/atoff/OpenAircraftType
 */

export type AircraftClass =
  | "L"
  | "B"
  | "A"
  | "H"
  | "G"
  | "S"
  | "T";

export type WakeTurbulenceCategory =
  | "L"
  | "M"
  | "H"
  | "J"
  | "S";

export type OpenAircraftTypeRecord = {
  aircraftClass: AircraftClass | null;
  wakeCategory: WakeTurbulenceCategory | null;
  model: string | null;
};

function isAircraftClass(value: string): value is AircraftClass {
  return (
    value === "L" ||
    value === "B" ||
    value === "A" ||
    value === "H" ||
    value === "G" ||
    value === "S" ||
    value === "T"
  );
}

function isWakeCategory(value: string): value is WakeTurbulenceCategory {
  return value === "L" || value === "M" || value === "H" || value === "J" || value === "S";
}

type RawIndex = Record<
  string,
  { class: string | null; wake: string | null; model: string | null }
>;

const rawIndex = index as unknown as RawIndex;

export function lookupOpenAircraftType(
  icaoTypeDesignator: string,
): OpenAircraftTypeRecord | null {
  const key = icaoTypeDesignator.trim().toUpperCase();
  if (!key) return null;
  const row = rawIndex[key];
  if (!row) return null;

  return {
    aircraftClass: row.class && isAircraftClass(row.class) ? row.class : null,
    wakeCategory: row.wake && isWakeCategory(row.wake) ? row.wake : null,
    model: row.model ?? null,
  };
}

export const AIRCRAFT_CLASS_OPTIONS: ReadonlyArray<{
  code: AircraftClass;
  label: string;
}> = [
  { code: "L", label: "Landplane (L)" },
  { code: "H", label: "Helicopter (H)" },
  { code: "B", label: "Balloon (B)" },
  { code: "G", label: "Gyrocopter (G)" },
  { code: "S", label: "Seaplane (S)" },
  { code: "A", label: "Amphibious (A)" },
  { code: "T", label: "Tiltrotor (T)" },
] as const;

export const WAKE_CATEGORY_OPTIONS: ReadonlyArray<{
  code: WakeTurbulenceCategory;
  label: string;
}> = [
  { code: "L", label: "Light (L)" },
  { code: "M", label: "Medium (M)" },
  { code: "H", label: "Heavy (H)" },
  { code: "J", label: "Jumbo (J)" },
  { code: "S", label: "Super (S)" },
] as const;

