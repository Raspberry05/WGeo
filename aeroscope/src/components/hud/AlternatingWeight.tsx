import {
  formatWeightKg,
  formatWeightLb,
} from "../../utils/flightUnits";
import { useAlternatingDisplay } from "../../hooks/useAlternatingDisplay";

interface Props {
  massKg: number;
  style?: React.CSSProperties;
}

/** Alternates lb ↔ kg every ~7s. */
export function AlternatingWeight({ massKg, style }: Props) {
  const showKg = useAlternatingDisplay();

  return (
    <span
      style={{
        display: "inline-block",
        minWidth: "5em",
        textAlign: "right",
        transition: "opacity 0.4s ease",
        ...style,
      }}
      key={showKg ? "kg" : "lb"}
    >
      {showKg ? formatWeightKg(massKg) : formatWeightLb(massKg)}
    </span>
  );
}
