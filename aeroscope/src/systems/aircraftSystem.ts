import { getAirport } from "../data/airports";
import { AIRCRAFT_POLL_INTERVAL_MS } from "../config/aircraftMotion";
import { VIEWPORT_POLL_VIEWER_RETRY_MS } from "../config/trafficView";
import type { CameraRect } from "../utils/cameraBounds";
import { fetchFlightsInBounds } from "../services/flights";
import { useAircraftStore, type AircraftState } from "../store/useAircraftStore";
import { useCesiumStore } from "../store/useCesiumStore";
import { getViewportBounds } from "../utils/cameraBounds";
import { mergeViewportAircraftPoll } from "./viewportAircraftMerge";
import type { FlightBounds } from "../lib/aeroapi/bounds";
import { boundsKey } from "../lib/aeroapi/bounds";
import {
  removeInterpolationTarget,
  setInterpolationTarget,
  type MotionSyncMeta,
} from "./interpolationSystem";

let activeGeneration = 0;
let pollNow: (() => void) | null = null;

/** Immediate poll when viewport changes (aircraft traffic mode). */
export function requestAircraftPoll(): void {
  pollNow?.();
}

function mergeAircraftRow(
  prev: AircraftState | undefined,
  ac: AircraftState,
): AircraftState {
  if (!prev) return ac;
  return {
    ...ac,
    operatorName: prev.operatorName ?? ac.operatorName,
    aircraftModel: prev.aircraftModel ?? ac.aircraftModel,
    originAirport: prev.originAirport ?? ac.originAirport,
    destinationAirport: prev.destinationAirport ?? ac.destinationAirport,
    flightDetail: prev.flightDetail ?? ac.flightDetail,
  };
}

export async function startAircraftSystem(): Promise<() => void> {
  const generation = ++activeGeneration;
  useAircraftStore.getState().setConnectionStatus("CONNECTING");

  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let pendingPoll = false;
  let activeAbort: AbortController | null = null;

  const scheduleNextPoll = (delayMs: number): void => {
    if (generation !== activeGeneration) return;
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(() => {
      void fetchReal();
    }, delayMs);
  };

  const resolvePollContext = (): {
    bounds: FlightBounds | FlightBounds[];
    scene:
      | { mode: "airport"; airport: ReturnType<typeof getAirport> }
      | { mode: "viewport"; refLat: number; refLon: number };
    centerLat: number;
    centerLon: number;
    cameraRect?: CameraRect;
    boundsKey: string;
  } | null => {
    const state = useAircraftStore.getState();

    if (state.trafficViewMode === "airport") {
      const airport = getAirport(state.activeAirportId);
      return {
        bounds: airport.bounds,
        scene: { mode: "airport", airport },
        centerLat: airport.lat,
        centerLon: airport.lon,
        boundsKey: boundsKey(airport.bounds),
      };
    }

    const viewer = useCesiumStore.getState().viewer;
    if (!viewer) return null;

    const viewport = getViewportBounds(viewer);
    if (!viewport) return null;

    useAircraftStore.getState().setViewportMeta({
      clamped: viewport.clamped,
      sceneRefLat: viewport.centerLat,
      sceneRefLon: viewport.centerLon,
    });

    return {
      bounds: viewport.bounds,
      scene: {
        mode: "viewport",
        refLat: viewport.centerLat,
        refLon: viewport.centerLon,
      },
      centerLat: viewport.centerLat,
      centerLon: viewport.centerLon,
      cameraRect: viewport.cameraRect,
      boundsKey: viewport.bounds.map((b) => boundsKey(b)).sort().join("|"),
    };
  };

  const fetchReal = async (): Promise<void> => {
    if (generation !== activeGeneration) return;
    if (inFlight) {
      pendingPoll = true;
      activeAbort?.abort();
      return;
    }

    const ctx = resolvePollContext();
    if (!ctx) {
      const mode = useAircraftStore.getState().trafficViewMode;
      const retryMs =
        mode === "aircraft"
          ? VIEWPORT_POLL_VIEWER_RETRY_MS
          : AIRCRAFT_POLL_INTERVAL_MS;
      scheduleNextPoll(retryMs);
      return;
    }

    inFlight = true;
    const fetchStartedMs = Date.now();
    pendingPoll = false;
    activeAbort?.abort();
    activeAbort = new AbortController();

    const state = useAircraftStore.getState();
    const current = state.aircraft;

    try {
      const fresh = await fetchFlightsInBounds(ctx.bounds, ctx.scene, {
        centerLat: ctx.centerLat,
        centerLon: ctx.centerLon,
        cameraRect: ctx.cameraRect,
        signal: activeAbort.signal,
      });
      if (generation !== activeGeneration) return;

      // If the camera moved while we were fetching, don't apply stale results.
      const latest = resolvePollContext();
      if (latest && latest.boundsKey !== ctx.boundsKey) {
        pendingPoll = true;
        return;
      }

      const receivedAtMs = Date.now();
      const fetchRttMs = receivedAtMs - fetchStartedMs;

      if (fresh.length === 0) {
        console.warn(
          "No aircraft in this region — check /api/health (AEROAPI_API_KEY on Vercel)",
        );
        useAircraftStore.getState().setConnectionStatus("CONNECTING");
        scheduleNextPoll(AIRCRAFT_POLL_INTERVAL_MS);
        return;
      }

      const syncMeta: MotionSyncMeta = { receivedAtMs, fetchRttMs };

      const next =
        ctx.scene.mode === "viewport" && ctx.cameraRect
          ? mergeViewportAircraftPoll(
              current,
              fresh,
              ctx.cameraRect,
              syncMeta,
            )
          : (() => {
              const map: Record<string, AircraftState> = {};
              fresh.forEach((ac) => {
                setInterpolationTarget(current[ac.id], ac, syncMeta);
                map[ac.id] = mergeAircraftRow(current[ac.id], ac);
              });
              for (const id of Object.keys(current)) {
                if (!map[id]) removeInterpolationTarget(id);
              }
              return map;
            })();

      useAircraftStore.getState().setAircraft(next);
      useAircraftStore.getState().setConnectionStatus("LIVE");

      const elapsed = Date.now() - fetchStartedMs;
      const nextDelay = Math.max(0, AIRCRAFT_POLL_INTERVAL_MS - elapsed);
      scheduleNextPoll(nextDelay);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") {
        // Camera moved: we'll refetch immediately if requested.
        pendingPoll = true;
        return;
      }
      console.error("Flight data fetch failed:", err);
      useAircraftStore.getState().setConnectionStatus("CONNECTING");
      scheduleNextPoll(AIRCRAFT_POLL_INTERVAL_MS);
    } finally {
      inFlight = false;
      activeAbort = null;

      if (pendingPoll) {
        pendingPoll = false;
        if (pollTimer) clearTimeout(pollTimer);
        void fetchReal();
      }
    }
  };

  pollNow = () => {
    if (pollTimer) clearTimeout(pollTimer);
    void fetchReal();
  };

  await fetchReal();

  const unsub = useAircraftStore.subscribe((state, prev) => {
    if (
      state.airportChangeToken !== prev.airportChangeToken ||
      state.viewModeToken !== prev.viewModeToken
    ) {
      if (pollTimer) clearTimeout(pollTimer);
      void fetchReal();
    }
  });

  return () => {
    activeGeneration += 1;
    pollNow = null;
    if (pollTimer) clearTimeout(pollTimer);
    unsub();
  };
}
