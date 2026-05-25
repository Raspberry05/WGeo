/** OpenSky emitter category (integer), see https://opensky-network.org/apidoc/ */
export function getCategoryLabel(categoryCode: number | null | undefined): string {
  if (categoryCode === null || categoryCode === undefined || Number.isNaN(categoryCode)) {
    return "Uncategorized";
  }

  switch (categoryCode) {
    case 0:
      return "No info";
    case 1:
      return "No ADS-B";
    case 2:
      return "Light";
    case 3:
      return "Small";
    case 4:
      return "Large";
    case 5:
      return "High vortex large";
    case 6:
      return "Heavy";
    case 7:
      return "High performance";
    case 8:
      return "Rotorcraft";
    case 9:
      return "Glider";
    case 10:
      return "Balloon";
    case 11:
      return "Parachute";
    case 12:
      return "Ultralight";
    case 13:
      return "UAV";
    case 14:
      return "Space";
    case 15:
      return "Emergency vehicle";
    case 16:
      return "Service vehicle";
    case 17:
      return "Ground obstruction";
    case 18:
      return "Cluster obstacle";
    case 19:
      return "Line obstacle";
    case 20:
      return "Reserved";
    default:
      return "Uncategorized";
  }
}

export function parseCategoryCode(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Rough inference when OpenSky omits category in anonymous state vectors. */
export function inferCategoryFromFlight(
  altitudeMeters: number,
  velocityMs: number,
  onGround: boolean,
): number | null {
  const velocityKts = velocityMs * 1.94384;
  if (onGround && velocityKts < 30) return 3;
  if (altitudeMeters > 10600 && velocityKts > 400) return 6;
  if (altitudeMeters > 6100) return 4;
  if (altitudeMeters < 900 && velocityKts < 200) return 2;
  return null;
}

export function resolveCategoryLabel(
  categoryCode: number | null,
  altitudeMeters: number,
  velocityMs: number,
  onGround: boolean,
): { code: number | null; label: string } {
  const code =
    categoryCode ??
    inferCategoryFromFlight(altitudeMeters, velocityMs, onGround);
  return { code, label: getCategoryLabel(code) };
}

/** Filterable OpenSky categories for HUD chips */
export const FILTERABLE_CATEGORIES: { code: number; label: string }[] = [
  { code: 2, label: "Light" },
  { code: 3, label: "Small" },
  { code: 4, label: "Large" },
  { code: 5, label: "High vortex" },
  { code: 6, label: "Heavy" },
  { code: 7, label: "High perf" },
  { code: 8, label: "Rotorcraft" },
  { code: 13, label: "UAV" },
  { code: -1, label: "Unknown" },
];
