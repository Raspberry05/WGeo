import { fetchOpenSkyAircraft } from "../services/opensky";
import { useAircraftStore } from "../store/useAircraftStore";
import { setInterpolationTarget } from "./interpolationSystem";

const API_INTERVAL = 30000; // 30 seconds instead of 5

export async function startAircraftSystem(): Promise<() => void> {
  useAircraftStore.getState().setConnectionStatus("CONNECTING");

  const fetchReal = async (): Promise<void> => {
    const current = useAircraftStore.getState().aircraft;

    try {
      const fresh = await fetchOpenSkyAircraft();

      if (fresh.length === 0) {
        console.warn("OpenSky returned 0 aircraft — retrying next interval");
        useAircraftStore.getState().setConnectionStatus("CONNECTING");
        return;
      }

      // Update store with real aircraft
      fresh.forEach((ac) => {
        setInterpolationTarget(current[ac.id], ac);
        useAircraftStore.getState().upsertAircraft(ac);
      });

      useAircraftStore.getState().setConnectionStatus("LIVE");
    } catch (err) {
      console.error("OpenSky fetch failed:", err);
      useAircraftStore.getState().setConnectionStatus("CONNECTING");
    }
  };

  // Initial fetch
  await fetchReal();

  // Poll every 5 seconds
  const apiTimer = setInterval(fetchReal, API_INTERVAL);

  return () => {
    clearInterval(apiTimer);
  };
}
