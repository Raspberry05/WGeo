import { create } from "zustand";
import { DEFAULT_AIRPORT_ID } from "../data/airports";

export type AircraftStatus = "taxiing" | "airborne" | "landing" | "parked";
export type CameraFlyTarget = "airport" | "aircraft";
export type CameraMode = "free" | "follow";

export interface AircraftState {
  id: string;
  callsign: string;
  icao24: string;
  position: [number, number, number];
  rawLat: number;
  rawLon: number;
  velocity: number;
  heading: number;
  altitudeMeters: number;
  onGround: boolean;
  status: AircraftStatus;
  /** Client time when this row was received from our API (ms). */
  lastUpdated: number;
  /** OpenSky `time_position` (ms), if present — when the fix was recorded. */
  positionTimeMs: number | null;
  aircraftType: string;
  categoryCode: number | null;
  originCountry: string;
  operatorName: string | null;
  aircraftModel: string | null;
  originAirport: string | null;
  destinationAirport: string | null;
}

interface AircraftStore {
  aircraft: Record<string, AircraftState>;
  selectedId: string | null;
  activeAirportId: string;
  activeAirportPickEnabled: boolean;
  connectionStatus: "LIVE" | "SIMULATED" | "CONNECTING";
  cameraMode: CameraMode;
  airportChangeToken: number;
  cameraFlyToken: number;
  cameraFlyTarget: CameraFlyTarget;
  cameraFlyTargetId: string | null;
  categoryFilter: number[] | null;
  airportCatalogReady: boolean;
  hoveredAirportId: string | null;
  hoverScreen: { x: number; y: number } | null;

  setAircraft: (aircraft: Record<string, AircraftState>) => void;
  setAirportCatalogReady: (ready: boolean) => void;
  upsertAircraft: (ac: AircraftState) => void;
  enrichAircraft: (id: string, patch: Partial<AircraftState>) => void;
  selectAircraft: (id: string | null) => void;
  setActiveAirport: (id: string) => void;
  requestCameraFly: (target: CameraFlyTarget, id?: string) => void;
  setConnectionStatus: (s: "LIVE" | "SIMULATED" | "CONNECTING") => void;
  setCameraMode: (mode: CameraMode) => void;
  setCategoryFilter: (codes: number[] | null) => void;
  setAirportHover: (
    airportId: string | null,
    screen: { x: number; y: number } | null,
  ) => void;
}

export const useAircraftStore = create<AircraftStore>((set) => ({
  aircraft: {},
  selectedId: null,
  activeAirportId: DEFAULT_AIRPORT_ID,
  activeAirportPickEnabled: true,
  connectionStatus: "CONNECTING",
  cameraMode: "free",
  airportChangeToken: 0,
  cameraFlyToken: 0,
  cameraFlyTarget: "airport",
  cameraFlyTargetId: DEFAULT_AIRPORT_ID,
  categoryFilter: null,
  airportCatalogReady: false,
  hoveredAirportId: null,
  hoverScreen: null,

  setAircraft: (aircraft) => set({ aircraft }),
  setAirportCatalogReady: (airportCatalogReady) => set({ airportCatalogReady }),
  upsertAircraft: (ac) =>
    set((state) => ({
      aircraft: { ...state.aircraft, [ac.id]: ac },
    })),
  enrichAircraft: (id, patch) =>
    set((state) => {
      const existing = state.aircraft[id];
      if (!existing) return state;
      return {
        aircraft: {
          ...state.aircraft,
          [id]: { ...existing, ...patch },
        },
      };
    }),
  selectAircraft: (id) =>
    set({
      selectedId: id,
      cameraMode: id ? "follow" : "free",
    }),
  setActiveAirport: (id) =>
    set((state) => {
      if (id === state.activeAirportId && state.activeAirportPickEnabled) {
        return { activeAirportPickEnabled: false };
      }
      return {
        activeAirportId: id,
        activeAirportPickEnabled: true,
        selectedId: null,
        aircraft: {},
        cameraMode: "free",
        airportChangeToken: state.airportChangeToken + 1,
      };
    }),
  requestCameraFly: (target, id) =>
    set((state) => ({
      cameraFlyTarget: target,
      cameraFlyTargetId: id ?? state.activeAirportId,
      cameraFlyToken: state.cameraFlyToken + 1,
    })),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setAirportHover: (hoveredAirportId, hoverScreen) =>
    set({ hoveredAirportId, hoverScreen }),
}));

export function passesCategoryFilter(
  categoryCode: number,
  filter: number[] | null,
): boolean {
  if (!filter || filter.length === 0) return true;
  return filter.includes(categoryCode);
}
