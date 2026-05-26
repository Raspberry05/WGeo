import { OPENSKY_SERVER_CACHE_MS } from "@/config/aircraftMotion";
import { AeroApiError, aeroFetch } from "./client";
import {
  boundsKey,
  boundsToSearchQuery,
  parseBounds,
  type FlightBounds,
} from "./bounds";
import { mapFlightsToDtos } from "./mapToAircraftDto";
import type { AeroSearchResponse, AircraftDto } from "./types";

const CACHE_TTL_MS = OPENSKY_SERVER_CACHE_MS;

const cacheByBounds = new Map<string, { data: AircraftDto[]; lastFetch: number }>();

export type FlightsSearchResult = {
  aircraft: AircraftDto[];
  status: number;
  error?: string;
  hint?: string;
};

async function fetchSearch(bounds: FlightBounds): Promise<AircraftDto[]> {
  const query = boundsToSearchQuery(bounds);
  const body = await aeroFetch<AeroSearchResponse>("/flights/search", {
    searchParams: {
      query,
      max_pages: "1",
    },
  });

  return mapFlightsToDtos(body.flights ?? []);
}

export async function searchFlightsInBounds(
  query: Record<string, string | string[] | undefined>,
): Promise<FlightsSearchResult> {
  const bounds = parseBounds(query);
  if (!bounds) {
    return {
      aircraft: [],
      status: 400,
      error: "Invalid or missing bounds. Required: lamin, lomin, lamax, lomax",
    };
  }

  const key = boundsKey(bounds);
  const now = Date.now();
  const cached = cacheByBounds.get(key);

  if (cached && now - cached.lastFetch < CACHE_TTL_MS) {
    return { aircraft: cached.data, status: 200 };
  }

  try {
    const aircraft = await fetchSearch(bounds);
    cacheByBounds.set(key, { data: aircraft, lastFetch: now });
    return { aircraft, status: 200 };
  } catch (err) {
    const stale = cacheByBounds.get(key);
    if (stale) {
      console.warn("[Aeroscope] AeroAPI error — serving stale cache");
      return { aircraft: stale.data, status: 200 };
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error("[Aeroscope] AeroAPI search error:", message);

    if (err instanceof AeroApiError && err.status === 429) {
      return {
        aircraft: [],
        status: 503,
        error: message,
        hint: "AeroAPI rate limit exceeded. Reduce poll frequency or upgrade plan.",
      };
    }

    if (err instanceof AeroApiError && err.status === 503) {
      return {
        aircraft: [],
        status: 503,
        error: message,
        hint: "Set AEROAPI_API_KEY in Vercel → Environment Variables (server-only).",
      };
    }

    return {
      aircraft: [],
      status: 502,
      error: message,
      hint: "Check AEROAPI_API_KEY and FlightAware account status.",
    };
  }
}

export function getFlightsCacheSize(): number {
  return cacheByBounds.size;
}
