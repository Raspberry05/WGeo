/** OurAirports `type` values used in Aeroscope. */
export type AirportType =
  | "large_airport"
  | "medium_airport"
  | "small_airport"
  | "heliport"
  | "seaplane_base";

export type AirportFilterOption = {
  type: AirportType;
  label: string;
  shortLabel: string;
  /** Shown on the global map layer when the type is enabled in the HUD. */
  globalLayer: boolean;
};

export const AIRPORT_FILTER_OPTIONS: readonly AirportFilterOption[] = [
  {
    type: "large_airport",
    label: "International / large",
    shortLabel: "INTL",
    globalLayer: true,
  },
  {
    type: "medium_airport",
    label: "Regional / medium",
    shortLabel: "MED",
    globalLayer: true,
  },
  {
    type: "small_airport",
    label: "Small / local",
    shortLabel: "SML",
    globalLayer: true,
  },
  {
    type: "seaplane_base",
    label: "Seaplane bases",
    shortLabel: "SEA",
    globalLayer: true,
  },
  {
    type: "heliport",
    label: "Heliports",
    shortLabel: "HEL",
    globalLayer: true,
  },
] as const;

/** Default: international (large) airports only. */
export const DEFAULT_AIRPORT_TYPE_FILTER: AirportType[] = ["large_airport"];

export const ALL_AIRPORT_TYPES: AirportType[] = AIRPORT_FILTER_OPTIONS.map(
  (o) => o.type,
);

export function isAirportType(value: string): value is AirportType {
  return (ALL_AIRPORT_TYPES as string[]).includes(value);
}

/** `null` means every airport type is shown. */
export function passesAirportTypeFilter(
  type: string,
  filter: AirportType[] | null,
): boolean {
  if (filter === null) return true;
  if (filter.length === 0) return false;
  return filter.includes(type as AirportType);
}

/** @deprecated All airport types use the global layer; always empty. */
export function enabledViewportTypes(): AirportType[] {
  return [];
}
