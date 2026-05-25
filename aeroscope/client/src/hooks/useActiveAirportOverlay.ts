import { useEffect, useRef } from "react";
import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  LabelStyle,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from "cesium";
import { isAirportCatalogLoaded } from "../data/airportCatalog";
import { getAirport } from "../data/airports";
import type { AirportLayerRefs } from "../types/airportLayer";

export type UseActiveAirportOverlayParams = {
  viewer: Viewer | null;
  catalogReady: boolean;
  sceneTerrainReady: boolean;
  activeAirportId: string;
  layer: AirportLayerRefs;
};

export function useActiveAirportOverlay({
  viewer,
  catalogReady,
  sceneTerrainReady,
  activeAirportId,
  layer,
}: UseActiveAirportOverlayParams): void {
  const prevActiveIdRef = useRef<string | null>(null);
  const activeEllipseRef = useRef<Entity | null>(null);
  const activeLabelRef = useRef<Entity | null>(null);

  useEffect(() => {
    if (!viewer || !catalogReady) return;

    const prev = prevActiveIdRef.current;

    if (prev && prev !== activeAirportId) {
      layer.applyStyleForId(prev, activeAirportId);
    }
    layer.applyStyleForId(activeAirportId, activeAirportId);
    prevActiveIdRef.current = activeAirportId;

    if (sceneTerrainReady) {
      layer.sampler?.sampleActive(activeAirportId);
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
  }, [viewer, catalogReady, activeAirportId, sceneTerrainReady, layer]);
}
