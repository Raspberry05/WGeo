/** Resolve airport ICAO from a Cesium pick id (primitive or entity). */
export function airportIdFromPickId(id: unknown): string | null {
  if (typeof id === "string") {
    if (id.startsWith("airport-active-")) return null;
    if (id.length === 4) return id.toUpperCase();
    return null;
  }
  return null;
}
