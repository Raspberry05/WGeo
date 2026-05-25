import { formatPressureInHg, formatSpeedKnots, formatTemperatureCelsius } from "../utils/flightUnits";

export interface WeatherSnapshot {
  temperatureC: number;
  windSpeedMs: number;
  pressureHpa: number;
  weatherCode: number;
  label: string;
}

const cache = new Map<string, { data: WeatherSnapshot; at: number }>();
const CACHE_TTL_MS = 600_000;

function wmoLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "—";
}

export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<WeatherSnapshot | null> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.data;
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "current",
      "temperature_2m,weather_code,wind_speed_10m,surface_pressure",
    );
    url.searchParams.set("timezone", "UTC");

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const json = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        surface_pressure?: number;
      };
    };

    const current = json.current;
    if (!current) return null;

    const weatherCode = Number(current.weather_code ?? 0);
    const data: WeatherSnapshot = {
      temperatureC: Number(current.temperature_2m ?? 0),
      windSpeedMs: Number(current.wind_speed_10m ?? 0),
      pressureHpa: Number(current.surface_pressure ?? 1013),
      weatherCode,
      label: wmoLabel(weatherCode),
    };

    cache.set(key, { data, at: Date.now() });
    return data;
  } catch {
    return null;
  }
}

export function formatWeatherLine(weather: WeatherSnapshot): string {
  return [
    weather.label,
    formatTemperatureCelsius(weather.temperatureC),
    formatPressureInHg(weather.pressureHpa),
    formatSpeedKnots(weather.windSpeedMs) + " wind",
  ].join(" · ");
}
