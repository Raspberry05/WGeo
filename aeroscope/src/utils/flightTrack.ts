import type { TrackPoint } from "@/store/useAircraftStore";

const MIN_TRACK_POINTS = 2;

export function hasValidApiTrack(
  trackByFlightId: Record<string, TrackPoint[]>,
  flightId: string | null,
): boolean {
  if (!flightId) return false;
  const track = trackByFlightId[flightId];
  return Boolean(track && track.length >= MIN_TRACK_POINTS);
}
