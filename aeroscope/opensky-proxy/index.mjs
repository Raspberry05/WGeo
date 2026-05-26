/**
 * OpenSky forward proxy for Railway (EU). Vercel sets OPENSKY_STATES_URL / OPENSKY_TOKEN_URL.
 */
import dns from "node:dns/promises";
import http from "node:http";
import { URL } from "node:url";
import { httpsRequest } from "./httpsUpstream.mjs";

const PORT = Number(process.env.PORT) || 8080;
const STATES_UPSTREAM =
  "https://opensky-network.org/api/states/all";
const TOKEN_UPSTREAM =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS) || 45_000;
const STATES_CACHE_TTL_MS = Number(process.env.STATES_CACHE_TTL_MS) || 6_000;
const STALE_MAX_AGE_MS = Number(process.env.STALE_MAX_AGE_MS) || 120_000;
const WARM_INTERVAL_MS = Number(process.env.WARM_INTERVAL_MS) || 0;
const WARM_BOUNDS_QUERY = process.env.WARM_BOUNDS_QUERY || "";
const PROBE_CACHE_MS = 30_000;

/** @type {Map<string, { body: string; status: number; at: number }>} */
const statesCache = new Map();

/** @type {Map<string, Promise<void>>} */
const statesInflight = new Map();

let lastProbe = {
  at: 0,
  states: { ok: false, ms: 0, status: null, error: null },
  auth: { ok: false, ms: 0, status: null, error: null },
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function normalizeSearch(query) {
  if (!query) return "";
  return query.startsWith("?") ? query : `?${query}`;
}

function isFresh(hit, now) {
  return hit && now - hit.at < STATES_CACHE_TTL_MS;
}

function isStaleAcceptable(hit, now) {
  return hit && now - hit.at < STALE_MAX_AGE_MS;
}

async function resolveOpenSkyIpv4() {
  try {
    const results = await dns.lookup("opensky-network.org", {
      family: 4,
      all: true,
    });
    const list = Array.isArray(results) ? results : [results];
    return list.map((r) => r.address);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function probeUpstream() {
  const now = Date.now();
  if (now - lastProbe.at < PROBE_CACHE_MS) return lastProbe;

  const dnsIpv4 = await resolveOpenSkyIpv4();
  const statesUrl = `${STATES_UPSTREAM}?lamin=0&lomin=0&lamax=1&lomax=1`;
  const statesStart = Date.now();
  try {
    const r = await httpsRequest(statesUrl, {
      method: "GET",
      timeoutMs: UPSTREAM_TIMEOUT_MS,
    });
    lastProbe.states = {
      ok: r.status >= 200 && r.status < 300,
      ms: Date.now() - statesStart,
      status: r.status,
      error: null,
    };
  } catch (err) {
    lastProbe.states = {
      ok: false,
      ms: Date.now() - statesStart,
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const authStart = Date.now();
  try {
    const r = await httpsRequest(TOKEN_UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials&client_id=probe&client_secret=probe",
      timeoutMs: UPSTREAM_TIMEOUT_MS,
    });
    lastProbe.auth = {
      ok: r.status > 0,
      ms: Date.now() - authStart,
      status: r.status,
      error: null,
    };
  } catch (err) {
    lastProbe.auth = {
      ok: false,
      ms: Date.now() - authStart,
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  lastProbe.at = Date.now();
  lastProbe.dnsIpv4 = dnsIpv4;
  return lastProbe;
}

async function fetchStatesUpstream(search) {
  const url = `${STATES_UPSTREAM}${search}`;
  const result = await httpsRequest(url, {
    method: "GET",
    timeoutMs: UPSTREAM_TIMEOUT_MS,
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `OpenSky states ${result.status}: ${result.text.slice(0, 200)}`,
    );
  }
  return result;
}

/** Start background refresh; does not block callers (avoids Vercel 499). */
function startStatesRefresh(search) {
  const key = search || "";
  let flight = statesInflight.get(key);
  if (flight) return flight;

  flight = (async () => {
    try {
      const result = await fetchStatesUpstream(search);
      statesCache.set(key, {
        body: result.text,
        status: result.status,
        at: Date.now(),
      });
    } catch (err) {
      console.error(
        `[opensky-proxy] refresh failed key=${key || "(global)"}:`,
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      statesInflight.delete(key);
    }
  })();
  statesInflight.set(key, flight);
  return flight;
}

function sendStatesBody(res, hit, cacheHeader) {
  if (res.writableEnded || res.headersSent) return;
  res.writeHead(200, {
    "Content-Type": "application/json",
    "X-Cache": cacheHeader,
  });
  res.end(hit.body);
}

function sendWarming(res, inflightAlready) {
  if (res.writableEnded || res.headersSent) return;
  res.writeHead(503, {
    "Content-Type": "application/json",
    "X-Cache": "WARMING",
  });
  res.end(
    JSON.stringify({
      warming: true,
      error: inflightAlready
        ? "Cache refresh in progress"
        : "Cache cold; refresh started",
      hint: "Retry in a few seconds. Set WARM_BOUNDS_QUERY on Railway for faster first load.",
    }),
  );
}

/**
 * Stale-while-revalidate: respond in <1s when any cache exists; never block on OpenSky.
 */
function getStatesCached(search, res) {
  const key = search || "";
  const now = Date.now();
  const hit = statesCache.get(key);

  if (hit && isFresh(hit, now)) {
    sendStatesBody(res, hit, "HIT");
    return;
  }

  if (hit && isStaleAcceptable(hit, now)) {
    startStatesRefresh(search);
    sendStatesBody(res, hit, "STALE");
    return;
  }

  const inflightAlready = statesInflight.has(key);
  startStatesRefresh(search);
  sendWarming(res, inflightAlready);
}

function warmCacheKeys() {
  const keys = new Set();
  const warmSearch = normalizeSearch(WARM_BOUNDS_QUERY);
  if (warmSearch) keys.add(warmSearch);
  for (const k of statesCache.keys()) {
    keys.add(k.startsWith("?") ? k : normalizeSearch(k));
  }
  for (const search of keys) {
    startStatesRefresh(search);
  }
}

async function forwardToken(body, res) {
  try {
    const result = await httpsRequest(TOKEN_UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString("utf8"),
      timeoutMs: UPSTREAM_TIMEOUT_MS,
    });
    res.writeHead(result.status, { "Content-Type": "application/json" });
    res.end(result.text);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
          hint: "Token upstream failed. Use POST /token with form body from Vercel.",
        }),
      );
    }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          service: "opensky-proxy",
          cacheEntries: statesCache.size,
          inflight: statesInflight.size,
          lastProbeAt: lastProbe.at || null,
          statesCacheTtlMs: STATES_CACHE_TTL_MS,
          staleMaxAgeMs: STALE_MAX_AGE_MS,
          upstreamTimeoutMs: UPSTREAM_TIMEOUT_MS,
          warmIntervalMs: WARM_INTERVAL_MS || null,
        }),
      );
      return;
    }

    if (url.pathname === "/diagnose") {
      const probe = await probeUpstream();
      const unreachable =
        !probe.states.ok &&
        probe.states.error?.includes("timeout");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: probe.states.ok,
          service: "opensky-proxy",
          upstreamTimeoutMs: UPSTREAM_TIMEOUT_MS,
          staleWhileRevalidate: true,
          cacheEntries: statesCache.size,
          inflight: statesInflight.size,
          opensky: probe,
          nextSteps: unreachable
            ? [
                "This host cannot reach OpenSky (datacenter egress blocked or filtered). Stale-while-revalidate and longer timeouts will not fix diagnose ok:false.",
                "Run opensky-proxy on a network that can reach OpenSky (home PC + Cloudflare Tunnel, or EU VPS such as Oracle Always Free / Hetzner).",
                "Verify from that host: curl -sS -m 10 'https://opensky-network.org/api/states/all?lamin=0&lomin=0&lamax=1&lomax=1' | head -c 200",
                "Then set Vercel OPENSKY_STATES_URL and OPENSKY_TOKEN_URL to https://<working-host>/states and /token.",
                "Railway often fails this probe; see opensky-proxy/README.md and cloudflare/CLOUDFLARE.md.",
              ]
            : [],
        }),
      );
      return;
    }

    if (url.pathname === "/states" && req.method === "GET") {
      getStatesCached(url.search, res);
      return;
    }

    if (url.pathname === "/token" && req.method === "POST") {
      const body = await readBody(req);
      await forwardToken(body, res);
      return;
    }

    if (url.pathname === "/token") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Use POST /token (not GET)" }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Use GET /states or POST /token" }));
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }
});

server.listen(PORT, () => {
  console.log(
    `[opensky-proxy] listening on ${PORT}, upstream ${UPSTREAM_TIMEOUT_MS}ms, cache TTL ${STATES_CACHE_TTL_MS}ms, stale max ${STALE_MAX_AGE_MS}ms`,
  );
  if (WARM_INTERVAL_MS > 0) {
    warmCacheKeys();
    setInterval(warmCacheKeys, WARM_INTERVAL_MS);
    console.log(
      `[opensky-proxy] cache warmer every ${WARM_INTERVAL_MS}ms` +
        (WARM_BOUNDS_QUERY ? ` (bounds: ${WARM_BOUNDS_QUERY})` : ""),
    );
  }
});
