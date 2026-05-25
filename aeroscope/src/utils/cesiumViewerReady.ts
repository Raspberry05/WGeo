import type { Entity, Viewer } from "cesium";

const DEFAULT_POLL_MS = 50;
const DEFAULT_TIMEOUT_MS = 5000;

export type WaitForViewerReadyOptions = {
  pollIntervalMs?: number;
  timeoutMs?: number;
  requireCanvasSize?: boolean;
};

export function isViewerUsable(
  viewer: Viewer,
  requireCanvasSize = true,
): boolean {
  if (viewer.isDestroyed()) return false;

  const scene = viewer.scene;
  if (!scene?.globe) return false;

  if (!requireCanvasSize) return true;

  const canvas = viewer.canvas;
  return canvas.clientWidth > 0 && canvas.clientHeight > 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Poll until the Viewer scene/globe (and optionally canvas) are ready. */
export async function waitForViewerReady(
  viewer: Viewer,
  options: WaitForViewerReadyOptions = {},
): Promise<boolean> {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const requireCanvasSize = options.requireCanvasSize ?? true;

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (viewer.isDestroyed()) {
      return false;
    }
    try {
      viewer.resize();
    } catch {
      // ignore until canvas is attached
    }
    if (isViewerUsable(viewer, requireCanvasSize)) {
      return true;
    }
    await delay(pollIntervalMs);
  }

  if (viewer.isDestroyed()) {
    return false;
  }

  return isViewerUsable(viewer, false);
}

/** Viewer exists, is not destroyed, and exposes entities (safe for add/remove). */
export function isViewerLive(
  viewer: Viewer | null | undefined,
): viewer is Viewer {
  if (!viewer) return false;
  if (viewer.isDestroyed()) return false;
  return viewer.entities != null;
}

export function safeResize(viewer: Viewer): boolean {
  if (!isViewerLive(viewer)) return false;
  try {
    viewer.resize();
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveEntity(
  viewer: Viewer,
  entity: Entity | null | undefined,
): void {
  if (!entity || !isViewerLive(viewer)) return;
  try {
    viewer.entities.remove(entity);
  } catch {
    // Viewer destroyed during teardown
  }
}
