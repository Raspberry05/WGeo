import {
  Cartesian3,
  Cartographic,
  EllipsoidTerrainProvider,
  sampleTerrainMostDetailed,
  type TerrainProvider,
  type Viewer,
} from "cesium";
import type { AirportRecord } from "../data/airportCatalog";

const SAMPLE_CHUNK_SIZE = 2000;

/** World terrain (Ion) supports sampling; ellipsoid fallback does not. */
export function terrainProviderSupportsSampling(
  terrainProvider: TerrainProvider,
): boolean {
  if (terrainProvider instanceof EllipsoidTerrainProvider) {
    return false;
  }
  return terrainProvider.availability !== undefined;
}

/** Samples WGS84 terrain height (meters) per airport ICAO. */
export async function sampleAirportTerrainBaseHeights(
  terrainProvider: TerrainProvider,
  records: AirportRecord[],
): Promise<Map<string, number>> {
  if (!terrainProviderSupportsSampling(terrainProvider)) {
    return new Map();
  }

  const heights = new Map<string, number>();

  for (let i = 0; i < records.length; i += SAMPLE_CHUNK_SIZE) {
    const chunk = records.slice(i, i + SAMPLE_CHUNK_SIZE);
    const cartographics = chunk.map((r) =>
      Cartographic.fromDegrees(r.lon, r.lat),
    );

    const sampled = await sampleTerrainMostDetailed(
      terrainProvider,
      cartographics,
    );

    chunk.forEach((record, j) => {
      heights.set(record.id, sampled[j]?.height ?? 0);
    });
  }

  return heights;
}

/** Sample heights after world terrain is assigned and ready. */
export async function sampleAirportHeightsForViewer(
  viewer: Viewer,
  records: AirportRecord[],
): Promise<Map<string, number>> {
  const provider = viewer.terrainProvider;
  if (!terrainProviderSupportsSampling(provider)) {
    return new Map();
  }

  return sampleAirportTerrainBaseHeights(provider, records);
}

export function airportPositionAtHeight(
  record: AirportRecord,
  heightM: number,
): Cartesian3 {
  return Cartesian3.fromDegrees(record.lon, record.lat, heightM);
}

export function heightForAirport(
  baseTerrainHeights: Map<string, number>,
  record: AirportRecord,
  offsetM: number,
): number {
  return (baseTerrainHeights.get(record.id) ?? 0) + offsetM;
}
