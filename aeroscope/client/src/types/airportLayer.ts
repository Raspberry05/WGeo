import type { PointPrimitive, PointPrimitiveCollection } from "cesium";
import type { AirportTerrainSampler } from "../utils/airportTerrainSampling";

export type AirportLayerRefs = {
  points: PointPrimitiveCollection | null;
  primitiveById: Map<string, PointPrimitive>;
  smallAirportIds: Set<string>;
  sampler: AirportTerrainSampler | null;
  applyStyleForId: (id: string, activeId: string) => void;
};
