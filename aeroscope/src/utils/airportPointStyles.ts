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
  AIRPORT_POINT_SCALE_LOOSE,
} from "../config/airportPointVisuals";
import { useAircraftStore } from "../store/useAircraftStore";
import {
  getAirportRecord,
  getAirportRecordsForMap,
  mapToRecord,
  type AirportMapRecord,
  type AirportRecord,
} from "../data/airportCatalog";
import {
  countAircraftNearAirport,
  getAirportMarkerDimensions,
  useLooseAirportDistanceScale,
} from "./airportMarkerSize";
import { getAirportMarkerImage } from "./airportMarkerImages";
import {
  airportPositionAtHeight,
  heightForAirport,
} from "./airportTerrainHeight";

export type TerrainHeightCache = Map<string, number>;

function liveTrafficCount(record: AirportRecord): number {
  const { aircraft } = useAircraftStore.getState();
  return countAircraftNearAirport(
    record.id,
    record.lat,
    record.lon,
    record.type,
    aircraft,
  );
}

function verticalOriginForType(type: string): VerticalOrigin {
  if (type === "heliport" || type === "seaplane_base") {
    return VerticalOrigin.CENTER;
  }
  return VerticalOrigin.BOTTOM;
}

function scaleByDistanceForBillboard(isActive: boolean) {
  if (isActive) return AIRPORT_ACTIVE_SCALE;
  const filter = useAircraftStore.getState().airportTypeFilter;
  return useLooseAirportDistanceScale(filter)
    ? AIRPORT_POINT_SCALE_LOOSE
    : AIRPORT_POINT_SCALE;
}

function applyMarkerAppearance(
  billboard: Billboard,
  record: AirportRecord,
  isActive: boolean,
  trafficCount: number,
): void {
  const { width, height } = getAirportMarkerDimensions(
    record,
    isActive,
    trafficCount,
  );
  billboard.width = width;
  billboard.height = height;
  billboard.image = getAirportMarkerImage(
    record.type,
    isActive,
    width,
    height,
  );
  billboard.verticalOrigin = verticalOriginForType(record.type);
}

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
  applyMarkerAppearance(
    billboard,
    record,
    false,
    liveTrafficCount(record),
  );
  billboard.color = Color.WHITE;
  billboard.horizontalOrigin = HorizontalOrigin.CENTER;
  billboard.disableDepthTestDistance = AIRPORT_POINT_DISABLE_DEPTH_TEST_M;
  billboard.translucencyByDistance = AIRPORT_POINT_FADE;
  billboard.scaleByDistance = scaleByDistanceForBillboard(false);
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
  applyMarkerAppearance(billboard, record, true, liveTrafficCount(record));
  billboard.color = Color.WHITE;
  billboard.horizontalOrigin = HorizontalOrigin.CENTER;
  billboard.disableDepthTestDistance = AIRPORT_POINT_DISABLE_DEPTH_TEST_M;
  billboard.translucencyByDistance = AIRPORT_ACTIVE_FADE;
  billboard.scaleByDistance = scaleByDistanceForBillboard(true);
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
  const trafficCount = liveTrafficCount(full);
  const { width, height } = getAirportMarkerDimensions(
    full,
    isActive,
    trafficCount,
  );

  const billboard = collection.add({
    id: record.id,
    position: airportPositionAtHeight(
      full,
      isActive ? AIRPORT_ACTIVE_HEIGHT_M : AIRPORT_POINT_HEIGHT_M,
    ),
    image: getAirportMarkerImage(full.type, isActive, width, height),
    width,
    height,
    color: Color.WHITE,
    verticalOrigin: verticalOriginForType(full.type),
    horizontalOrigin: HorizontalOrigin.CENTER,
    disableDepthTestDistance: AIRPORT_POINT_DISABLE_DEPTH_TEST_M,
    distanceDisplayCondition: AIRPORT_POINT_DISPLAY,
    translucencyByDistance: isActive ? AIRPORT_ACTIVE_FADE : AIRPORT_POINT_FADE,
    scaleByDistance: scaleByDistanceForBillboard(isActive),
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

  const typeFilter = useAircraftStore.getState().airportTypeFilter;
  const global = getAirportRecordsForMap(typeFilter).map(mapToRecord);

  return global.filter(
    (r) => r.lon >= west && r.lon <= east && r.lat >= south && r.lat <= north,
  );
}
