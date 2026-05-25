import type { Billboard, BillboardCollection } from "cesium";
import type { AirportTerrainSampler } from "../utils/airportTerrainSampling";

export type AirportLayerRefs = {
  points: BillboardCollection | null;
  primitiveById: Map<string, Billboard>;
  smallAirportIds: Set<string>;
  sampler: AirportTerrainSampler | null;
  applyStyleForId: (id: string, activeId: string) => void;
};
