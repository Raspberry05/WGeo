import { useEffect, useRef } from "react";
import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  LabelStyle,
  PointPrimitiveCollection,
  VerticalOrigin,
  type Entity,
  type PointPrimitive,
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
} from "../../config/airportPointVisuals";
import {
  getAirportRecord,
  getAirportRecordsForMap,
  getViewportIndex,
  isAirportCatalogLoaded,
  isFullCatalogLoaded,
  mapToRecord,
  type AirportMapRecord,
  type AirportRecord,
} from "../../data/airportCatalog";
import { getAirport } from "../../data/airports";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useCesiumStore } from "../../store/useCesiumStore";
import { createAirportTerrainSampler } from "../../utils/airportTerrainSampling";
import {
  airportPositionAtHeight,
  heightForAirport,
} from "../../utils/airportTerrainHeight";

const INACTIVE_COLOR = Color.fromCssColorString("#666666");
const ACTIVE_COLOR = Color.fromCssColorString("#00ff88");

function applyInactivePointStyle(
  primitive: PointPrimitive,
  record: AirportRecord,
  baseTerrainHeights: Map<string, number>,
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

function applyActivePointStyle(
  primitive: PointPrimitive,
  record: AirportRecord,
  baseTerrainHeights: Map<string, number>,
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

function addAirportPrimitive(
  collection: PointPrimitiveCollection,
  record: AirportMapRecord,
  isActive: boolean,
  heights: Map<string, number>,
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

function getRecordsInCameraView(viewer: Viewer): AirportRecord[] {
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
  if (index && viewer.camera.positionCartographic.height < AIRPORT_SMALL_AIRPORT_MAX_CAMERA_M) {
    inView.push(...index.query(west, south, east, north));
  }

  return inView;
}

export function AirportEntities() {
  const viewer = useCesiumStore((s) => s.viewer);
  const sceneTerrainReady = useCesiumStore((s) => s.sceneTerrainReady);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);

  const pointsRef = useRef<PointPrimitiveCollection | null>(null);
  const primitiveByIdRef = useRef<Map<string, PointPrimitive>>(new Map());
  const smallAirportIdsRef = useRef<Set<string>>(new Set());
  const prevActiveIdRef = useRef<string | null>(null);
  const samplerRef = useRef<ReturnType<typeof createAirportTerrainSampler> | null>(
    null,
  );
  const activeEllipseRef = useRef<Entity | null>(null);
  const activeLabelRef = useRef<Entity | null>(null);

  const applyStyleForId = (
    id: string,
    heights: Map<string, number>,
    activeId: string,
  ): void => {
    const primitive = primitiveByIdRef.current.get(id);
    const record = getAirportRecord(id);
    if (!primitive || !record) return;
    if (id === activeId) {
      applyActivePointStyle(primitive, record, heights);
    } else {
      applyInactivePointStyle(primitive, record, heights);
    }
  };

  const syncSmallAirportsInView = (v: Viewer): void => {
    if (!isFullCatalogLoaded() || !pointsRef.current) return;

    const height = v.camera.positionCartographic.height;
    const collection = pointsRef.current;
    const heights = samplerRef.current?.cache ?? new Map();

    if (height >= AIRPORT_SMALL_AIRPORT_MAX_CAMERA_M) {
      for (const id of smallAirportIdsRef.current) {
        const primitive = primitiveByIdRef.current.get(id);
        if (primitive) {
          collection.remove(primitive);
          primitiveByIdRef.current.delete(id);
        }
      }
      smallAirportIdsRef.current.clear();
      return;
    }

    const rect = v.camera.computeViewRectangle();
    if (!rect) return;

    const west = rect.west;
    const south = rect.south;
    const east = rect.east;
    const north = rect.north;

    const index = getViewportIndex();
    if (!index) return;

    const visible = index.query(west, south, east, north);
    const nextIds = new Set(visible.map((r) => r.id));

    for (const id of smallAirportIdsRef.current) {
      if (nextIds.has(id)) continue;
      const primitive = primitiveByIdRef.current.get(id);
      if (primitive) {
        collection.remove(primitive);
        primitiveByIdRef.current.delete(id);
      }
      smallAirportIdsRef.current.delete(id);
    }

    for (const record of visible) {
      if (primitiveByIdRef.current.has(record.id)) continue;
      const primitive = addAirportPrimitive(
        collection,
        record,
        record.id === activeAirportId,
        heights,
      );
      primitiveByIdRef.current.set(record.id, primitive);
      smallAirportIdsRef.current.add(record.id);
    }
  };

  useEffect(() => {
    if (!viewer || !catalogReady || !isAirportCatalogLoaded()) {
      return;
    }

    const records = getAirportRecordsForMap();
    const collection = new PointPrimitiveCollection();
    viewer.scene.primitives.add(collection);
    pointsRef.current = collection;
    primitiveByIdRef.current.clear();
    smallAirportIdsRef.current.clear();
    prevActiveIdRef.current = null;

    const heights = new Map<string, number>();

    for (const record of records) {
      const primitive = addAirportPrimitive(
        collection,
        record,
        record.id === activeAirportId,
        heights,
      );
      primitiveByIdRef.current.set(record.id, primitive);
    }

    const onHeightsUpdated = (ids: string[]): void => {
      const activeId = useAircraftStore.getState().activeAirportId;
      const cache = samplerRef.current?.cache ?? new Map();
      for (const id of ids) {
        applyStyleForId(id, cache, activeId);
      }
    };

    const sampler = createAirportTerrainSampler(
      viewer,
      () => getRecordsInCameraView(viewer),
      () => getAirportRecord(useAircraftStore.getState().activeAirportId),
      onHeightsUpdated,
    );
    samplerRef.current = sampler;

    if (sceneTerrainReady) {
      sampler.sampleActive(activeAirportId);
      sampler.sampleViewport();
    }

    const onMoveEnd = (): void => {
      syncSmallAirportsInView(viewer);
      if (sceneTerrainReady) {
        sampler.sampleViewport();
      }
    };

    viewer.camera.moveEnd.addEventListener(onMoveEnd);
    syncSmallAirportsInView(viewer);

    return () => {
      viewer.camera.moveEnd.removeEventListener(onMoveEnd);
      sampler.dispose();
      samplerRef.current = null;
      if (pointsRef.current && !pointsRef.current.isDestroyed()) {
        viewer.scene.primitives.remove(pointsRef.current);
        pointsRef.current = null;
      }
      primitiveByIdRef.current.clear();
      smallAirportIdsRef.current.clear();
    };
  }, [viewer, catalogReady, sceneTerrainReady]);

  useEffect(() => {
    if (!viewer || !catalogReady) return;
    if (isFullCatalogLoaded()) {
      syncSmallAirportsInView(viewer);
      return;
    }
    const timer = window.setInterval(() => {
      if (isFullCatalogLoaded()) {
        syncSmallAirportsInView(viewer);
        window.clearInterval(timer);
      }
    }, 400);
    return () => window.clearInterval(timer);
  }, [viewer, catalogReady]);

  useEffect(() => {
    if (!viewer || !catalogReady) return;

    const heights = samplerRef.current?.cache ?? new Map();
    const prev = prevActiveIdRef.current;

    if (prev && prev !== activeAirportId) {
      applyStyleForId(prev, heights, activeAirportId);
    }
    applyStyleForId(activeAirportId, heights, activeAirportId);
    prevActiveIdRef.current = activeAirportId;

    if (sceneTerrainReady) {
      samplerRef.current?.sampleActive(activeAirportId);
    }

    if (activeEllipseRef.current) {
      viewer.entities.remove(activeEllipseRef.current);
      activeEllipseRef.current = null;
    }
    if (activeLabelRef.current) {
      viewer.entities.remove(activeLabelRef.current);
      activeLabelRef.current = null;
    }

    if (!isAirportCatalogLoaded()) return;

    const airport = getAirport(activeAirportId);
    const accent = "#00ff88";

    activeEllipseRef.current = viewer.entities.add({
      id: `airport-active-ellipse-${airport.id}`,
      position: Cartesian3.fromDegrees(airport.lon, airport.lat, 0),
      ellipse: {
        semiMajorAxis: airport.radiusKm * 1000,
        semiMinorAxis: airport.radiusKm * 1000,
        height: 0,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        material: Color.fromCssColorString("rgba(0,255,136,0.08)"),
        outline: true,
        outlineColor: Color.fromCssColorString(accent),
        outlineWidth: 2,
      },
    });

    activeLabelRef.current = viewer.entities.add({
      id: `airport-active-label-${airport.id}`,
      position: Cartesian3.fromDegrees(airport.lon, airport.lat, 0),
      label: {
        text: `${airport.id} · ${airport.name}`,
        font: "14px monospace",
        fillColor: Color.fromCssColorString(accent),
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -24),
        heightReference: HeightReference.CLAMP_TO_GROUND,
        showBackground: true,
        backgroundColor: Color.fromCssColorString("rgba(0,0,0,0.75)"),
      },
    });

    return () => {
      if (activeEllipseRef.current) {
        viewer.entities.remove(activeEllipseRef.current);
        activeEllipseRef.current = null;
      }
      if (activeLabelRef.current) {
        viewer.entities.remove(activeLabelRef.current);
        activeLabelRef.current = null;
      }
    };
  }, [viewer, catalogReady, activeAirportId, sceneTerrainReady]);

  return null;
}

/** Resolve airport ICAO from a Cesium pick id (primitive or entity). */
export function airportIdFromPickId(id: unknown): string | null {
  if (typeof id === "string") {
    if (id.startsWith("airport-active-")) return null;
    if (id.length === 4) return id.toUpperCase();
    return null;
  }
  return null;
}
