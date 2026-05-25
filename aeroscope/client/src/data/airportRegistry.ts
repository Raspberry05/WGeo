import { AIRPORTS } from "./airports";

export interface AirportRegistryEntry {
  name: string;
  countryCode: string;
  lat?: number;
  lon?: number;
}

const US_AIRPORTS: Record<string, AirportRegistryEntry> = {
  KATL: { name: "Atlanta", countryCode: "US" },
  KORD: { name: "Chicago O'Hare", countryCode: "US" },
  KDFW: { name: "Dallas/Fort Worth", countryCode: "US" },
  KLAX: { name: "Los Angeles", countryCode: "US" },
  KJFK: { name: "New York JFK", countryCode: "US" },
  KMIA: { name: "Miami", countryCode: "US" },
  KSEA: { name: "Seattle", countryCode: "US" },
  KDEN: { name: "Denver", countryCode: "US" },
  KCLT: { name: "Charlotte", countryCode: "US" },
  KLAS: { name: "Las Vegas", countryCode: "US" },
  KSFO: { name: "San Francisco", countryCode: "US" },
  KBOS: { name: "Boston", countryCode: "US" },
  KPHX: { name: "Phoenix", countryCode: "US" },
  KIAH: { name: "Houston", countryCode: "US" },
  KMCO: { name: "Orlando", countryCode: "US" },
  KEWR: { name: "Newark", countryCode: "US" },
  KDTW: { name: "Detroit", countryCode: "US" },
  KPHL: { name: "Philadelphia", countryCode: "US" },
  KLGA: { name: "LaGuardia", countryCode: "US" },
  KDCA: { name: "Washington Reagan", countryCode: "US" },
  KIAD: { name: "Washington Dulles", countryCode: "US" },
  KBWI: { name: "Baltimore", countryCode: "US" },
  KSLC: { name: "Salt Lake City", countryCode: "US" },
  KPDX: { name: "Portland", countryCode: "US" },
  KSTL: { name: "St. Louis", countryCode: "US" },
  KBNA: { name: "Nashville", countryCode: "US" },
  KAUS: { name: "Austin", countryCode: "US" },
  KSAN: { name: "San Diego", countryCode: "US" },
  KTPA: { name: "Tampa", countryCode: "US" },
};

const INTL_AIRPORTS: Record<string, AirportRegistryEntry> = {
  EGLL: { name: "London Heathrow", countryCode: "GB" },
  LFPG: { name: "Paris CDG", countryCode: "FR" },
  EDDF: { name: "Frankfurt", countryCode: "DE" },
  EHAM: { name: "Amsterdam", countryCode: "NL" },
  LEMD: { name: "Madrid", countryCode: "ES" },
  LIRF: { name: "Rome Fiumicino", countryCode: "IT" },
  OMDB: { name: "Dubai", countryCode: "AE" },
  RJTT: { name: "Tokyo Haneda", countryCode: "JP" },
  RKSI: { name: "Seoul Incheon", countryCode: "KR" },
  WSSS: { name: "Singapore", countryCode: "SG" },
  VHHH: { name: "Hong Kong", countryCode: "HK" },
  YSSY: { name: "Sydney", countryCode: "AU" },
  CYYZ: { name: "Toronto", countryCode: "CA" },
  CYVR: { name: "Vancouver", countryCode: "CA" },
  MMMX: { name: "Mexico City", countryCode: "MX" },
  SBGR: { name: "São Paulo", countryCode: "BR" },
  FACT: { name: "Cape Town", countryCode: "ZA" },
  LTFM: { name: "Istanbul", countryCode: "TR" },
  UUEE: { name: "Moscow Sheremetyevo", countryCode: "RU" },
  ZBAA: { name: "Beijing", countryCode: "CN" },
  ZSPD: { name: "Shanghai Pudong", countryCode: "CN" },
  VABB: { name: "Mumbai", countryCode: "IN" },
  VIDP: { name: "Delhi", countryCode: "IN" },
  LSZH: { name: "Zurich", countryCode: "CH" },
  LOWW: { name: "Vienna", countryCode: "AT" },
  EBBR: { name: "Brussels", countryCode: "BE" },
  EKCH: { name: "Copenhagen", countryCode: "DK" },
  ENGM: { name: "Oslo", countryCode: "NO" },
  ESSA: { name: "Stockholm", countryCode: "SE" },
  EFHK: { name: "Helsinki", countryCode: "FI" },
  LPPT: { name: "Lisbon", countryCode: "PT" },
  EIDW: { name: "Dublin", countryCode: "IE" },
  LGAV: { name: "Athens", countryCode: "GR" },
  OTHH: { name: "Doha", countryCode: "QA" },
  OERK: { name: "Riyadh", countryCode: "SA" },
};

const REGISTRY: Record<string, AirportRegistryEntry> = {
  ...US_AIRPORTS,
  ...INTL_AIRPORTS,
};

for (const ap of AIRPORTS) {
  const existing = REGISTRY[ap.id];
  if (existing) {
    existing.lat = ap.lat;
    existing.lon = ap.lon;
  } else {
    REGISTRY[ap.id] = {
      name: ap.name,
      countryCode: "US",
      lat: ap.lat,
      lon: ap.lon,
    };
  }
}

export function lookupAirport(
  icao: string | null | undefined,
): AirportRegistryEntry | null {
  if (!icao) return null;
  const key = icao.trim().toUpperCase();
  return REGISTRY[key] ?? null;
}

export function airportCountryCode(icao: string | null | undefined): string | null {
  return lookupAirport(icao)?.countryCode ?? null;
}
