export type OpenSkyFlightRecord = {
  firstSeen?: number;
  lastSeen?: number | null;
  estDepartureAirport?: string | null;
  estdepartureairport?: string | null;
  estArrivalAirport?: string | null;
  estarrivalairport?: string | null;
};

/** OpenSky airport ICAO: 4 letters uppercase, or null if invalid. */
export function normalizeAirportIcao(
  value: string | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  const code = String(value).trim().toUpperCase();
  return /^[A-Z]{4}$/.test(code) ? code : null;
}

/** Prefer ongoing flight (lastSeen null), else most recent by firstSeen. */
export function pickLatestFlight(
  flights: OpenSkyFlightRecord[],
): OpenSkyFlightRecord | null {
  if (!flights.length) return null;

  const ongoing = flights.filter((f) => f.lastSeen == null);
  const pool = ongoing.length > 0 ? ongoing : flights;

  return pool.reduce<OpenSkyFlightRecord | null>((best, flight) => {
    if (!best) return flight;
    const bestSeen = best.firstSeen ?? 0;
    const flightSeen = flight.firstSeen ?? 0;
    return flightSeen > bestSeen ? flight : best;
  }, null);
}
