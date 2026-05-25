import { useEffect, useRef } from "react";
import {
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Color,
  HeadingPitchRoll,
  HeightReference,
  LabelStyle,
  Transforms,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from "cesium";
import { getAircraftModelConfig } from "../../config/aircraftModels";
import type { AircraftState } from "../../store/useAircraftStore";
import {
  passesCategoryFilter,
  useAircraftStore,
} from "../../store/useAircraftStore";
import { useCesiumStore } from "../../store/useCesiumStore";
import { getInterpolatedGeoState } from "../../systems/interpolationSystem";
import { formatSpeedKnots } from "../../utils/flightUnits";

const STATUS_COLORS: Record<string, string> = {
  airborne: "#00ff88",
  landing: "#ffaa00",
  taxiing: "#00aaff",
  parked: "#888888",
};

function createAircraftEntity(viewer: Viewer, ac: AircraftState): Entity {
  const color = STATUS_COLORS[ac.status] ?? "#ffffff";
  const modelConfig = getAircraftModelConfig(ac.categoryCode);
  const heightRef = ac.onGround
    ? HeightReference.CLAMP_TO_GROUND
    : HeightReference.NONE;

  const position = new CallbackPositionProperty((_time, result) => {
    const current = useAircraftStore.getState().aircraft[ac.id];
    if (!current) return Cartesian3.ZERO;
    const geo = getInterpolatedGeoState(current);
    return Cartesian3.fromDegrees(geo.lon, geo.lat, geo.altMeters, undefined, result);
  }, false);

  const orientation = new CallbackProperty((_time, result) => {
    const current = useAircraftStore.getState().aircraft[ac.id];
    if (!current) return undefined;
    const geo = getInterpolatedGeoState(current);
    const pos = Cartesian3.fromDegrees(geo.lon, geo.lat, geo.altMeters);
    const pitch = geo.clampToGround ? 0 : -0.08;
    return Transforms.headingPitchRollQuaternion(
      pos,
      new HeadingPitchRoll(geo.headingRad, pitch, 0),
      undefined,
      undefined,
      result,
    );
  }, false);

  return viewer.entities.add({
    id: ac.id,
    name: ac.callsign,
    position,
    orientation,
    model: {
      uri: modelConfig.uri,
      scale: modelConfig.scale * (ac.onGround ? 0.85 : 1),
      minimumPixelSize: 44,
      heightReference: heightRef,
      color: Color.fromCssColorString(color),
      silhouetteColor: Color.fromCssColorString(color),
      silhouetteSize: 1.2,
      colorBlendMode: 0,
      colorBlendAmount: 0.15,
    },
    label: {
      text: new CallbackProperty(() => {
        const current = useAircraftStore.getState().aircraft[ac.id];
        if (!current) return ac.callsign;
        return `${current.callsign}\n${current.aircraftType} · ${formatSpeedKnots(current.velocity)}`;
      }, false),
      font: "11px monospace",
      fillColor: Color.fromCssColorString(color),
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      style: LabelStyle.FILL,
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -22),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      showBackground: true,
      backgroundColor: Color.fromCssColorString("rgba(0,0,0,0.65)"),
      heightReference: heightRef,
    },
  });
}

export function AircraftEntities() {
  const viewer = useCesiumStore((s) => s.viewer);
  const entityMapRef = useRef<Map<string, Entity>>(new Map());

  useEffect(() => {
    if (!viewer) return;

    const map = entityMapRef.current;

    const syncAll = () => {
      const { aircraft, selectedId, categoryFilter } =
        useAircraftStore.getState();
      const ids = new Set(Object.keys(aircraft));

      for (const [id, entity] of map) {
        if (!ids.has(id)) {
          viewer.entities.remove(entity);
          map.delete(id);
        }
      }

      for (const ac of Object.values(aircraft)) {
        const code = ac.categoryCode === null ? -1 : ac.categoryCode;
        const visible = passesCategoryFilter(code, categoryFilter);

        if (!map.has(ac.id)) {
          map.set(ac.id, createAircraftEntity(viewer, ac));
        }
        const entity = map.get(ac.id)!;
        entity.show = visible;
        if (!visible) continue;

        const isSelected = selectedId === ac.id;
        const color = STATUS_COLORS[ac.status] ?? "#ffffff";
        if (entity.model) {
          entity.model.minimumPixelSize = isSelected ? 56 : 44;
          entity.model.silhouetteSize = isSelected ? 2.5 : 1.2;
          entity.model.colorBlendAmount = isSelected ? 0.35 : 0.15;
          entity.model.color = Color.fromCssColorString(color);
          entity.model.silhouetteColor = Color.fromCssColorString(color);
        }
        if (entity.label) {
          entity.label.fillColor = Color.fromCssColorString(color);
        }
      }
    };

    syncAll();
    const unsub = useAircraftStore.subscribe(syncAll);

    return () => {
      unsub();
      for (const entity of map.values()) {
        viewer.entities.remove(entity);
      }
      map.clear();
    };
  }, [viewer]);

  return null;
}
