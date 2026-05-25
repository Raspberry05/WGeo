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
} from "cesium";
import {
  getAirportRecords,
  isAirportCatalogLoaded,
} from "../../data/airportCatalog";
import { getAirport } from "../../data/airports";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useCesiumStore } from "../../store/useCesiumStore";

const INACTIVE_COLOR = Color.fromCssColorString("#666666");
const ACTIVE_COLOR = Color.fromCssColorString("#00ff88");

export function AirportEntities() {
  const viewer = useCesiumStore((s) => s.viewer);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);

  const pointsRef = useRef<PointPrimitiveCollection | null>(null);
  const primitiveByIdRef = useRef<Map<string, PointPrimitive>>(new Map());
  const activeEllipseRef = useRef<Entity | null>(null);
  const activeLabelRef = useRef<Entity | null>(null);

  useEffect(() => {
    if (!viewer || !catalogReady || !isAirportCatalogLoaded()) return;

    const records = getAirportRecords();
    const collection = new PointPrimitiveCollection();
    viewer.scene.primitives.add(collection);
    pointsRef.current = collection;
    primitiveByIdRef.current.clear();

    for (const record of records) {
      const primitive = collection.add({
        id: record.id,
        position: Cartesian3.fromDegrees(record.lon, record.lat, 0),
        pixelSize: 5,
        color: INACTIVE_COLOR,
        outlineColor: Color.BLACK,
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
      primitiveByIdRef.current.set(record.id, primitive);
    }

    return () => {
      if (pointsRef.current && !pointsRef.current.isDestroyed()) {
        viewer.scene.primitives.remove(pointsRef.current);
        pointsRef.current = null;
      }
      primitiveByIdRef.current.clear();
    };
  }, [viewer, catalogReady]);

  useEffect(() => {
    if (!viewer || !catalogReady) return;

    for (const [id, primitive] of primitiveByIdRef.current) {
      const isActive = id === activeAirportId;
      primitive.pixelSize = isActive ? 14 : 5;
      primitive.color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
      primitive.outlineWidth = isActive ? 2 : 1;
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
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
  }, [viewer, catalogReady, activeAirportId]);

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
