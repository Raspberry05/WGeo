import { OPENSKY_SERVER_CACHE_MS } from "@/config/aircraftMotion";
import { boundsKey, boundsQuery, parseBounds } from "./bounds";
import { formatNetworkError } from "./networkError";
import { httpsRequest } from "./httpsGet";
import {
  getOpenSkyAuthHeaders,
  isOpenSkyConfigured,
} from "./tokenManager";

const AIRCRAFT_URL =
  process.env.OPENSKY_STATES_URL?.trim() ||
  "https://opensky-network.org/api/states/all";
const STATES_TIMEOUT_MS = 25_000;
const CACHE_TTL_MS = OPENSKY_SERVER_CACHE_MS;

type CacheEntry = { data: unknown; lastFetch: number };

const cacheByBounds = new Map<string, CacheEntry>();

export type OpenSkyStatesResult = {
  data: unknown;
  status: number;
  error?: string;
};

async function fetchStatesJson(
  boundsQueryString: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const url = AIRCRAFT_URL + boundsQueryString;

  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(STATES_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenSky states ${response.status}: ${body.slice(0, 200)}`);
    }
    return response.json();
  } catch (fetchErr) {
    console.warn(
      "[Aeroscope] OpenSky states fetch failed, retrying via https IPv4:",
      formatNetworkError(fetchErr),
    );
    const result = await httpsRequest(url, {
      method: "GET",
      headers,
      timeoutMs: STATES_TIMEOUT_MS,
    });
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`OpenSky states ${result.status}: ${result.text.slice(0, 200)}`);
    }
    return JSON.parse(result.text) as unknown;
  }
}

export async function fetchOpenSkyStates(
  query: Record<string, string | string[] | undefined>,
): Promise<OpenSkyStatesResult> {
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

  const boundsQs = boundsQuery(bounds);
  const configured = isOpenSkyConfigured();

  try {
    let headers: Record<string, string> = {};
    if (configured) {
      try {
        headers = await getOpenSkyAuthHeaders();
      } catch (tokenErr) {
        console.warn(
          "[Aeroscope] Token fetch failed — using anonymous OpenSky:",
          formatNetworkError(tokenErr),
        );
      }
    } else {
      console.warn(
        "[Aeroscope] OpenSky credentials missing — using anonymous API (strict rate limits)",
      );
    }

    let data: unknown;
    try {
      data = await fetchStatesJson(boundsQs, headers);
    } catch (firstErr) {
      if (!configured || !headers.Authorization) {
        throw firstErr;
      }
      console.warn("[Aeroscope] OpenSky failed with token — retrying anonymous");
      data = await fetchStatesJson(boundsQs, {});
    }
    const states = (data as { states?: unknown[] | null }).states;
    const count = Array.isArray(states) ? states.length : 0;

    if (count === 0) {
      console.warn(
        `[Aeroscope] OpenSky returned 0 states in bbox (auth=${configured ? "yes" : "no"})`,
      );
    }

    cacheByBounds.set(key, { data, lastFetch: now });
    return { data, status: 200 };
  } catch (err) {
    const stale = cacheByBounds.get(key);
    if (stale) {
      console.warn("[Aeroscope] OpenSky error — serving stale cache");
      return { data: stale.data, status: 200 };
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error("[Aeroscope] OpenSky states error:", message);

    return {
      data: {
        states: [],
        error: message,
        configured,
        hint: configured
          ? "OpenSky may be unreachable from this Vercel region. Redeploy after setting API routes to EU (fra1/cdg1). If still failing, host the API proxy in EU (Railway/Fly) or contact OpenSky about cloud IP access."
          : "Set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET in Vercel → Project → Settings → Environment Variables.",
      },
      status: 502,
    };
  }
}

export function getStatesCacheSize(): number {
  return cacheByBounds.size;
}
