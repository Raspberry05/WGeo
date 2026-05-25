import { useEffect, useState } from "react";
import { formatUtcTime } from "../../utils/flightUnits";
import { HUD_FONT_SM } from "./hudTheme";

export function UtcClock() {
  const [utc, setUtc] = useState(formatUtcTime());

  useEffect(() => {
    const id = window.setInterval(() => {
      setUtc(formatUtcTime());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      style={{
        color: "#6a8a9a",
        fontSize: HUD_FONT_SM,
        letterSpacing: "0.5px",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {utc}
    </span>
  );
}
