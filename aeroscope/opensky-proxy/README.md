# OpenSky proxy (for Vercel)

Vercel (and some Railway regions) **cannot open TCP connections** to `opensky-network.org`. Your Next app on Vercel calls **your** proxy; the proxy calls OpenSky.

The proxy uses **stale-while-revalidate**: it answers Vercel in under ~1s (cache HIT/STALE or `503 warming`) and refreshes OpenSky in the background. That avoids **HTTP 499** on Railway when Vercel Hobby aborts slow requests (~10s).

## HTTP 499 vs 504 vs 408

| Code | Where | Meaning |
|------|--------|---------|
| **499** | Railway / NGINX logs | **Client closed** (Vercel stopped waiting). Not shown in the browser. |
| **504** | Proxy response | Proxy gave up on OpenSky (`UPSTREAM_TIMEOUT_MS`). |
| **408** | Standard HTTP | Server closed idle connection (different from 499). |

On **Vercel Hobby**, serverless functions cap at **~10s**. Timeouts in code above 10s are capped by Vercel; the proxy must respond quickly via cache/SWR, not block on OpenSky.

## If `/diagnose` shows timeout (Railway)

Example: `states.ok: false`, `error: "Upstream timeout... opensky-network.org"`.

**Railway and many cloud hosts cannot reach OpenSky.** If Worker `/diagnose` shows **522** or timeout, use **Cloudflare Tunnel from your PC** (below).

### Cloudflare (Worker + Tunnel) — use this for Vercel

Full guide: **`cloudflare/CLOUDFLARE.md`**

1. `npm start` in `opensky-proxy`
2. `cloudflared tunnel --url http://localhost:8080` → copy URL
3. `cd cloudflare` → `wrangler secret put BACKEND_ORIGIN` → paste tunnel URL
4. `wrangler deploy`
5. Vercel: `OPENSKY_STATES_URL` / `TOKEN_URL` = `https://<worker>.workers.dev/states` and `/token`

Worker `/health` should show `"mode":"backend-tunnel"`. Worker `/diagnose` should show `"ok":true`.

**522 without BACKEND_ORIGIN:** Worker cannot reach OpenSky directly — tunnel is required.

### Cloudflare Tunnel from your PC (recommended when diagnose fails)

OpenSky works from your home network (test in browser). Run the Node proxy locally and expose it:

```bash
# Terminal 1
cd aeroscope/opensky-proxy
npm start

# Terminal 2 — install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/download/
cloudflared tunnel --url http://localhost:8080
```

Use the printed `https://….trycloudflare.com` URL on Vercel:

- `OPENSKY_STATES_URL` = `https://….trycloudflare.com/states`
- `OPENSKY_TOKEN_URL` = `https://….trycloudflare.com/token`

Test `https://….trycloudflare.com/diagnose` → `ok: true`. Keep both terminals running while demoing.

---

## Railway

Railway **often cannot reach OpenSky** (your `/diagnose` shows `ok: false` and ~45s timeouts to `opensky-network.org` even with DNS resolving). That is outbound blocking from the cloud provider, not a bug in this proxy. **Do not use Railway for production** unless `/diagnose` returns `"ok": true`.

Build uses **`Dockerfile`** (not Nixpacks) to avoid `$NIXPACKS_PATH` / UndefinedVar warnings in Railway build logs.

### Only deploy on Railway if `/diagnose` succeeds

1. Root Directory: `aeroscope/opensky-proxy`
2. **Region:** EU (Frankfurt / Amsterdam) — US regions are no better for OpenSky
3. Env (recommended):

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_OPTIONS` | — | `--dns-result-order=ipv4first` |
| `UPSTREAM_TIMEOUT_MS` | `45000` | Background OpenSky fetch patience |
| `STATES_CACHE_TTL_MS` | `6000` | Fresh cache window (match app poll ~6s) |
| `STALE_MAX_AGE_MS` | `120000` | Max age to serve `X-Cache: STALE` |
| `WARM_INTERVAL_MS` | `0` (off) | Set `5000` to prefetch in background |
| `WARM_BOUNDS_QUERY` | — | e.g. `lamin=48&lomin=2&lamax=50&lomax=4` (no `?`) |

4. Redeploy; confirm `GET https://<service>/diagnose` → `"ok": true` before pointing Vercel at it.

### When Railway diagnose is `ok: false` (your case)

Use one of these instead:

| Option | Always-on? | Notes |
|--------|------------|--------|
| **EU VPS** (Oracle free, Hetzner ~€5) | Yes | `git clone` → `cd opensky-proxy` → `docker build` / `npm start` → set Vercel URLs |
| **Cloudflare Worker + Tunnel** | Tunnel needs a running backend | See `cloudflare/CLOUDFLARE.md` — backend can be home PC or VPS |
| **PC + trycloudflare** | No (PC must run) | Quick demo only |

### `/states` cache headers

| `X-Cache` | Meaning |
|-----------|---------|
| `HIT` | Fresh cache (< `STATES_CACHE_TTL_MS`) |
| `STALE` | Expired but served immediately; refresh in background |
| `WARMING` | Cold cache; `503` + `{ "warming": true }` — retry in ~6s |

- **`/health`** — instant (Railway healthcheck)
- **`/diagnose`** — probes OpenSky; must show `states.ok: true` before using this host

## Vercel env

| Variable | Example |
|----------|---------|
| `OPENSKY_STATES_URL` | `https://<proxy-host>/states` |
| `OPENSKY_TOKEN_URL` | `https://<proxy-host>/token` |

Optional (Hobby defaults in code; raise only on **Pro** with `maxDuration: 60`):

| Variable | Hobby default |
|----------|----------------|
| `OPENSKY_STATES_TIMEOUT_MS` | `8000` |
| `OPENSKY_PROXY_DEADLINE_MS` | `9000` |

Keep `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` on **Vercel** only.

Redeploy Vercel after changing env vars.

## Verify

1. `GET <proxy>/diagnose` → `ok: true`, `opensky.states.ms` < 5000
2. `GET <proxy>/states?lamin=0&lomin=0&lamax=1&lomax=1` → first call may be `503 warming`; second → `HIT` or `STALE`
3. `https://<vercel-app>/api/health` → `usingProxy: true`, `authOk: true`
4. Railway logs: fewer **499** lines during normal polling

## Local Node proxy

```bash
cd opensky-proxy
npm start
```
