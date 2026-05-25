import { useEffect, useRef } from "react";
import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  LabelStyle,
  VerticalOrigin,
  type Entity,
} from "cesium";
import { getAllAirports } from "../../data/airports";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useCesiumStore } from "../../store/useCesiumStore";

export function AirportEntities() {
  const viewer = useCesiumStore((s) => s.viewer);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const activeAirportPickEnabled = useAircraftStore(
    (s) => s.activeAirportPickEnabled,
  );
  const entitiesRef = useRef<Entity[]>([]);

  useEffect(() => {
    if (!viewer) return;

    for (const e of entitiesRef.current) {
      viewer.entities.remove(e);
    }
    entitiesRef.current = [];

    for (const airport of getAllAirports()) {
      const isActive = airport.id === activeAirportId;
      const accent = isActive ? "#00ff88" : "#666666";
      const label = isActive && !activeAirportPickEnabled
        ? `${airport.id} · tap aircraft`
        : `${airport.id} · ${airport.name}`;

      const entity = viewer.entities.add({
        id: `airport-${airport.id}`,
        name: airport.name,
        position: Cartesian3.fromDegrees(airport.lon, airport.lat, 0),
        point: {
          pixelSize: isActive ? 12 : 10,
          color: Color.fromCssColorString(accent),
          outlineColor: Color.WHITE,
          outlineWidth: isActive ? 2 : 1,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: label,
          font: isActive ? "12px monospace" : "11px monospace",
          fillColor: Color.fromCssColorString(isActive ? "#00ff88" : "#aaaaaa"),
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -20),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.fromCssColorString("rgba(0,0,0,0.7)"),
        },
        ellipse: {
          semiMajorAxis: airport.radiusKm * 1000,
          semiMinorAxis: airport.radiusKm * 1000,
          height: 0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          material: Color.fromCssColorString(
            isActive ? "rgba(0,255,136,0.08)" : "rgba(120,120,120,0.04)",
          ),
          outline: true,
          outlineColor: Color.fromCssColorString(
            isActive ? "#00ff88" : "#444444",
          ),
          outlineWidth: isActive ? 2 : 1,
        },
      });
      entitiesRef.current.push(entity);
    }

    return () => {
      for (const e of entitiesRef.current) {
        viewer.entities.remove(e);
      }
      entitiesRef.current = [];
    };
  }, [viewer, activeAirportId, activeAirportPickEnabled]);

  return null;
}
