import { OPENSKY_SERVER_CACHE_MS } from "@/config/aircraftMotion";
import { boundsKey, boundsQuery, parseBounds } from "./bounds";
import { getOpenSkyTokenManager } from "./tokenManager";

const AIRCRAFT_URL = "https://opensky-network.org/api/states/all";
const CACHE_TTL_MS = OPENSKY_SERVER_CACHE_MS;

type CacheEntry = { data: unknown; lastFetch: number };

const cacheByBounds = new Map<string, CacheEntry>();

export async function fetchOpenSkyStates(
  query: Record<string, string | string[] | undefined>,
): Promise<{ data: unknown; status: number; error?: string }> {
  const bounds = parseBounds(query);
  if (!bounds) {
    return {
      data: {
        error: "Invalid or missing bounds. Required: lamin, lomin, lamax, lomax",
      },
      status: 400,
    };
  }

  const key = boundsKey(bounds);
  const now = Date.now();
  const cached = cacheByBounds.get(key);

  if (cached && now - cached.lastFetch < CACHE_TTL_MS) {
    return { data: cached.data, status: 200 };
  }

  try {
    const tokenManager = getOpenSkyTokenManager();
    const headers = await tokenManager.headers();
    const response = await fetch(AIRCRAFT_URL + boundsQuery(bounds), {
      headers,
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      throw new Error(`OpenSky states ${response.status}`);
    }

    const data = await response.json();
    cacheByBounds.set(key, { data, lastFetch: now });
    return { data, status: 200 };
  } catch (err) {
    const stale = cacheByBounds.get(key);
    if (stale) {
      return { data: stale.data, status: 200 };
    }

    console.error("[Aeroscope] OpenSky states error:", err);
    return { data: { states: [] }, status: 200 };
  }
}

export function getStatesCacheSize(): number {
  return cacheByBounds.size;
}
