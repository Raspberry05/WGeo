import { useEffect, useState } from "react";

export const ALTERNATING_DISPLAY_INTERVAL_MS = 7000;

/** Toggles every interval; starts with primary (metric) unit. */
export function useAlternatingDisplay(
  intervalMs = ALTERNATING_DISPLAY_INTERVAL_MS,
): boolean {
  const [showPrimary, setShowPrimary] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setShowPrimary((v) => !v);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return showPrimary;
}
