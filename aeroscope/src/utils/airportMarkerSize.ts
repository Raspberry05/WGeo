import { radiusKmForType, type AirportRecord } from "../data/airportCatalog";
import type { AircraftState } from "../store/useAircraftStore";
import { haversineKm } from "./geoMath";

export type AirportMarkerDimensions = {
  width: number;
  height: number;
};

/** Inactive marker base size (width × height px) by airport facility type. */
const INACTIVE_SIZE_BY_TYPE: Record<string, AirportMarkerDimensions> = {
  large_airport: { width: 20, height: 24 },
  medium_airport: { width: 14, height: 17 },
  small_airport: { width: 9, height: 11 },
};

const DEFAULT_INACTIVE: AirportMarkerDimensions = {
  width: 12,
  height: 14,
};

const ACTIVE_SIZE_MULTIPLIER = 1.35;

/** Live aircraft count → scale factor on top of type base (1.0–1.55). */
function trafficScaleFactor(trafficCount: number): number {
  if (trafficCount <= 0) return 1;
  if (trafficCount <= 3) return 1.08;
  if (trafficCount <= 10) return 1.18;
  if (trafficCount <= 25) return 1.28;
  if (trafficCount <= 60) return 1.4;
  return 1.55;
}

function inactiveBaseSize(record: AirportRecord): AirportMarkerDimensions {
  return INACTIVE_SIZE_BY_TYPE[record.type] ?? DEFAULT_INACTIVE;
}

function scaleDimensions(
  base: AirportMarkerDimensions,
  factor: number,
): AirportMarkerDimensions {
  return {
    width: Math.round(base.width * factor),
    height: Math.round(base.height * factor),
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
 * Marker triangle size from airport type and optional live traffic at that field.
 */
export function getAirportMarkerDimensions(
  record: AirportRecord,
  isActive: boolean,
  trafficCount: number,
): AirportMarkerDimensions {
  const base = inactiveBaseSize(record);
  const trafficFactor = trafficScaleFactor(trafficCount);

  if (!isActive) {
    return scaleDimensions(base, trafficFactor);
  }

  const activeBase = scaleDimensions(base, ACTIVE_SIZE_MULTIPLIER);
  return scaleDimensions(activeBase, trafficFactor);
}
