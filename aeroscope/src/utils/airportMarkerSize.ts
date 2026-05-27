import {
  ALL_AIRPORT_TYPES,
  isAirportType,
  type AirportType,
} from "@/config/airportFilters";
import { radiusKmForType, type AirportRecord } from "../data/airportCatalog";
import type { AircraftState } from "../store/useAircraftStore";
import { useAircraftStore } from "../store/useAircraftStore";
import { haversineKm } from "./geoMath";

export type AirportMarkerDimensions = {
  width: number;
  height: number;
};

/** Higher = larger marker when multiple types are visible together. */
const TYPE_RANK: Record<AirportType, number> = {
  large_airport: 5,
  medium_airport: 4,
  small_airport: 3,
  seaplane_base: 2,
  heliport: 1,
};

const VIEWPORT_ONLY_TYPES = new Set<AirportType>([
  "small_airport",
  "seaplane_base",
  "heliport",
]);

const ACTIVE_SIZE_MULTIPLIER = 1.35;

function trafficScaleFactor(trafficCount: number): number {
  if (trafficCount <= 0) return 1;
  if (trafficCount <= 3) return 1.06;
  if (trafficCount <= 10) return 1.12;
  if (trafficCount <= 25) return 1.2;
  if (trafficCount <= 60) return 1.28;
  return 1.38;
}

function enabledTypes(filter: AirportType[] | null): AirportType[] {
  if (filter === null) return [...ALL_AIRPORT_TYPES];
  return filter.filter((t) => isAirportType(t));
}

function isSquareMarker(type: AirportType): boolean {
  return type === "heliport" || type === "seaplane_base";
}

/**
 * Height range (px) for markers given how many types are on screen.
 * Solo or viewport-only filters get larger bases so small/heli/seaplane stay visible.
 */
function heightRangeForFilter(enabled: AirportType[]): {
  minH: number;
  maxH: number;
} {
  const count = enabled.length;
  const onlyViewport =
    count > 0 && enabled.every((t) => VIEWPORT_ONLY_TYPES.has(t));

  if (count <= 0) return { minH: 12, maxH: 14 };

  if (count === 1) {
    if (onlyViewport) return { minH: 26, maxH: 30 };
    return { minH: 24, maxH: 28 };
  }

  if (count === 2) {
    if (onlyViewport) return { minH: 20, maxH: 28 };
    const hasLarge = enabled.includes("large_airport");
    const hasMedium = enabled.includes("medium_airport");
    if (hasLarge && hasMedium) return { minH: 16, maxH: 26 };
    return { minH: 14, maxH: 24 };
  }

  if (count === 3) {
    return { minH: 12, maxH: 26 };
  }

  return { minH: 11, maxH: 26 };
}

function dimensionsForType(
  type: AirportType,
  enabled: AirportType[],
  isActive: boolean,
): AirportMarkerDimensions {
  const ranks = enabled.map((t) => TYPE_RANK[t]);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const rank = TYPE_RANK[type];
  const span = maxRank - minRank || 1;
  const t = (rank - minRank) / span;

  const { minH, maxH } = heightRangeForFilter(enabled);
  let height = Math.round(minH + t * (maxH - minH));

  let width: number;
  if (isSquareMarker(type)) {
    width = height;
  } else {
    width = Math.round(height * 0.84);
  }

  if (isActive) {
    height = Math.round(height * ACTIVE_SIZE_MULTIPLIER);
    width = Math.round(width * ACTIVE_SIZE_MULTIPLIER);
  }

  return {
    width: Math.max(8, width),
    height: Math.max(10, height),
  };
}

export function countAircraftNearAirport(
  airportId: string,
  airportLat: number,
  airportLon: number,
  airportType: string,
  aircraft: Record<string, AircraftState>,
): number {
  const radiusKm = radiusKmForType(airportType);
  let count = 0;
  for (const ac of Object.values(aircraft)) {
    if (
      haversineKm(ac.rawLat, ac.rawLon, airportLat, airportLon) <= radiusKm
    ) {
      count += 1;
    }
  }
  return count;
}

/**
 * Marker size from airport type, active filter set, and live traffic.
 * Relative priority: international > regional > small > seaplane > heliport.
 */
export function getAirportMarkerDimensions(
  record: AirportRecord,
  isActive: boolean,
  trafficCount: number,
): AirportMarkerDimensions {
  const filter = useAircraftStore.getState().airportTypeFilter;
  const enabled = enabledTypes(filter);
  const type: AirportType = isAirportType(record.type)
    ? record.type
    : "small_airport";

  const base = dimensionsForType(type, enabled, isActive);
  return {
    width: Math.max(
      8,
      Math.round(base.width * trafficScaleFactor(trafficCount)),
    ),
    height: Math.max(
      10,
      Math.round(base.height * trafficScaleFactor(trafficCount)),
    ),
  };
}

/** Looser distance scaling when few airport types are shown (easier to spot). */
export function useLooseAirportDistanceScale(filter: AirportType[] | null): boolean {
  const enabled = enabledTypes(filter);
  if (enabled.length <= 2) return true;
  if (enabled.every((t) => VIEWPORT_ONLY_TYPES.has(t))) return true;
  return false;
}
