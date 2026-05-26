import { useEffect, useRef } from "react";
import {
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
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
import { isLatLonInCameraRect, getCameraRect } from "../../utils/cameraBounds";
import { formatSpeedKnots } from "../../utils/flightUnits";
import {
  isViewerLive,
  safeRemoveEntity,
} from "../../utils/cesiumViewerReady";

const STATUS_COLORS: Record<string, string> = {
  airborne: "#00ff88",
  landing: "#ffaa00",
  taxiing: "#00aaff",
  parked: "#888888",
};

function applyModelStyle(
  entity: Entity,
  ac: AircraftState,
  isSelected: boolean,
): void {
  if (!entity.model) return;

  const color = STATUS_COLORS[ac.status] ?? "#ffffff";
  const config = getAircraftModelConfig(ac.categoryCode);
  const heightRef = ac.onGround
    ? HeightReference.CLAMP_TO_GROUND
    : HeightReference.NONE;

  entity.model.uri = new ConstantProperty(config.uri);
  entity.model.scale = new ConstantProperty(
    config.scale * (ac.onGround ? 0.85 : 1),
  );
  entity.model.minimumPixelSize = new ConstantProperty(isSelected ? 56 : 44);
  entity.model.silhouetteSize = new ConstantProperty(isSelected ? 2.5 : 1.2);
  entity.model.colorBlendAmount = new ConstantProperty(
    isSelected ? 0.35 : 0.15,
  );
  entity.model.color = new ConstantProperty(Color.fromCssColorString(color));
  entity.model.silhouetteColor = new ConstantProperty(
    Color.fromCssColorString(color),
  );
  entity.model.heightReference = new ConstantProperty(heightRef);
}

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

  const entity = viewer.entities.add({
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

  return entity;
}

export function AircraftEntities() {
  const viewer = useCesiumStore((s) => s.viewer);
  const entityMapRef = useRef<Map<string, Entity>>(new Map());
  const categoryMapRef = useRef<Map<string, number | null>>(new Map());

  useEffect(() => {
    if (!isViewerLive(viewer)) return;

    const map = entityMapRef.current;
    const categoryMap = categoryMapRef.current;

    const syncAll = () => {
      if (!isViewerLive(viewer)) return;

      const { aircraft, selectedId, categoryFilter, trafficViewMode } =
        useAircraftStore.getState();
      const cameraRect =
        trafficViewMode === "aircraft" ? getCameraRect(viewer) : null;
      const ids = new Set(Object.keys(aircraft));

      for (const [id, entity] of map) {
        if (!ids.has(id)) {
          viewer.entities.remove(entity);
          map.delete(id);
          categoryMap.delete(id);
        }
      }

      for (const ac of Object.values(aircraft)) {
        const code = ac.categoryCode === null ? -1 : ac.categoryCode;
        const inView =
          !cameraRect ||
          isLatLonInCameraRect(ac.rawLat, ac.rawLon, cameraRect);
        const visible =
          passesCategoryFilter(code, categoryFilter) && inView;

        if (!map.has(ac.id)) {
          map.set(ac.id, createAircraftEntity(viewer, ac));
          categoryMap.set(ac.id, ac.categoryCode);
        }

        const entity = map.get(ac.id)!;
        entity.show = visible;
        if (!visible) continue;

        const prevCategory = categoryMap.get(ac.id);
        if (prevCategory !== ac.categoryCode) {
          categoryMap.set(ac.id, ac.categoryCode);
        }

        const isSelected = selectedId === ac.id;
        applyModelStyle(entity, ac, isSelected);

        if (entity.label) {
          entity.label.fillColor = new ConstantProperty(
            Color.fromCssColorString(STATUS_COLORS[ac.status] ?? "#ffffff"),
          );
          const heightRef = ac.onGround
            ? HeightReference.CLAMP_TO_GROUND
            : HeightReference.NONE;
          entity.label.heightReference = new ConstantProperty(heightRef);
        }
      }
    };

    syncAll();
    const unsub = useAircraftStore.subscribe(syncAll);

    return () => {
      unsub();
      for (const entity of map.values()) {
        safeRemoveEntity(viewer, entity);
      }
      map.clear();
      categoryMap.clear();
    };
  }, [viewer]);

  return null;
}
