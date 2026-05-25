import { getAirport } from "../data/airports";
import { AIRCRAFT_POLL_INTERVAL_MS } from "../config/aircraftMotion";
import { fetchOpenSkyAircraft } from "../services/opensky";
import { useAircraftStore } from "../store/useAircraftStore";
import {
  removeInterpolationTarget,
  setInterpolationTarget,
  type MotionSyncMeta,
} from "./interpolationSystem";

let activeGeneration = 0;

export async function startAircraftSystem(): Promise<() => void> {
  const generation = ++activeGeneration;
  useAircraftStore.getState().setConnectionStatus("CONNECTING");

  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;

  const scheduleNextPoll = (delayMs: number): void => {
    if (generation !== activeGeneration) return;
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(() => {
      void fetchReal();
    }, delayMs);
  };

  const fetchReal = async (): Promise<void> => {
    if (generation !== activeGeneration) return;
    if (inFlight) return;

    inFlight = true;
    const fetchStartedMs = Date.now();

    const state = useAircraftStore.getState();
    const airport = getAirport(state.activeAirportId);
    const current = state.aircraft;

    try {
      const fresh = await fetchOpenSkyAircraft(airport);
      if (generation !== activeGeneration) return;

      const receivedAtMs = Date.now();
      const fetchRttMs = receivedAtMs - fetchStartedMs;

      if (fresh.length === 0) {
        console.warn(
          "OpenSky returned 0 aircraft in this region — check /api/health on the server (Vercel env vars + redeploy)",
        );
        useAircraftStore.getState().setConnectionStatus("CONNECTING");
        scheduleNextPoll(AIRCRAFT_POLL_INTERVAL_MS);
        return;
      }

      const syncMeta: MotionSyncMeta = { receivedAtMs, fetchRttMs };
      const next: Record<string, (typeof fresh)[0]> = {};
      const seen = new Set<string>();

      fresh.forEach((ac) => {
        seen.add(ac.id);
        setInterpolationTarget(current[ac.id], ac, syncMeta);
        const prev = current[ac.id];
        next[ac.id] = prev
          ? {
              ...ac,
              operatorName: prev.operatorName ?? ac.operatorName,
              aircraftModel: prev.aircraftModel ?? ac.aircraftModel,
              originAirport: prev.originAirport ?? ac.originAirport,
              destinationAirport:
                prev.destinationAirport ?? ac.destinationAirport,
            }
          : ac;
      });

      for (const id of Object.keys(current)) {
        if (!seen.has(id)) {
          removeInterpolationTarget(id);
        }
      }

      useAircraftStore.getState().setAircraft(next);
      useAircraftStore.getState().setConnectionStatus("LIVE");

      const elapsed = Date.now() - fetchStartedMs;
      const nextDelay = Math.max(0, AIRCRAFT_POLL_INTERVAL_MS - elapsed);
      scheduleNextPoll(nextDelay);
    } catch (err) {
      console.error("OpenSky fetch failed:", err);
      useAircraftStore.getState().setConnectionStatus("CONNECTING");
      scheduleNextPoll(AIRCRAFT_POLL_INTERVAL_MS);
    } finally {
      inFlight = false;
    }
  };

  await fetchReal();

  const unsub = useAircraftStore.subscribe((state, prev) => {
    if (state.airportChangeToken !== prev.airportChangeToken) {
      if (pollTimer) clearTimeout(pollTimer);
      void fetchReal();
    }
  });

  return () => {
    activeGeneration += 1;
    if (pollTimer) clearTimeout(pollTimer);
    unsub();
  };
}
