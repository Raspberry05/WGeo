import { useMemo } from "react";
import {
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Color,
  HeadingPitchRoll,
  LabelStyle,
  Transforms,
  VerticalOrigin,
} from "cesium";
import { Entity } from "resium";
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
  const isSelected = selectedId === aircraft.id;
  const color = STATUS_COLORS[aircraft.status] ?? "#ffffff";

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
        return Transforms.headingPitchRollQuaternion(
          pos,
          new HeadingPitchRoll(geo.headingRad, 0, 0),
          undefined,
          result,
        );
      }, false),
    [aircraft.id],
  );

  const pixelSize = aircraft.onGround ? 10 : 14;

  return (
    <Entity
      id={aircraft.id}
      name={aircraft.callsign}
      position={position}
      orientation={orientation}
      onClick={() => selectAircraft(isSelected ? null : aircraft.id)}
      point={{
        pixelSize: isSelected ? pixelSize + 4 : pixelSize,
        color: Color.fromCssColorString(color),
        outlineColor: Color.WHITE,
        outlineWidth: isSelected ? 2 : 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }}
      label={{
        text: aircraft.callsign,
        font: "11px monospace",
        fillColor: Color.fromCssColorString(color),
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: Color.fromCssColorString("rgba(0,0,0,0.65)"),
      }}
    />
  );
}
