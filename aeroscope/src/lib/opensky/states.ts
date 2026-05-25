import { OPENSKY_SERVER_CACHE_MS } from "@/config/aircraftMotion";
import { boundsKey, boundsQuery, parseBounds } from "./bounds";
import { formatNetworkError } from "./networkError";
import { httpsRequest } from "./httpsGet";
import {
  getOpenSkyAuthHeaders,
  isOpenSkyConfigured,
  isOpenSkyTokenCached,
} from "./tokenManager";
import {
  OPENSKY_PROXY_DEADLINE_MS,
  OPENSKY_STATES_TIMEOUT_MS,
} from "./timeouts";

const AIRCRAFT_URL =
  process.env.OPENSKY_STATES_URL?.trim() ||
  "https://opensky-network.org/api/states/all";
const CACHE_TTL_MS = OPENSKY_SERVER_CACHE_MS;

type CacheEntry = { data: unknown; lastFetch: number };

const cacheByBounds = new Map<string, CacheEntry>();

export type OpenSkyStatesResult = {
  data: unknown;
  status: number;
  error?: string;
};

function isUpstreamUnreachable(err: unknown): boolean {
  const msg = formatNetworkError(err).toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("und_err_connect") ||
    msg.includes("fetch failed")
  );
}

function withProxyDeadline<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `OpenSky proxy deadline (${OPENSKY_PROXY_DEADLINE_MS}ms)`,
            ),
          ),
        OPENSKY_PROXY_DEADLINE_MS,
      );
    }),
  ]);
}

async function fetchStatesJson(
  boundsQueryString: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const url = AIRCRAFT_URL + boundsQueryString;
  const result = await httpsRequest(url, {
    method: "GET",
    headers,
    timeoutMs: OPENSKY_STATES_TIMEOUT_MS,
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `OpenSky states ${result.status}: ${result.text.slice(0, 200)}`,
    );
  }
  return JSON.parse(result.text) as unknown;
}

async function fetchOpenSkyStatesInner(
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

  let headers: Record<string, string> = {};
  if (isOpenSkyTokenCached()) {
    headers = await getOpenSkyAuthHeaders();
  }

  let data: unknown;

  if (headers.Authorization) {
    data = await fetchStatesJson(boundsQs, headers);
  } else {
    try {
      data = await fetchStatesJson(boundsQs, {});
    } catch (anonErr) {
      if (!configured) {
        throw anonErr;
      }
      if (isUpstreamUnreachable(anonErr)) {
        console.warn(
          "[Aeroscope] OpenSky API unreachable (anonymous) — skipping token:",
          formatNetworkError(anonErr),
        );
        throw anonErr;
      }
      console.warn(
        "[Aeroscope] Anonymous OpenSky failed — trying authenticated:",
        formatNetworkError(anonErr),
      );
      try {
        headers = await getOpenSkyAuthHeaders();
      } catch (tokenErr) {
        console.warn(
          "[Aeroscope] Token fetch failed:",
          formatNetworkError(tokenErr),
        );
        throw anonErr;
      }
      data = await fetchStatesJson(boundsQs, headers);
    }
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
}

function errorResult(
  err: unknown,
  key: string,
  configured: boolean,
): OpenSkyStatesResult {
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

export async function fetchOpenSkyStates(
  query: Record<string, string | string[] | undefined>,
): Promise<OpenSkyStatesResult> {
  const bounds = parseBounds(query);
  const configured = isOpenSkyConfigured();
  const key = bounds ? boundsKey(bounds) : "";

  try {
    return await withProxyDeadline(fetchOpenSkyStatesInner(query));
  } catch (err) {
    return errorResult(err, key, configured);
  }
}

export function getStatesCacheSize(): number {
  return cacheByBounds.size;
}
