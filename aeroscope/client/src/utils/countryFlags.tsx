import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import type { CSSProperties, ReactElement } from "react";
import * as FlagIcons from "country-flag-icons/react/3x2";
import { airportCountryCode } from "../data/airportRegistry";

countries.registerLocale(en);

export function countryNameToIso2(countryName: string | null | undefined): string | null {
  if (!countryName?.trim()) return null;
  const code = countries.getAlpha2Code(countryName.trim(), "en");
  return code ?? null;
}

type FlagComponent = (props: {
  title?: string;
  className?: string;
  style?: CSSProperties;
}) => ReactElement;

function flagComponent(iso2: string): FlagComponent | null {
  const key = iso2.toUpperCase() as keyof typeof FlagIcons;
  const C = FlagIcons[key];
  return (C as FlagComponent | undefined) ?? null;
}

interface FlagIconProps {
  iso2: string | null | undefined;
  size?: number;
  title?: string;
}

export function FlagIcon({ iso2, size = 18, title }: FlagIconProps) {
  if (!iso2) {
    return (
      <span
        style={{
          display: "inline-block",
          width: size * 1.33,
          height: size,
          background: "#2a3040",
          borderRadius: 2,
        }}
        title={title ?? "Unknown"}
      />
    );
  }

  const code = iso2.toUpperCase();
  const Flag = flagComponent(code);
  if (!Flag) {
    return (
      <span
        style={{
          fontSize: size * 0.65,
          color: "#6a7080",
          lineHeight: 1,
        }}
        title={title ?? code}
      >
        {code}
      </span>
    );
  }

  return (
    <Flag
      title={title ?? code}
      style={{
        width: size * 1.33,
        height: size,
        borderRadius: 2,
        display: "inline-block",
        verticalAlign: "middle",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
      }}
    />
  );
}

export function CountryFlagByName({
  countryName,
  size = 18,
}: {
  countryName: string | null | undefined;
  size?: number;
}) {
  const iso2 = countryNameToIso2(countryName);
  return <FlagIcon iso2={iso2} size={size} title={countryName ?? undefined} />;
}

export function AirportFlag({ icao }: { icao: string | null | undefined }) {
  const iso2 = airportCountryCode(icao);
  return <FlagIcon iso2={iso2} size={16} title={icao ?? undefined} />;
}
