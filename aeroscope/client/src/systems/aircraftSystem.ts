import { fetchOpenSkyAircraft } from "./opensky";
import { tickMockSimulation } from "../services/mockSimulation";
import { useAircraftStore } from "../store/useAircraftStore";
import { setInterpolationTarget } from "./interpolationSystem";

const API_INTERVAL = 5000; // 5 seconds (safe)
const SIM_TICK = 2000; // 2 seconds visual tick


export async function startAircraftSystem(): Promise<() => void> {
  useAircraftStore.getState().setConnectionStatus("CONNECTING");

  const fetchReal = async (): Promise<boolean> => {
    const current = useAircraftStore.getState().aircraft;
    try {
      const fresh = await fetchOpenSkyAircraft();
      if (fresh.length === 0) throw new Error("Empty");
      fresh.forEach((ac) => {
        setInterpolationTarget(current[ac.id], ac);
        useAircraftStore.getState().upsertAircraft(ac);
      });
      useAircraftStore.getState().setConnectionStatus("LIVE");
      return true;
    } catch {
      return false;
    }
  };

  const runSimTick = () => {
    const current = useAircraftStore.getState().aircraft;
    tickMockSimulation().forEach((ac) => {
      setInterpolationTarget(current[ac.id], ac);
      useAircraftStore.getState().upsertAircraft(ac);
    });
    useAircraftStore.getState().setConnectionStatus("SIMULATED");
  };

  const gotReal = await fetchReal();
  if (!gotReal) runSimTick();

  const apiTimer = setInterval(fetchReal, API_INTERVAL);
  const simTimer = setInterval(runSimTick, SIM_TICK);

  return () => {
    clearInterval(apiTimer);
    clearInterval(simTimer);
  };
}
