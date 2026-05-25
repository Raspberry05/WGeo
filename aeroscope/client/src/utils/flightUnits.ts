import { metersToFeet } from "./geoMath";

/** Internal storage: velocity m/s, altitude m, distance m, pressure hPa, mass kg, temp °C */

const M_PER_NM = 1852;
const MPS_TO_KNOTS = 1.94384;
const HPA_TO_INHG = 0.02953;
const KG_TO_LB = 2.20462;

export function velocityToKnots(velocityMs: number): number {
  return velocityMs * MPS_TO_KNOTS;
}

export function formatSpeedKnots(velocityMs: number): string {
  return `${Math.round(velocityToKnots(velocityMs))} kt`;
}

export function metersToNauticalMiles(meters: number): number {
  return meters / M_PER_NM;
}

export function formatDistanceNm(distanceMeters: number): string {
  const nm = metersToNauticalMiles(distanceMeters);
  if (nm < 10) return `${nm.toFixed(1)} NM`;
  return `${Math.round(nm)} NM`;
}

export function formatAltitudeFeet(altitudeMeters: number): string {
  return `${Math.round(metersToFeet(altitudeMeters)).toLocaleString()} ft`;
}

/** @deprecated Use formatAltitudeFeet for HUD display */
export function formatAltitudeMeters(altitudeMeters: number): string {
  return `${Math.round(altitudeMeters).toLocaleString()} m`;
}

export function hpaToInHg(hpa: number): number {
  return hpa * HPA_TO_INHG;
}

export function formatPressureInHg(pressureHpa: number): string {
  return `${hpaToInHg(pressureHpa).toFixed(2)} inHg`;
}

export function formatTemperatureCelsius(tempC: number): string {
  return `${Math.round(tempC)}°C`;
}

export function formatWeightLb(massKg: number): string {
  return `${Math.round(massKg * KG_TO_LB).toLocaleString()} lb`;
}

export function formatWeightKg(massKg: number): string {
  if (massKg >= 1000) {
    return `${(massKg / 1000).toFixed(1)} t`;
  }
  return `${Math.round(massKg).toLocaleString()} kg`;
}

/** Typical max takeoff mass by OpenSky category (kg), for HUD estimate only. */
export function estimateMassKg(categoryCode: number | null): number {
  switch (categoryCode) {
    case 2:
      return 1200;
    case 3:
      return 5500;
    case 4:
      return 75000;
    case 5:
      return 180000;
    case 6:
      return 350000;
    case 7:
      return 4500;
    case 8:
      return 2500;
    case 9:
      return 600;
    case 10:
      return 300;
    case 13:
      return 25;
    default:
      return 70000;
  }
}

export function formatUtcTime(dateMs: number = Date.now()): string {
  return new Date(dateMs).toISOString().slice(11, 19) + " UTC";
}

export function formatUtcDateTime(dateMs: number): string {
  const iso = new Date(dateMs).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
}
