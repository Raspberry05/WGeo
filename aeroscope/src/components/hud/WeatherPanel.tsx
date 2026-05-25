import { useEffect, useState } from "react";
import { getAirport } from "../../data/airports";
import { fetchWeather, type WeatherSnapshot } from "../../services/weather";
import {
  formatPressureInHg,
  formatSpeedKnots,
  formatTemperatureCelsius,
} from "../../utils/flightUnits";
import { useAircraftStore } from "../../store/useAircraftStore";
import { HUD_FONT_SM, hudMuted } from "./hudTheme";

export function WeatherPanel() {
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    if (!catalogReady) return;
    const airport = getAirport(activeAirportId);
    let cancelled = false;
    void fetchWeather(airport.lat, airport.lon).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, [activeAirportId, catalogReady]);

  if (!weather) {
    return (
      <span style={{ color: hudMuted, fontSize: HUD_FONT_SM }}>WX · …</span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        color: "#8aa0b0",
        fontSize: HUD_FONT_SM,
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
