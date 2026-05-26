import type { Viewer } from "cesium";
import { isViewerLive } from "./cesiumViewerReady";

const DEFAULT_SETTLED_DEBOUNCE_MS = 150;
const DEFAULT_TILE_TIMEOUT_MS = 12_000;
const DEFAULT_MIN_DWELL_MS = 400;

export type WaitForGlobeTilesSettledOptions = {
  settledDebounceMs?: number;
  timeoutMs?: number;
  isCancelled?: () => boolean;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitMinDwell(ms: number = DEFAULT_MIN_DWELL_MS): Promise<void> {
  return delay(ms);
}

/**
 * Wait until globe imagery/terrain tiles finish loading (queue hits 0 with debounce).
 */
export function waitForGlobeTilesSettled(
  viewer: Viewer,
  options: WaitForGlobeTilesSettledOptions = {},
): Promise<void> {
  const settledDebounceMs =
    options.settledDebounceMs ?? DEFAULT_SETTLED_DEBOUNCE_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TILE_TIMEOUT_MS;
  const isCancelled = options.isCancelled;

  return new Promise((resolve) => {
    if (!isViewerLive(viewer)) {
      resolve();
      return;
    }

    let settledTimer: ReturnType<typeof setTimeout> | null = null;
    let finished = false;

    const removeListener = viewer.scene.globe.tileLoadProgressEvent.addEventListener(
      (remaining: number) => {
        if (finished) return;
        if (isCancelled?.() || !isViewerLive(viewer)) {
          finished = true;
          if (settledTimer) clearTimeout(settledTimer);
          removeListener();
          resolve();
          return;
        }
        if (remaining === 0) {
          if (settledTimer) clearTimeout(settledTimer);
          settledTimer = setTimeout(() => {
            if (finished) return;
            finished = true;
            removeListener();
            resolve();
          }, settledDebounceMs);
        } else if (settledTimer) {
          clearTimeout(settledTimer);
          settledTimer = null;
        }
      },
    );

    setTimeout(() => {
      if (finished) return;
      console.warn(
        "[Aeroscope] Globe tile load timeout; dismissing boot overlay.",
      );
      finished = true;
      if (settledTimer) clearTimeout(settledTimer);
      removeListener();
      resolve();
    }, timeoutMs);
  });
}
