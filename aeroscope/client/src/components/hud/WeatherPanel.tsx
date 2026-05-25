import { useEffect, useState } from "react";
import { getAirport } from "../../data/airports";
import { fetchWeather, type WeatherSnapshot } from "../../services/weather";
import {
  formatPressureInHg,
  formatSpeedKnots,
  formatTemperatureCelsius,
} from "../../utils/flightUnits";
import { useAircraftStore } from "../../store/useAircraftStore";

export function WeatherPanel() {
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    const airport = getAirport(activeAirportId);
    let cancelled = false;
    void fetchWeather(airport.lat, airport.lon).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, [activeAirportId]);

  if (!weather) {
    return (
      <span style={{ color: "#4a6a5a", fontSize: "10px" }}>WX · …</span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        color: "#8aa0b0",
        fontSize: "10px",
        letterSpacing: "0.5px",
      }}
    >
      <span style={{ color: "#6a8a9a" }}>WX</span>
      <span style={{ color: "#c8dce8" }}>{weather.label}</span>
      <span>{formatTemperatureCelsius(weather.temperatureC)}</span>
      <span>{formatPressureInHg(weather.pressureHpa)}</span>
      <span style={{ color: "#4a6a5a" }}>
        {formatSpeedKnots(weather.windSpeedMs)} wind
      </span>
    </span>
  );
}
