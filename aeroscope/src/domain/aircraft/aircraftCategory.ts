export type AircraftCategory =
  | "helicopter"
  | "light"
  | "medium"
  | "heavy"
  | "commercial"
  | "military"
  | "unknown";

export const AIRCRAFT_CATEGORY_OPTIONS: ReadonlyArray<{
  code: AircraftCategory;
  label: string;
}> = [
  { code: "commercial", label: "Commercial" },
  { code: "military", label: "Military" },
  { code: "heavy", label: "Heavy" },
  { code: "medium", label: "Mid" },
  { code: "light", label: "Light" },
  { code: "helicopter", label: "Helicopter" },
  { code: "unknown", label: "Unknown" },
] as const;

function normalizeToken(input: string | null | undefined): string {
  return (input ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function looksLikeHelicopterType(aircraftModel: string | null): boolean {
  const t = normalizeToken(aircraftModel);
  if (!t) return false;

  // Common ICAO rotorcraft type designators (conservative set).
  if (
    t.startsWith("H") || // many heli types begin with H (e.g., H60)
    t.startsWith("R44") ||
    t.startsWith("R66") ||
    t.startsWith("EC") ||
    t.startsWith("AS") ||
    t.startsWith("BK") ||
    t.startsWith("AW") ||
    t.startsWith("S76") ||
    t.startsWith("S92") ||
    t.startsWith("B06") || // Bell 206
    t.startsWith("B07") || // Bell 407
    t.startsWith("B12") || // Bell 212
    t.startsWith("B13") // Bell 214
  ) {
    return true;
  }

  return false;
}

function looksMilitary(operatorName: string | null, callsign: string): boolean {
  const op = (operatorName ?? "").toUpperCase();
  const cs = callsign.toUpperCase();

  // Operator tokens (keep conservative to avoid false positives).
  const operatorSignals = [
    " AIR FORCE",
    "AIRFORCE",
    "USAF",
    "NAVY",
    "ARMY",
    "MARINE",
    "ROYAL AIR FORCE",
    "ROYAL NAVY",
    "MINISTRY OF DEFENCE",
    "DEFENSE",
    "DEFENCE",
  ];

  if (operatorSignals.some((s) => op.includes(s))) return true;

  // Callsign prefixes.
  const callsignPrefixes = ["RCH", "MC", "NAVY", "AF", "QID", "BAF", "KAF"];
  if (callsignPrefixes.some((p) => cs.startsWith(p))) return true;

  return false;
}

function classifySizeFromType(aircraftModel: string | null): AircraftCategory | null {
  const t = normalizeToken(aircraftModel);
  if (!t) return null;

  // Heavy widebodies / large transports.
  if (
    /^A3(5|8)/.test(t) || // A350, A380
    /^A33/.test(t) || // A330
    /^B74/.test(t) || // B747
    /^B77/.test(t) || // B777
    /^B78/.test(t) || // B787
    /^C5(M)?/.test(t) || // C-5
    /^C17/.test(t) || // C-17
    /^A4(0|8)/.test(t) // A400M, A318? (A48 is not typical; but A400 is)
  ) {
    return "heavy";
  }

  // Common narrowbody airliners / regional jets.
  if (
    /^A(20|21|31|32)/.test(t) || // A20N, A21N, A319/320/321
    /^B7(3|37)/.test(t) || // B737 family (B737, B38M etc.)
    /^E(17|18|19|20|21)/.test(t) || // Embraer E-jets
    /^CRJ/.test(t) || // Bombardier CRJ
    /^DH8/.test(t) // Dash-8
  ) {
    return "medium";
  }

  // Light GA / trainers.
  if (
    /^C1\d{2}/.test(t) || // C152, C172, etc.
    /^PA\d{2}/.test(t) || // Piper PAxx
    /^SR2\d/.test(t) || // Cirrus SR20/22
    /^BE\d{2}/.test(t) // Beechcraft
  ) {
    return "light";
  }

  return null;
}

function classifySizeFromKinematics(
  altitudeMeters: number,
  velocityMs: number,
  onGround: boolean,
): AircraftCategory {
  const velocityKts = velocityMs * 1.94384;

  // These thresholds mirror the prior OpenSky-era inference,
  // but mapped into light/medium/heavy buckets.
  if (onGround && velocityKts < 30) return "light";
  if (altitudeMeters > 10600 && velocityKts > 400) return "heavy";
  if (altitudeMeters > 6100) return "medium";
  if (altitudeMeters < 900 && velocityKts < 200) return "light";
  return "unknown";
}

export type AircraftCategoryInput = {
  aircraftModel: string | null;
  operatorName: string | null;
  callsign: string;
  originAirport: string | null;
  destinationAirport: string | null;
  altitudeMeters: number;
  velocityMs: number;
  onGround: boolean;
};

export function classifyAircraft(input: AircraftCategoryInput): AircraftCategory {
  if (looksLikeHelicopterType(input.aircraftModel)) return "helicopter";
  if (looksMilitary(input.operatorName, input.callsign)) return "military";

  const sizeFromType = classifySizeFromType(input.aircraftModel);
  const size =
    sizeFromType ??
    classifySizeFromKinematics(input.altitudeMeters, input.velocityMs, input.onGround);

  const hasRoute = Boolean(input.originAirport) && Boolean(input.destinationAirport);
  const hasOperator = Boolean(input.operatorName && input.operatorName.trim());

  // Prefer commercial when we have a plausible scheduled flight signal.
  if (hasOperator && hasRoute && size !== "unknown") return "commercial";

  return size;
}

