/** Resolve airport ICAO from a Cesium pick id (primitive or entity). */
export function airportIdFromPickId(id: unknown): string | null {
  if (typeof id === "string") {
    if (id.startsWith("airport-active-label-")) {
      const icao = id.slice("airport-active-label-".length);
      return icao.length === 4 ? icao.toUpperCase() : null;
    }
    if (id.startsWith("airport-active-ellipse-")) {
      const icao = id.slice("airport-active-ellipse-".length);
      return icao.length === 4 ? icao.toUpperCase() : null;
    }
    if (id.startsWith("airport-active-")) return null;
    if (id.length === 4) return id.toUpperCase();
    return null;
  }
  return null;
}

/** First airport ICAO in drill-pick results (billboard or active overlay). */
export function airportIdFromPicks(
  picks: { id?: unknown }[],
): string | null {
  for (const pick of picks) {
    const icao = airportIdFromPickId(pick.id);
    if (icao) return icao;
  }
  return null;
}
