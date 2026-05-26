export type FlightBounds = {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
};

export function parseBounds(
  query: Record<string, string | string[] | undefined>,
): FlightBounds | null {
  const lamin = parseFloat(String(query.lamin ?? ""));
  const lomin = parseFloat(String(query.lomin ?? ""));
  const lamax = parseFloat(String(query.lamax ?? ""));
  const lomax = parseFloat(String(query.lomax ?? ""));

  if (
    [lamin, lomin, lamax, lomax].some((v) => Number.isNaN(v)) ||
    lamin < -90 ||
    lamin > 90 ||
    lamax < -90 ||
    lamax > 90 ||
    lomin < -180 ||
    lomin > 180 ||
    lomax < -180 ||
    lomax > 180 ||
    lamin >= lamax ||
    lomin >= lomax
  ) {
    return null;
  }

  return { lamin, lomin, lamax, lomax };
}

export function boundsKey(bounds: FlightBounds): string {
  return `${bounds.lamin},${bounds.lomin},${bounds.lamax},${bounds.lomax}`;
}

/** AeroAPI /flights/search latlong query (MINLAT MINLON MAXLAT MAXLON). */
export function boundsToSearchQuery(bounds: FlightBounds): string {
  return `-latlong "${bounds.lamin} ${bounds.lomin} ${bounds.lamax} ${bounds.lomax}"`;
}
