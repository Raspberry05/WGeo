/**
 * Cloudflare Worker — public URL for Vercel (always reachable from Vercel).
 *
 * OpenSky blocks many cloud IPs (Vercel, Railway, Worker direct fetch → 522).
 * Set BACKEND_ORIGIN to a Cloudflare Tunnel URL that reaches your PC:
 *
 *   wrangler secret put BACKEND_ORIGIN
 *   → https://xxxx.trycloudflare.com  (from: cloudflared tunnel --url http://localhost:8080)
 *
 * Flow: Vercel → this Worker → Tunnel → local opensky-proxy → OpenSky
 */

const STATES_UPSTREAM = "https://opensky-network.org/api/states/all";
const TOKEN_UPSTREAM =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const CACHE_TTL_SEC = 6;
const UPSTREAM_HEADERS = { "User-Agent": "Aeroscope-Worker/1.0" };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const backend = normalizeBackend(env.BACKEND_ORIGIN);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "opensky-worker",
        mode: backend ? "backend-tunnel" : "direct-opensky",
        backendOrigin: backend,
      });
    }

    if (url.pathname === "/diagnose") {
      if (backend) {
        return diagnoseBackend(backend);
      }
      return diagnoseDirect();
    }

    if (backend) {
      return proxyToBackend(request, url, backend);
    }

    if (url.pathname === "/states" && request.method === "GET") {
      return fetchStatesDirect(url.search, ctx);
    }

    if (url.pathname === "/token" && request.method === "POST") {
      return proxyTokenDirect(request);
    }

    if (url.pathname === "/token") {
      return json({ error: "Use POST /token" }, 405);
    }

    return json(
      {
        error: "Use GET /states or POST /token",
        hint: "Set BACKEND_ORIGIN (Cloudflare Tunnel) — see cloudflare/CLOUDFLARE.md",
      },
      404,
    );
  },
};

function normalizeBackend(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\/$/, "");
  return trimmed || null;
}

async function proxyToBackend(request, url, backend) {
  const target = `${backend}${url.pathname}${url.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init = {
    method: request.method,
    headers,
    redirect: "follow",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  try {
    const res = await fetch(target, init);
    const outHeaders = new Headers(res.headers);
    outHeaders.set("X-Proxy-Mode", "backend-tunnel");
    return new Response(res.body, {
      status: res.status,
      headers: outHeaders,
    });
  } catch (e) {
    return json(
      {
        error: e instanceof Error ? e.message : String(e),
        hint: "Is cloudflared running? Is local opensky-proxy on port 8080?",
        backendOrigin: backend,
      },
      502,
    );
  }
}

async function diagnoseBackend(backend) {
  const start = Date.now();
  try {
    const r = await fetch(`${backend}/diagnose`, {
      headers: UPSTREAM_HEADERS,
    });
    const data = await r.json();
    return json({
      ok: Boolean(data.ok),
      service: "opensky-worker",
      mode: "backend-tunnel",
      backendOrigin: backend,
      ms: Date.now() - start,
      backend: data,
      nextSteps: data.ok
        ? []
        : [
            "Start: cd aeroscope/opensky-proxy && npm start",
            "Tunnel: cloudflared tunnel --url http://localhost:8080",
            "Secret: wrangler secret put BACKEND_ORIGIN → tunnel URL",
          ],
    });
  } catch (e) {
    return json({
      ok: false,
      service: "opensky-worker",
      mode: "backend-tunnel",
      backendOrigin: backend,
      error: e instanceof Error ? e.message : String(e),
      nextSteps: [
        "Tunnel URL unreachable from Worker. Run cloudflared and npm start on your PC.",
      ],
    });
  }
}

async function diagnoseDirect() {
  const statesStart = Date.now();
  let states = { ok: false, ms: 0, status: null, error: null };
  try {
    const r = await fetch(
      `${STATES_UPSTREAM}?lamin=0&lomin=0&lamax=1&lomax=1`,
      { headers: UPSTREAM_HEADERS, cf: { cacheTtl: 0 } },
    );
    const bodyPreview = r.status >= 400 ? (await r.text()).slice(0, 120) : "";
    states = {
      ok: r.ok,
      ms: Date.now() - statesStart,
      status: r.status,
      error: r.ok ? null : bodyPreview || `HTTP ${r.status}`,
    };
  } catch (e) {
    states = {
      ok: false,
      ms: Date.now() - statesStart,
      status: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  return json({
    ok: states.ok,
    service: "opensky-worker",
    mode: "direct-opensky",
    opensky: { states },
    nextSteps: states.ok
      ? []
      : [
          "Direct OpenSky from Worker failed (522/timeout). Use BACKEND_ORIGIN + Cloudflare Tunnel.",
          "See aeroscope/opensky-proxy/cloudflare/CLOUDFLARE.md",
        ],
  });
}

async function fetchStatesDirect(search, ctx) {
  const upstream = `${STATES_UPSTREAM}${search}`;
  const cache = caches.default;
  const cacheKey = new Request(upstream, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    const res = new Response(cached.body, cached);
    res.headers.set("X-Cache", "HIT");
    return res;
  }
  const upstreamRes = await fetch(upstream, {
    headers: UPSTREAM_HEADERS,
    cf: { cacheTtl: 0 },
  });
  const body = await upstreamRes.text();
  if (!upstreamRes.ok) {
    return json(
      { error: `OpenSky ${upstreamRes.status}`, body: body.slice(0, 200) },
      upstreamRes.status,
    );
  }
  const out = new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
  });
  ctx.waitUntil(
    cache.put(
      cacheKey,
      new Response(body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `max-age=${CACHE_TTL_SEC}`,
        },
      }),
    ),
  );
  return out;
}

async function proxyTokenDirect(request) {
  const body = await request.text();
  const upstreamRes = await fetch(TOKEN_UPSTREAM, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...UPSTREAM_HEADERS,
    },
    body,
    cf: { cacheTtl: 0 },
  });
  const text = await upstreamRes.text();
  return new Response(text, {
    status: upstreamRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
