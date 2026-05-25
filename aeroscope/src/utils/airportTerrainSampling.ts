import type { Viewer } from "cesium";
import {
  AIRPORT_TERRAIN_SAMPLE_CHUNK,
  AIRPORT_VIEWPORT_SAMPLE_MAX,
} from "../config/airportPointVisuals";
import type { AirportRecord } from "../data/airportCatalog";
import { sampleAirportTerrainBaseHeights } from "./airportTerrainHeight";

export type TerrainHeightCache = Map<string, number>;

function scheduleIdle(fn: () => void): void {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => fn(), { timeout: 120 });
  } else {
    setTimeout(fn, 16);
  }
}

export type AirportTerrainSampler = {
  cache: TerrainHeightCache;
  sampleActive: (activeId: string) => void;
  sampleViewport: () => void;
  dispose: () => void;
};

export function createAirportTerrainSampler(
  viewer: Viewer,
  getRecordsInView: () => AirportRecord[],
  getActiveRecord: () => AirportRecord | undefined,
  onHeightsUpdated: (ids: string[]) => void,
): AirportTerrainSampler {
  const cache: TerrainHeightCache = new Map();
  let disposed = false;
  let chunksInFlight = 0;
  const queued = new Set<string>();

  const applyChunk = async (records: AirportRecord[]): Promise<void> => {
    if (disposed || records.length === 0) return;
    const provider = viewer.terrainProvider;
    const heights = await sampleAirportTerrainBaseHeights(provider, records);
    if (disposed) return;
    const updated: string[] = [];
    for (const [id, h] of heights) {
      cache.set(id, h);
      updated.push(id);
    }
    if (updated.length > 0) {
      onHeightsUpdated(updated);
    }
  };

  const enqueue = (records: AirportRecord[]): void => {
    const pending: AirportRecord[] = [];
    for (const r of records) {
      if (cache.has(r.id) || queued.has(r.id)) continue;
      if (queued.size + pending.length >= AIRPORT_VIEWPORT_SAMPLE_MAX) break;
      queued.add(r.id);
      pending.push(r);
    }
    if (pending.length === 0) return;

    const runChunk = (start: number): void => {
      if (disposed || start >= pending.length) return;
      const slice = pending.slice(start, start + AIRPORT_TERRAIN_SAMPLE_CHUNK);
      chunksInFlight++;

      void applyChunk(slice).finally(() => {
        for (const r of slice) {
          queued.delete(r.id);
        }
        chunksInFlight = Math.max(0, chunksInFlight - 1);
        if (!disposed && start + AIRPORT_TERRAIN_SAMPLE_CHUNK < pending.length) {
          scheduleIdle(() => runChunk(start + AIRPORT_TERRAIN_SAMPLE_CHUNK));
        }
      });
    };

    scheduleIdle(() => runChunk(0));
  };

  return {
    cache,

    sampleActive(activeId: string) {
      const active = getActiveRecord();
      if (active && active.id === activeId) {
        enqueue([active]);
      }
    },

    sampleViewport() {
      enqueue(getRecordsInView());
    },

    dispose() {
      disposed = true;
      queued.clear();
    },
  };
}

