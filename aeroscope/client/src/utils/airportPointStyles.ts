import { Color, type PointPrimitive, type PointPrimitiveCollection, type Viewer } from "cesium";
import {
  AIRPORT_ACTIVE_FADE,
  AIRPORT_ACTIVE_HEIGHT_M,
  AIRPORT_ACTIVE_SCALE,
  AIRPORT_POINT_DISABLE_DEPTH_TEST_M,
  AIRPORT_POINT_DISPLAY,
  AIRPORT_POINT_FADE,
  AIRPORT_POINT_HEIGHT_M,
  AIRPORT_POINT_SCALE,
  AIRPORT_SMALL_AIRPORT_MAX_CAMERA_M,
} from "../config/airportPointVisuals";
import {
  getAirportRecord,
  getAirportRecordsForMap,
  getViewportIndex,
  mapToRecord,
  type AirportMapRecord,
  type AirportRecord,
} from "../data/airportCatalog";
import {
  airportPositionAtHeight,
  heightForAirport,
} from "./airportTerrainHeight";

export type TerrainHeightCache = Map<string, number>;

const INACTIVE_COLOR = Color.fromCssColorString("#666666");
const ACTIVE_COLOR = Color.fromCssColorString("#00ff88");

export function applyInactivePointStyle(
  primitive: PointPrimitive,
  record: AirportRecord,
  baseTerrainHeights: TerrainHeightCache,
): void {
  const heightM = heightForAirport(
    baseTerrainHeights,
    record,
    AIRPORT_POINT_HEIGHT_M,
  );
  primitive.position = airportPositionAtHeight(record, heightM);
  primitive.disableDepthTestDistance = AIRPORT_POINT_DISABLE_DEPTH_TEST_M;
  primitive.pixelSize = 5;
  primitive.color = INACTIVE_COLOR;
  primitive.outlineWidth = 1;
  primitive.translucencyByDistance = AIRPORT_POINT_FADE;
  primitive.scaleByDistance = AIRPORT_POINT_SCALE;
  primitive.distanceDisplayCondition = AIRPORT_POINT_DISPLAY;
}

export function applyActivePointStyle(
  primitive: PointPrimitive,
  record: AirportRecord,
  baseTerrainHeights: TerrainHeightCache,
): void {
  const heightM = heightForAirport(
    baseTerrainHeights,
    record,
    AIRPORT_ACTIVE_HEIGHT_M,
  );
  primitive.position = airportPositionAtHeight(record, heightM);
  primitive.disableDepthTestDistance = AIRPORT_POINT_DISABLE_DEPTH_TEST_M;
  primitive.pixelSize = 14;
  primitive.color = ACTIVE_COLOR;
  primitive.outlineWidth = 2;
  primitive.translucencyByDistance = AIRPORT_ACTIVE_FADE;
  primitive.scaleByDistance = AIRPORT_ACTIVE_SCALE;
  primitive.distanceDisplayCondition = AIRPORT_POINT_DISPLAY;
}

export function applyAirportStyleForId(
  primitiveById: Map<string, PointPrimitive>,
  id: string,
  heights: TerrainHeightCache,
  activeId: string,
): void {
  const primitive = primitiveById.get(id);
  const record = getAirportRecord(id);
  if (!primitive || !record) return;
  if (id === activeId) {
    applyActivePointStyle(primitive, record, heights);
  } else {
    applyInactivePointStyle(primitive, record, heights);
  }
}

export function addAirportPrimitive(
  collection: PointPrimitiveCollection,
  record: AirportMapRecord,
  isActive: boolean,
  heights: TerrainHeightCache,
): PointPrimitive {
  const full = mapToRecord(record);
  const primitive = collection.add({
    id: record.id,
    position: airportPositionAtHeight(
      full,
      isActive ? AIRPORT_ACTIVE_HEIGHT_M : AIRPORT_POINT_HEIGHT_M,
    ),
    disableDepthTestDistance: AIRPORT_POINT_DISABLE_DEPTH_TEST_M,
    pixelSize: isActive ? 14 : 5,
    color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
    outlineColor: Color.BLACK,
    outlineWidth: isActive ? 2 : 1,
    distanceDisplayCondition: AIRPORT_POINT_DISPLAY,
    translucencyByDistance: isActive ? AIRPORT_ACTIVE_FADE : AIRPORT_POINT_FADE,
    scaleByDistance: isActive ? AIRPORT_ACTIVE_SCALE : AIRPORT_POINT_SCALE,
  });
  if (heights.has(record.id)) {
    if (isActive) {
      applyActivePointStyle(primitive, full, heights);
    } else {
      applyInactivePointStyle(primitive, full, heights);
    }
  }
  return primitive;
}

export function getRecordsInCameraView(viewer: Viewer): AirportRecord[] {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return [];

  const west = rect.west;
  const south = rect.south;
  const east = rect.east;
  const north = rect.north;

  const global = getAirportRecordsForMap().map(mapToRecord);
  const inView = global.filter(
    (r) => r.lon >= west && r.lon <= east && r.lat >= south && r.lat <= north,
  );

  const index = getViewportIndex();
  if (
    index &&
    viewer.camera.positionCartographic.height < AIRPORT_SMALL_AIRPORT_MAX_CAMERA_M
  ) {
    inView.push(...index.query(west, south, east, north));
  }

  return inView;
}
