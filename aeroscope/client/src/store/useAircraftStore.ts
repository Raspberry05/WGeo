import { create } from 'zustand';

export type AircraftStatus = 'taxiing' | 'airborne' | 'landing' | 'parked';

export interface AircraftState {
  id: string;
  callsign: string;
  icao24: string;
  position: [number, number, number]; // [x, y, z] in scene units
  rawLat: number;
  rawLon: number;
  velocity: number;
  heading: number;
  altitude: number;
  onGround: boolean;
  status: AircraftStatus;
  lastUpdated: number;
  aircraftType: string;
}

interface AircraftStore {
  aircraft: Record<string, AircraftState>;
  selectedId: string | null;
  connectionStatus: 'LIVE' | 'SIMULATED' | 'CONNECTING';
  cameraMode: 'orbit' | 'follow' | 'tower';

  setAircraft: (aircraft: Record<string, AircraftState>) => void;
  upsertAircraft: (ac: AircraftState) => void;
  selectAircraft: (id: string | null) => void;
  setConnectionStatus: (s: 'LIVE' | 'SIMULATED' | 'CONNECTING') => void;
  setCameraMode: (mode: 'orbit' | 'follow' | 'tower') => void;
}

export const useAircraftStore = create<AircraftStore>((set) => ({
  aircraft: {},
  selectedId: null,
  connectionStatus: 'CONNECTING',
  cameraMode: 'orbit',

  setAircraft: (aircraft) => set({ aircraft }),
  upsertAircraft: (ac) =>
    set((state) => ({
      aircraft: { ...state.aircraft, [ac.id]: ac },
    })),
  selectAircraft: (id) => set({ selectedId: id }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
}));