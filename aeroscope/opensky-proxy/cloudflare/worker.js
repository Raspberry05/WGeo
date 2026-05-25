/**
 * Cloudflare Worker fallback when Railway/Vercel cannot reach OpenSky.
 * Deploy: npx wrangler deploy (from this folder)
 * Vercel env:
 *   OPENSKY_STATES_URL = https://<worker>.workers.dev/states
 *   OPENSKY_TOKEN_URL  = https://<worker>.workers.dev/token
 */

const STATES_UPSTREAM = "https://opensky-network.org/api/states/all";
const TOKEN_UPSTREAM =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const CACHE_TTL_SEC = 6;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "opensky-worker" });
    }

    if (url.pathname === "/diagnose") {
      const statesStart = Date.now();
      let states = { ok: false, ms: 0, status: null, error: null };
      try {
        const r = await fetch(
          `${STATES_UPSTREAM}?lamin=0&lomin=0&lamax=1&lomax=1`,
          { headers: { "User-Agent": "Aeroscope-Worker/1.0" } },
        );
        states = {
          ok: r.ok,
          ms: Date.now() - statesStart,
          status: r.status,
          error: null,
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
        opensky: { states },
      });
    }

    if (url.pathname === "/states" && request.method === "GET") {
      const upstream = `${STATES_UPSTREAM}${url.search}`;
      const cache = caches.default;
      const cacheKey = new Request(upstream, { method: "GET" });
      const cached = await cache.match(cacheKey);
      if (cached) {
        const res = new Response(cached.body, cached);
        res.headers.set("X-Cache", "HIT");
        return res;
      }
      const upstreamRes = await fetch(upstream, {
        headers: { "User-Agent": "Aeroscope-Worker/1.0" },
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
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "MISS",
        },
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

    if (url.pathname === "/token" && request.method === "POST") {
      const body = await request.text();
      const upstreamRes = await fetch(TOKEN_UPSTREAM, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Aeroscope-Worker/1.0",
        },
        body,
      });
      const text = await upstreamRes.text();
      return new Response(text, {
        status: upstreamRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/token") {
      return json({ error: "Use POST /token" }, 405);
    }

    return json({ error: "Use GET /states or POST /token" }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
