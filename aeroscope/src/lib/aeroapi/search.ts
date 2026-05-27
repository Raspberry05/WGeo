import { OPENSKY_SERVER_CACHE_MS } from "@/config/aircraftMotion";
import { AEROAPI_SEARCH_MAX_PAGES_CAP } from "@/config/trafficView";
import { AeroApiError, aeroFetch } from "./client";
import {
  boundsKey,
  boundsToSearchQuery,
  parseBoxes,
  parseBounds,
  type FlightBounds,
} from "./bounds";
import { mapFlightsToDtos } from "./mapToAircraftDto";
import type { AeroSearchResponse, AircraftDto } from "./types";

const CACHE_TTL_MS = OPENSKY_SERVER_CACHE_MS;

const cacheByBounds = new Map<string, { data: AircraftDto[]; lastFetch: number }>();

/** More pages for larger bboxes so zoomed-out views get more than the first result page. */
export function maxSearchPagesForBounds(bounds: FlightBounds): number {
  const latSpan = bounds.lamax - bounds.lamin;
  const lonSpan = bounds.lomax - bounds.lomin;
  const area = latSpan * lonSpan;
  if (area > 2000) return Math.min(5, AEROAPI_SEARCH_MAX_PAGES_CAP);
  if (area > 200) return Math.min(4, AEROAPI_SEARCH_MAX_PAGES_CAP);
  if (area > 50) return Math.min(3, AEROAPI_SEARCH_MAX_PAGES_CAP);
  if (area > 10) return 2;
  return 1;
}

export type FlightsSearchResult = {
  aircraft: AircraftDto[];
  status: number;
  error?: string;
  hint?: string;
};

async function fetchSearch(bounds: FlightBounds): Promise<AircraftDto[]> {
  const query = boundsToSearchQuery(bounds);
  const maxPages = maxSearchPagesForBounds(bounds);
  const body = await aeroFetch<AeroSearchResponse>("/flights/search", {
    searchParams: {
      query,
      max_pages: String(maxPages),
    },
  });

  return mapFlightsToDtos(body.flights ?? []);
}

export async function searchFlightsInBounds(
  query: Record<string, string | string[] | undefined>,
): Promise<FlightsSearchResult> {
  const boxes = parseBoxes(query);
  const boundsList = boxes ?? (parseBounds(query) ? [parseBounds(query)!] : null);
  if (!boundsList) {
    return {
      aircraft: [],
      status: 400,
      error:
        "Invalid or missing bounds. Required: lamin, lomin, lamax, lomax (or repeated box=lamin,lomin,lamax,lomax)",
    };
  }

  const now = Date.now();
  const chunks = await Promise.all(
    boundsList.map(async (bounds) => {
      const key = boundsKey(bounds);
      const cached = cacheByBounds.get(key);

      if (cached && now - cached.lastFetch < CACHE_TTL_MS) {
        return { ok: true as const, aircraft: cached.data };
      }

      try {
        const aircraft = await fetchSearch(bounds);
        cacheByBounds.set(key, { data: aircraft, lastFetch: now });
        return { ok: true as const, aircraft };
      } catch (err) {
        const stale = cacheByBounds.get(key);
        if (stale) {
          console.warn("[Aeroscope] AeroAPI error — serving stale cache");
          return { ok: true as const, aircraft: stale.data };
        }

        return { ok: false as const, err };
      }
    }),
  );

  const firstErr = chunks.find((c) => !c.ok);
  if (firstErr && !firstErr.ok) {
    const err = firstErr.err;
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

  const merged: AircraftDto[] = [];
  const seen = new Set<string>();
  for (const c of chunks) {
    if (!c.ok) continue;
    for (const ac of c.aircraft) {
      if (seen.has(ac.id)) continue;
      seen.add(ac.id);
      merged.push(ac);
    }
  }

  return { aircraft: merged, status: 200 };
}

export function getFlightsCacheSize(): number {
  return cacheByBounds.size;
}
