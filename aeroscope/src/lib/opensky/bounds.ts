export type OpenSkyBounds = {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
};

export function parseBounds(
  query: Record<string, string | string[] | undefined>,
): OpenSkyBounds | null {
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

export function boundsKey(bounds: OpenSkyBounds): string {
  return `${bounds.lamin},${bounds.lomin},${bounds.lamax},${bounds.lomax}`;
}

export function boundsQuery(bounds: OpenSkyBounds): string {
  return `?lamin=${bounds.lamin}&lomin=${bounds.lomin}&lamax=${bounds.lamax}&lomax=${bounds.lomax}`;
}
