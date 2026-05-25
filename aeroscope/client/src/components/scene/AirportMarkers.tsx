import {
  Color,
  Cartesian2,
  Cartesian3,
  LabelStyle,
  VerticalOrigin,
} from "cesium";
import { Entity } from "resium";
import { getAllAirports } from "../../data/airports";
import { useAircraftStore } from "../../store/useAircraftStore";

export function AirportMarkers() {
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const setActiveAirport = useAircraftStore((s) => s.setActiveAirport);
  const requestCameraFly = useAircraftStore((s) => s.requestCameraFly);

  return (
    <>
      {getAllAirports().map((airport) => {
        const isActive = airport.id === activeAirportId;
        const accent = isActive ? "#00ff88" : "#666666";
        const label = `${airport.id} · ${airport.name}`;

        return (
          <Entity
            key={airport.id}
            id={`airport-${airport.id}`}
            name={airport.name}
            position={Cartesian3.fromDegrees(airport.lon, airport.lat, 0)}
            onClick={() => {
              setActiveAirport(airport.id);
              requestCameraFly("airport", airport.id);
            }}
            point={{
              pixelSize: isActive ? 14 : 10,
              color: Color.fromCssColorString(accent),
              outlineColor: Color.WHITE,
              outlineWidth: isActive ? 2 : 1,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            }}
            label={{
              text: label,
              font: isActive ? "12px monospace" : "11px monospace",
              fillColor: Color.fromCssColorString(isActive ? "#00ff88" : "#aaaaaa"),
              outlineColor: Color.BLACK,
              outlineWidth: 2,
              style: LabelStyle.FILL,
              verticalOrigin: VerticalOrigin.BOTTOM,
              pixelOffset: new Cartesian2(0, -20),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              showBackground: true,
              backgroundColor: Color.fromCssColorString("rgba(0,0,0,0.7)"),
              scale: isActive ? 1.1 : 0.9,
            }}
            ellipse={{
              semiMajorAxis: airport.radiusKm * 1000,
              semiMinorAxis: airport.radiusKm * 1000,
              height: 0,
              material: Color.fromCssColorString(
                isActive ? "rgba(0,255,136,0.08)" : "rgba(120,120,120,0.04)",
              ),
              outline: true,
              outlineColor: Color.fromCssColorString(
                isActive ? "#00ff88" : "#444444",
              ),
              outlineWidth: isActive ? 2 : 1,
            }}
          />
        );
      })}
    </>
  );
}
