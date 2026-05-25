import { useMemo } from "react";
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
} from "cesium";
import { Entity } from "resium";
import { getAircraftModelConfig } from "../../config/aircraftModels";
import type { AircraftState } from "../../store/useAircraftStore";
import { useAircraftStore } from "../../store/useAircraftStore";
import { getInterpolatedGeoState } from "../../systems/interpolationSystem";

interface Props {
  aircraft: AircraftState;
}

const STATUS_COLORS: Record<string, string> = {
  airborne: "#00ff88",
  landing: "#ffaa00",
  taxiing: "#00aaff",
  parked: "#888888",
};

export function AircraftEntity({ aircraft }: Props) {
  const selectedId = useAircraftStore((s) => s.selectedId);
  const selectAircraft = useAircraftStore((s) => s.selectAircraft);
  const requestCameraFly = useAircraftStore((s) => s.requestCameraFly);
  const isSelected = selectedId === aircraft.id;
  const color = STATUS_COLORS[aircraft.status] ?? "#ffffff";
  const modelConfig = getAircraftModelConfig(aircraft.categoryCode);

  const position = useMemo(
    () =>
      new CallbackPositionProperty((_time, result) => {
        const ac = useAircraftStore.getState().aircraft[aircraft.id];
        if (!ac) return Cartesian3.ZERO;
        const geo = getInterpolatedGeoState(ac);
        return Cartesian3.fromDegrees(geo.lon, geo.lat, geo.altMeters, undefined, result);
      }, false),
    [aircraft.id],
  );

  const orientation = useMemo(
    () =>
      new CallbackProperty((_time, result) => {
        const ac = useAircraftStore.getState().aircraft[aircraft.id];
        if (!ac) return undefined;
        const geo = getInterpolatedGeoState(ac);
        const pos = Cartesian3.fromDegrees(geo.lon, geo.lat, geo.altMeters);
        const pitch = geo.clampToGround ? 0 : -0.08;
        return Transforms.headingPitchRollQuaternion(
          pos,
          new HeadingPitchRoll(geo.headingRad, pitch, 0),
          undefined,
          undefined,
          result,
        );
      }, false),
    [aircraft.id],
  );

  const heightRef = aircraft.onGround
    ? HeightReference.CLAMP_TO_GROUND
    : HeightReference.NONE;

  const modelScale = modelConfig.scale * (aircraft.onGround ? 0.85 : 1);

  return (
    <Entity
      id={aircraft.id}
      name={aircraft.callsign}
      position={position}
      orientation={orientation}
      heightReference={heightRef}
      onClick={() => {
        if (isSelected) {
          selectAircraft(null);
        } else {
          selectAircraft(aircraft.id);
          requestCameraFly("aircraft", aircraft.id);
        }
      }}
      model={{
        uri: modelConfig.uri,
        scale: modelScale,
        minimumPixelSize: modelConfig.minimumPixelSize,
        heightReference: heightRef,
        color: Color.fromCssColorString(color),
        silhouetteColor: Color.fromCssColorString(color),
        silhouetteSize: isSelected ? 2.5 : 1.2,
        colorBlendMode: 0,
        colorBlendAmount: isSelected ? 0.35 : 0.15,
      }}
      label={{
        text: aircraft.callsign,
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
      }}
    />
  );
}
