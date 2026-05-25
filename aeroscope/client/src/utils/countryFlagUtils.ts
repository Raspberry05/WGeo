import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import type { CSSProperties, ReactElement } from "react";
import * as FlagIcons from "country-flag-icons/react/3x2";

countries.registerLocale(en);

export function countryNameToIso2(
  countryName: string | null | undefined,
): string | null {
  if (!countryName?.trim()) return null;
  const code = countries.getAlpha2Code(countryName.trim(), "en");
  return code ?? null;
}

export type FlagComponent = (props: {
  title?: string;
  className?: string;
  style?: CSSProperties;
}) => ReactElement;

export function flagComponent(iso2: string): FlagComponent | null {
  const key = iso2.toUpperCase() as keyof typeof FlagIcons;
  const C = FlagIcons[key];
  return (C as FlagComponent | undefined) ?? null;
}
