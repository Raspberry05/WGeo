import { create } from "zustand";
import { DEFAULT_AIRPORT_ID } from "../data/airports";

export type AircraftStatus = "taxiing" | "airborne" | "landing" | "parked";
export type CameraFlyTarget = "airport" | "aircraft" | "globe";
export type ViewMode = "globe" | "local";

export interface AircraftState {
  id: string;
  callsign: string;
  icao24: string;
  position: [number, number, number];
  rawLat: number;
  rawLon: number;
  velocity: number;
  heading: number;
  altitude: number;
  onGround: boolean;
  status: AircraftStatus;
  lastUpdated: number;
  aircraftType: string;
  categoryCode: number | null;
}

interface AircraftStore {
  aircraft: Record<string, AircraftState>;
  selectedId: string | null;
  activeAirportId: string;
  connectionStatus: "LIVE" | "SIMULATED" | "CONNECTING";
  cameraMode: "orbit" | "follow" | "tower";
  airportChangeToken: number;
  cameraFlyToken: number;
  cameraFlyTarget: CameraFlyTarget;
  cameraFlyTargetId: string | null;
  viewMode: ViewMode;

  setAircraft: (aircraft: Record<string, AircraftState>) => void;
  upsertAircraft: (ac: AircraftState) => void;
  selectAircraft: (id: string | null) => void;
  setActiveAirport: (id: string) => void;
  requestCameraFly: (target: CameraFlyTarget, id?: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setConnectionStatus: (s: "LIVE" | "SIMULATED" | "CONNECTING") => void;
  setCameraMode: (mode: "orbit" | "follow" | "tower") => void;
}

export const useAircraftStore = create<AircraftStore>((set) => ({
  aircraft: {},
  selectedId: null,
  activeAirportId: DEFAULT_AIRPORT_ID,
  connectionStatus: "CONNECTING",
  cameraMode: "orbit",
  airportChangeToken: 0,
  cameraFlyToken: 0,
  cameraFlyTarget: "airport",
  cameraFlyTargetId: DEFAULT_AIRPORT_ID,
  viewMode: "local",

  setAircraft: (aircraft) => set({ aircraft }),
  upsertAircraft: (ac) =>
    set((state) => ({
      aircraft: { ...state.aircraft, [ac.id]: ac },
    })),
  selectAircraft: (id) => set({ selectedId: id }),
  setActiveAirport: (id) =>
    set((state) => ({
      activeAirportId: id,
      selectedId: null,
      aircraft: {},
      airportChangeToken: state.airportChangeToken + 1,
    })),
  requestCameraFly: (target, id) =>
    set((state) => ({
      cameraFlyTarget: target,
      cameraFlyTargetId: id ?? state.activeAirportId,
      cameraFlyToken: state.cameraFlyToken + 1,
    })),
  setViewMode: (viewMode) => set({ viewMode }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
}));
