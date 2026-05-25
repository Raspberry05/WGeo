/** Upward-pointing triangle marker images (canvas → data URL) for airport billboards. */

type TriangleStyle = {
  fill: string;
  stroke: string;
  lineWidth: number;
};

function drawUpTriangle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: TriangleStyle,
): void {
  const { fill, stroke, lineWidth } = style;
  const cx = width / 2;
  const tipY = height * 0.12;
  const baseY = height * 0.92;
  const halfBase = width * 0.42;

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.lineTo(cx + halfBase, baseY);
  ctx.lineTo(cx - halfBase, baseY);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function toDataUrl(
  width: number,
  height: number,
  style: TriangleStyle,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  drawUpTriangle(ctx, width, height, style);
  return canvas.toDataURL("image/png");
}

let inactiveMarkerImage: string | null = null;
let activeMarkerImage: string | null = null;

/** Light marker for contrast on dark terrain imagery. */
export function getInactiveAirportMarkerImage(): string {
  if (!inactiveMarkerImage) {
    inactiveMarkerImage = toDataUrl(20, 24, {
      fill: "#f2f6ff",
      stroke: "#ffffff",
      lineWidth: 2,
    });
  }
  return inactiveMarkerImage;
}

/** Brighter active airport marker. */
export function getActiveAirportMarkerImage(): string {
  if (!activeMarkerImage) {
    activeMarkerImage = toDataUrl(28, 34, {
      fill: "#7dffd4",
      stroke: "#ffffff",
      lineWidth: 2.5,
    });
  }
  return activeMarkerImage;
}
