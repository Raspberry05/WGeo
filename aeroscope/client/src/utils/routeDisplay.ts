/** Normalize OpenSky airport ICAO to 4-letter uppercase or null. */
export function normalizeRouteAirport(
  code: string | null | undefined,
): string | null {
  if (!code) return null;
  const trimmed = String(code).trim().toUpperCase();
  return /^[A-Z]{4}$/.test(trimmed) ? trimmed : null;
}

export function formatRouteOrigin(
  originAirport: string | null | undefined,
): string {
  return normalizeRouteAirport(originAirport) ?? "—";
}

/** Destination label when OpenSky has not filed arrival yet. */
export function formatRouteDestination(
  destinationAirport: string | null | undefined,
  onGround: boolean,
): string {
  const icao = normalizeRouteAirport(destinationAirport);
  if (icao) return icao;
  if (!onGround) return "TBD";
  return "—";
}

export function formatRouteSummary(
  originAirport: string | null | undefined,
  destinationAirport: string | null | undefined,
  onGround: boolean,
): { origin: string; destination: string; hasAnyRoute: boolean } {
  const origin = formatRouteOrigin(originAirport);
  const destination = formatRouteDestination(destinationAirport, onGround);
  const hasAnyRoute =
    normalizeRouteAirport(originAirport) !== null ||
    normalizeRouteAirport(destinationAirport) !== null;
  return { origin, destination, hasAnyRoute };
}
