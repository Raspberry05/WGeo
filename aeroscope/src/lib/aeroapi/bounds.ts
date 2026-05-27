export type FlightBounds = {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
};

export function parseBoxes(
  query: Record<string, string | string[] | undefined>,
): FlightBounds[] | null {
  const raw = query.box;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (list.length === 0) return null;

  const bounds: FlightBounds[] = [];
  for (const item of list) {
    const parts = String(item)
      .split(",")
      .map((s) => s.trim());
    if (parts.length !== 4) return null;

    const lamin = parseFloat(parts[0]!);
    const lomin = parseFloat(parts[1]!);
    const lamax = parseFloat(parts[2]!);
    const lomax = parseFloat(parts[3]!);

    const one = parseBounds({ lamin: String(lamin), lomin: String(lomin), lamax: String(lamax), lomax: String(lomax) });
    if (!one) return null;
    bounds.push(one);
  }

  return bounds;
}

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
