/**
 * Minimal OpenSky forward proxy — deploy to Railway/Fly/Render (EU region).
 * Point Vercel env OPENSKY_STATES_URL / OPENSKY_TOKEN_URL at this service.
 */
import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT) || 8080;
const STATES_UPSTREAM =
  "https://opensky-network.org/api/states/all";
const TOKEN_UPSTREAM =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS) || 12_000;
const STATES_CACHE_TTL_MS = Number(process.env.STATES_CACHE_TTL_MS) || 6_000;

const USER_AGENT = "Aeroscope-OpenSky-Proxy/1.0";

/** @type {Map<string, { body: string, status: number, at: number }>} */
const statesCache = new Map();

/** @type {Map<string, Promise<void>>} */
const statesInflight = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function upstreamFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        ...options.headers,
      },
    });
    const text = await response.text();
    return { status: response.status, text };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchStatesUpstream(search) {
  const url = `${STATES_UPSTREAM}${search}`;
  const result = await upstreamFetch(url, { method: "GET", cache: "no-store" });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `OpenSky states ${result.status}: ${result.text.slice(0, 200)}`,
    );
  }
  return result;
}

async function getStatesCached(search, res) {
  const key = search || "";
  const now = Date.now();
  const hit = statesCache.get(key);
  if (hit && now - hit.at < STATES_CACHE_TTL_MS) {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "X-Cache": "HIT",
    });
    res.end(hit.body);
    return;
  }

  let flight = statesInflight.get(key);
  if (!flight) {
    flight = (async () => {
      try {
        const result = await fetchStatesUpstream(search);
        statesCache.set(key, {
          body: result.text,
          status: result.status,
          at: Date.now(),
        });
      } finally {
        statesInflight.delete(key);
      }
    })();
    statesInflight.set(key, flight);
  }

  try {
    await flight;
  } catch (err) {
    if (!res.headersSent) {
      const stale = statesCache.get(key);
      if (stale) {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "X-Cache": "STALE",
        });
        res.end(stale.body);
        return;
      }
      res.writeHead(504, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
    return;
  }

  const fresh = statesCache.get(key);
  if (!fresh) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Cache miss after fetch" }));
    return;
  }

  res.writeHead(200, {
    "Content-Type": "application/json",
    "X-Cache": "MISS",
  });
  res.end(fresh.body);
}

async function forwardToken(body, res) {
  try {
    const result = await upstreamFetch(TOKEN_UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString("utf8"),
    });
    res.writeHead(result.status, { "Content-Type": "application/json" });
    res.end(result.text);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
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
        }),
      );
      return;
    }

    if (url.pathname === "/states" && req.method === "GET") {
      await getStatesCached(url.search, res);
      return;
    }

    if (url.pathname === "/token" && req.method === "POST") {
      const body = await readBody(req);
      await forwardToken(body, res);
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
  console.log(`[opensky-proxy] listening on ${PORT}`);
});
