import {
  BillboardCollection,
  Color,
  HorizontalOrigin,
  VerticalOrigin,
  type Billboard,
  type Viewer,
} from "cesium";
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
  getActiveAirportMarkerImage,
  getInactiveAirportMarkerImage,
} from "./airportMarkerImages";
import {
  airportPositionAtHeight,
  heightForAirport,
} from "./airportTerrainHeight";

export type TerrainHeightCache = Map<string, number>;

const INACTIVE_WIDTH = 12;
const INACTIVE_HEIGHT = 14;
const ACTIVE_WIDTH = 18;
const ACTIVE_HEIGHT = 22;

export function applyInactivePointStyle(
  billboard: Billboard,
  record: AirportRecord,
  baseTerrainHeights: TerrainHeightCache,
): void {
  const heightM = heightForAirport(
    baseTerrainHeights,
    record,
    AIRPORT_POINT_HEIGHT_M,
  );
  billboard.position = airportPositionAtHeight(record, heightM);
  billboard.image = getInactiveAirportMarkerImage();
  billboard.width = INACTIVE_WIDTH;
  billboard.height = INACTIVE_HEIGHT;
  billboard.color = Color.WHITE;
  billboard.verticalOrigin = VerticalOrigin.BOTTOM;
  billboard.horizontalOrigin = HorizontalOrigin.CENTER;
  billboard.disableDepthTestDistance = AIRPORT_POINT_DISABLE_DEPTH_TEST_M;
  billboard.translucencyByDistance = AIRPORT_POINT_FADE;
  billboard.scaleByDistance = AIRPORT_POINT_SCALE;
  billboard.distanceDisplayCondition = AIRPORT_POINT_DISPLAY;
}

export function applyActivePointStyle(
  billboard: Billboard,
  record: AirportRecord,
  baseTerrainHeights: TerrainHeightCache,
): void {
  const heightM = heightForAirport(
    baseTerrainHeights,
    record,
    AIRPORT_ACTIVE_HEIGHT_M,
  );
  billboard.position = airportPositionAtHeight(record, heightM);
  billboard.image = getActiveAirportMarkerImage();
  billboard.width = ACTIVE_WIDTH;
  billboard.height = ACTIVE_HEIGHT;
  billboard.color = Color.WHITE;
  billboard.verticalOrigin = VerticalOrigin.BOTTOM;
  billboard.horizontalOrigin = HorizontalOrigin.CENTER;
  billboard.disableDepthTestDistance = AIRPORT_POINT_DISABLE_DEPTH_TEST_M;
  billboard.translucencyByDistance = AIRPORT_ACTIVE_FADE;
  billboard.scaleByDistance = AIRPORT_ACTIVE_SCALE;
  billboard.distanceDisplayCondition = AIRPORT_POINT_DISPLAY;
}

export function applyAirportStyleForId(
  primitiveById: Map<string, Billboard>,
  id: string,
  heights: TerrainHeightCache,
  activeId: string,
): void {
  const billboard = primitiveById.get(id);
  const record = getAirportRecord(id);
  if (!billboard || !record) return;
  if (id === activeId) {
    applyActivePointStyle(billboard, record, heights);
  } else {
    applyInactivePointStyle(billboard, record, heights);
  }
}

export function addAirportPrimitive(
  collection: BillboardCollection,
  record: AirportMapRecord,
  isActive: boolean,
  heights: TerrainHeightCache,
): Billboard {
  const full = mapToRecord(record);
  const inactive = !isActive;

  const billboard = collection.add({
    id: record.id,
    position: airportPositionAtHeight(
      full,
      isActive ? AIRPORT_ACTIVE_HEIGHT_M : AIRPORT_POINT_HEIGHT_M,
    ),
    image: inactive
      ? getInactiveAirportMarkerImage()
      : getActiveAirportMarkerImage(),
    width: inactive ? INACTIVE_WIDTH : ACTIVE_WIDTH,
    height: inactive ? INACTIVE_HEIGHT : ACTIVE_HEIGHT,
    color: Color.WHITE,
    verticalOrigin: VerticalOrigin.BOTTOM,
    horizontalOrigin: HorizontalOrigin.CENTER,
    disableDepthTestDistance: AIRPORT_POINT_DISABLE_DEPTH_TEST_M,
    distanceDisplayCondition: AIRPORT_POINT_DISPLAY,
    translucencyByDistance: isActive ? AIRPORT_ACTIVE_FADE : AIRPORT_POINT_FADE,
    scaleByDistance: isActive ? AIRPORT_ACTIVE_SCALE : AIRPORT_POINT_SCALE,
  });

  if (heights.has(record.id)) {
    if (isActive) {
      applyActivePointStyle(billboard, full, heights);
    } else {
      applyInactivePointStyle(billboard, full, heights);
    }
  }
  return billboard;
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
