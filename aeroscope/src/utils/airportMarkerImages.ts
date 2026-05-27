/** Airport marker images (canvas → data URL) by facility type. */

import {
  isAirportType,
  type AirportType,
} from "@/config/airportFilters";

type MarkerStyle = {
  fill: string;
  stroke: string;
  lineWidth: number;
};

const INACTIVE_TRIANGLE: MarkerStyle = {
  fill: "#f2f6ff",
  stroke: "#ffffff",
  lineWidth: 2,
};

const ACTIVE_TRIANGLE: MarkerStyle = {
  fill: "#7dffd4",
  stroke: "#ffffff",
  lineWidth: 2.5,
};

const INACTIVE_SPECIAL: MarkerStyle = {
  fill: "#e8f0ff",
  stroke: "#ffffff",
  lineWidth: 2,
};

const ACTIVE_SPECIAL: MarkerStyle = {
  fill: "#7dffd4",
  stroke: "#ffffff",
  lineWidth: 2.5,
};

function drawUpTriangle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: MarkerStyle,
): void {
  const cx = width / 2;
  const tipY = height * 0.12;
  const baseY = height * 0.92;
  const halfBase = width * 0.42;

  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.lineTo(cx + halfBase, baseY);
  ctx.lineTo(cx - halfBase, baseY);
  ctx.closePath();
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.lineWidth;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function drawHeliport(
  ctx: CanvasRenderingContext2D,
  size: number,
  style: MarkerStyle,
  isActive: boolean,
): void {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.lineWidth;
  ctx.stroke();

  ctx.fillStyle = isActive ? "#ffffff" : "#0a1830";
  ctx.font = `bold ${Math.round(size * 0.48)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", cx, cy + size * 0.02);
}

function drawSeaplaneBase(
  ctx: CanvasRenderingContext2D,
  size: number,
  style: MarkerStyle,
): void {
  const pad = size * 0.12;
  const w = size - pad * 2;
  const h = size - pad * 2;
  const x = pad;
  const y = pad;
  const r = size * 0.14;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.lineWidth;
  ctx.stroke();

  ctx.strokeStyle = "rgba(10,24,48,0.35)";
  ctx.lineWidth = 1.2;
  const waveY = y + h * 0.72;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, waveY);
  ctx.quadraticCurveTo(x + w * 0.5, waveY - h * 0.12, x + w * 0.8, waveY);
  ctx.stroke();
}

function renderMarker(
  airportType: AirportType,
  isActive: boolean,
  width: number,
  height: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, width, height);

  if (airportType === "heliport") {
    const size = Math.min(width, height);
    drawHeliport(
      ctx,
      size,
      isActive ? ACTIVE_SPECIAL : INACTIVE_SPECIAL,
      isActive,
    );
  } else if (airportType === "seaplane_base") {
    const size = Math.min(width, height);
    drawSeaplaneBase(ctx, size, isActive ? ACTIVE_SPECIAL : INACTIVE_SPECIAL);
  } else {
    drawUpTriangle(
      ctx,
      width,
      height,
      isActive ? ACTIVE_TRIANGLE : INACTIVE_TRIANGLE,
    );
  }

  return canvas.toDataURL("image/png");
}

const imageCache = new Map<string, string>();

function cacheKey(type: AirportType, isActive: boolean): string {
  return `${type}:${isActive ? "a" : "i"}`;
}

/** Marker image for an airport type (triangles, H-in-circle, or seaplane square). */
export function getAirportMarkerImage(
  airportType: string,
  isActive: boolean,
  width: number,
  height: number,
): string {
  const type: AirportType = isAirportType(airportType)
    ? airportType
    : "small_airport";
  const key = `${cacheKey(type, isActive)}:${width}x${height}`;
  const hit = imageCache.get(key);
  if (hit) return hit;

  const url = renderMarker(type, isActive, width, height);
  imageCache.set(key, url);
  return url;
}

/** @deprecated Use getAirportMarkerImage(type, …) */
export function getInactiveAirportMarkerImage(): string {
  return getAirportMarkerImage("large_airport", false, 20, 24);
}

/** @deprecated Use getAirportMarkerImage(type, …) */
export function getActiveAirportMarkerImage(): string {
  return getAirportMarkerImage("large_airport", true, 28, 34);
}
