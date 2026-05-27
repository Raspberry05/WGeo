import { create } from "zustand";
import {
  DEFAULT_AIRPORT_TYPE_FILTER,
  type AirportType,
} from "@/config/airportFilters";
import { DEFAULT_AIRPORT_ID } from "../data/airports";
import type { FlightDetailDto } from "../lib/aeroapi/types";
import type { AircraftClass, WakeTurbulenceCategory } from "@/domain/aircraft/openAircraftType";

export type AircraftStatus = "taxiing" | "airborne" | "landing" | "parked";
export type CameraFlyTarget = "airport" | "aircraft";
export type CameraMode = "free" | "follow";
export type TrafficViewMode = "airport" | "aircraft";

export type TrackPoint = {
  lat: number;
  lon: number;
  altMeters: number;
  timestamp: string | null;
};

export interface AircraftState {
  /** FlightAware `fa_flight_id` — primary key for API calls. */
  id: string;
  faFlightId: string;
  registration: string | null;
  callsign: string;
  /** Display id (registration or ident); legacy field name from OpenSky era. */
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
  aircraftClass: AircraftClass | null;
  wakeCategory: WakeTurbulenceCategory | null;
  originCountry: string;
  operatorName: string | null;
  aircraftModel: string | null;
  originAirport: string | null;
  destinationAirport: string | null;
  flightDetail: FlightDetailDto | null;
}

interface AircraftStore {
  aircraft: Record<string, AircraftState>;
  selectedId: string | null;
  activeAirportId: string;
  activeAirportPickEnabled: boolean;
  connectionStatus: "LIVE" | "SIMULATED" | "CONNECTING";
  cameraMode: CameraMode;
  airportChangeToken: number;
  viewModeToken: number;
  trafficViewMode: TrafficViewMode;
  viewportBoundsClamped: boolean;
  sceneRefLat: number | null;
  sceneRefLon: number | null;
  cameraFlyToken: number;
  cameraFlyTarget: CameraFlyTarget;
  cameraFlyTargetId: string | null;
  classFilter: AircraftClass[] | null;
  wakeFilter: WakeTurbulenceCategory[] | null;
  /** `null` = show all airport types. Default: large (international) only. */
  airportTypeFilter: AirportType[] | null;
  airportFilterToken: number;
  airportCatalogReady: boolean;
  hoveredAirportId: string | null;
  hoverScreen: { x: number; y: number } | null;
  trackByFlightId: Record<string, TrackPoint[]>;
  trackLoadingId: string | null;
  showTrail: boolean;

  setAircraft: (aircraft: Record<string, AircraftState>) => void;
  setAirportCatalogReady: (ready: boolean) => void;
  upsertAircraft: (ac: AircraftState) => void;
  enrichAircraft: (id: string, patch: Partial<AircraftState>) => void;
  selectAircraft: (id: string | null) => void;
  setActiveAirport: (id: string) => void;
  setTrafficViewMode: (mode: TrafficViewMode) => void;
  setViewportMeta: (meta: {
    clamped: boolean;
    sceneRefLat: number;
    sceneRefLon: number;
  }) => void;
  setTrackForFlight: (flightId: string, positions: TrackPoint[]) => void;
  clearTrack: (flightId?: string) => void;
  setTrackLoading: (flightId: string | null) => void;
  setShowTrail: (show: boolean) => void;
  requestCameraFly: (target: CameraFlyTarget, id?: string) => void;
  setConnectionStatus: (s: "LIVE" | "SIMULATED" | "CONNECTING") => void;
  setCameraMode: (mode: CameraMode) => void;
  setClassFilter: (codes: AircraftClass[] | null) => void;
  setWakeFilter: (codes: WakeTurbulenceCategory[] | null) => void;
  setAirportTypeFilter: (filter: AirportType[] | null) => void;
  bumpAirportFilterToken: () => void;
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
  viewModeToken: 0,
  trafficViewMode: "airport",
  viewportBoundsClamped: false,
  sceneRefLat: null,
  sceneRefLon: null,
  cameraFlyToken: 0,
  cameraFlyTarget: "airport",
  cameraFlyTargetId: DEFAULT_AIRPORT_ID,
  classFilter: null,
  wakeFilter: null,
  airportTypeFilter: [...DEFAULT_AIRPORT_TYPE_FILTER],
  airportFilterToken: 0,
  airportCatalogReady: false,
  hoveredAirportId: null,
  hoverScreen: null,
  trackByFlightId: {},
  trackLoadingId: null,
  showTrail: true,

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
    set((state) => ({
      selectedId: id,
      cameraMode: !id
        ? "free"
        : state.selectedId === id
          ? state.cameraMode
          : "follow",
      trackLoadingId: id && id !== state.selectedId ? id : state.trackLoadingId,
    })),
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
  setTrafficViewMode: (mode) =>
    set((state) => {
      if (mode === state.trafficViewMode) return state;
      return {
        trafficViewMode: mode,
        aircraft: {},
        selectedId: null,
        cameraMode: "free",
        viewModeToken: state.viewModeToken + 1,
        viewportBoundsClamped: false,
      };
    }),
  setViewportMeta: ({ clamped, sceneRefLat, sceneRefLon }) =>
    set({ viewportBoundsClamped: clamped, sceneRefLat, sceneRefLon }),
  setTrackForFlight: (flightId, positions) =>
    set((state) => ({
      trackByFlightId: { ...state.trackByFlightId, [flightId]: positions },
      trackLoadingId:
        state.trackLoadingId === flightId ? null : state.trackLoadingId,
    })),
  clearTrack: (flightId) =>
    set((state) => {
      if (!flightId) {
        return { trackByFlightId: {}, trackLoadingId: null };
      }
      const next = { ...state.trackByFlightId };
      delete next[flightId];
      return { trackByFlightId: next };
    }),
  setTrackLoading: (trackLoadingId) => set({ trackLoadingId }),
  setShowTrail: (showTrail) => set({ showTrail }),
  requestCameraFly: (target, id) =>
    set((state) => ({
      cameraFlyTarget: target,
      cameraFlyTargetId: id ?? state.activeAirportId,
      cameraFlyToken: state.cameraFlyToken + 1,
    })),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setClassFilter: (classFilter) => set({ classFilter }),
  setWakeFilter: (wakeFilter) => set({ wakeFilter }),
  setAirportTypeFilter: (airportTypeFilter) => set({ airportTypeFilter }),
  bumpAirportFilterToken: () =>
    set((s) => ({ airportFilterToken: s.airportFilterToken + 1 })),
  setAirportHover: (hoveredAirportId, hoverScreen) =>
    set({ hoveredAirportId, hoverScreen }),
}));

export function passesClassFilter(
  aircraftClass: AircraftClass | null,
  filter: AircraftClass[] | null,
): boolean {
  if (!filter || filter.length === 0) return true;
  if (aircraftClass === null) return false;
  return filter.includes(aircraftClass);
}

export function passesWakeFilter(
  wakeCategory: WakeTurbulenceCategory | null,
  filter: WakeTurbulenceCategory[] | null,
): boolean {
  if (!filter || filter.length === 0) return true;
  if (wakeCategory === null) return false;
  return filter.includes(wakeCategory);
}
