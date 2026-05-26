/** Format AeroAPI ISO timestamp for HUD (UTC). */
export function formatScheduleTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Date(ms).toISOString().replace("T", " ").slice(0, 16) + "Z";
}

export function formatDelayMinutes(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes === 0) {
    return "—";
  }
  const sign = minutes > 0 ? "+" : "";
  return `${sign}${Math.round(minutes)} min`;
}

export function formatFlightStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return status.replace(/_/g, " ").toUpperCase();
}
