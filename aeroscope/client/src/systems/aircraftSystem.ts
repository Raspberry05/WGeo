import { getAirport } from "../data/airports";
import { fetchOpenSkyAircraft } from "../services/opensky";
import { useAircraftStore } from "../store/useAircraftStore";
import { setInterpolationTarget } from "./interpolationSystem";

const API_INTERVAL = 30000;

export async function startAircraftSystem(): Promise<() => void> {
  useAircraftStore.getState().setConnectionStatus("CONNECTING");

  const fetchReal = async (): Promise<void> => {
    const state = useAircraftStore.getState();
    const airport = getAirport(state.activeAirportId);
    const current = state.aircraft;

    try {
      const fresh = await fetchOpenSkyAircraft(airport);

      if (fresh.length === 0) {
        console.warn("OpenSky returned 0 aircraft — retrying next interval");
        useAircraftStore.getState().setConnectionStatus("CONNECTING");
        return;
      }

      const next: Record<string, (typeof fresh)[0]> = {};
      fresh.forEach((ac) => {
        setInterpolationTarget(current[ac.id], ac);
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

      useAircraftStore.getState().setAircraft(next);
      useAircraftStore.getState().setConnectionStatus("LIVE");
    } catch (err) {
      console.error("OpenSky fetch failed:", err);
      useAircraftStore.getState().setConnectionStatus("CONNECTING");
    }
  };

  await fetchReal();

  const apiTimer = setInterval(fetchReal, API_INTERVAL);

  const unsub = useAircraftStore.subscribe((state, prev) => {
    if (state.airportChangeToken !== prev.airportChangeToken) {
      void fetchReal();
    }
  });

  return () => {
    clearInterval(apiTimer);
    unsub();
  };
}
