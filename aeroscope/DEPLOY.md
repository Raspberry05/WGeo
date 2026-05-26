# Deploy Aeroscope on Vercel

## Vercel settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `aeroscope` |
| **Framework** | Next.js |

## Environment variables

| Variable | Scope | Description |
|----------|--------|-------------|
| `OPENSKY_CLIENT_ID` | Server | OpenSky OAuth client ID |
| `OPENSKY_CLIENT_SECRET` | Server | OpenSky OAuth client secret |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Client | [Cesium Ion](https://ion.cesium.com/) token |
| `CORS_ALLOWED_ORIGINS` | Server (optional) | Comma-separated extra origins allowed to call `/api/*` (e.g. `https://my-domain.com`) |
| `NEXT_PUBLIC_APP_URL` | Client (optional) | Canonical site URL — also added to CORS allow list |
| `OPENSKY_STATES_URL` | Server (optional) | EU forward proxy, e.g. `https://<railway>/states` — **required if direct OpenSky times out on Vercel** |
| `OPENSKY_TOKEN_URL` | Server (optional) | EU forward proxy, e.g. `https://<railway>/token` |

Use `.env.local` locally (see `.env.example`).

### Vercel checklist (if OpenSky shows 0 aircraft)

1. **Root Directory** must be `aeroscope` (not the repo root).
2. Add `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` with scope **Production** and **Preview** (not only Development).
3. Values must have **no quotes** and no trailing spaces (paste the raw client id/secret from OpenSky).
4. **Redeploy** after changing env vars (existing deployments do not pick up new variables).
5. Open `https://<your-app>/api/health` — expect `opensky.authOk: true`.
   - `configured: false` → env vars are not visible to the server.
   - `authError: "fetch failed"` → Vercel cannot reach the OpenSky auth host; add env `NODE_OPTIONS=--dns-result-order=ipv4first` (Production + Preview) and redeploy. The app will fall back to anonymous OpenSky when token fetch fails.
6. Optional Vercel env: `NODE_OPTIONS` = `--dns-result-order=ipv4first`.
7. **EU region (required):** OpenSky is in Europe; Vercel’s default is `iad1` (US). This repo sets **`vercel.json`** → `"regions": ["fra1"]` and `"functions": { "src/app/api/**/*.ts": { "regions": ["fra1"] } }`. **Redeploy** after merging. In `/api/health`, expect `vercelRegion: "fra1"` and `regionMismatch: false`. The Next.js `export const preferredRegion` on routes does **not** move Node.js functions — use `vercel.json` or **Vercel → Project → Settings → Functions → Function Region → Frankfurt**.
8. **If Vercel cannot reach OpenSky:** use **Cloudflare Worker + Tunnel** (see **`opensky-proxy/cloudflare/CLOUDFLARE.md`**). Vercel → `*.workers.dev` → tunnel → your PC `opensky-proxy` → OpenSky. Set `BACKEND_ORIGIN` on the Worker to your `trycloudflare.com` URL. Local `npm run dev` works because OpenSky is called from your home network, not from Vercel’s datacenter.

## Build

- **Install:** `npm install` (runs `postinstall` → copies Cesium to `public/cesium`)
- **Build:** `npm run build`
- **Dev:** `npm run dev` → http://localhost:3000

## CORS

Follows [Vercel: How to enable CORS](https://vercel.com/kb/guide/how-to-enable-cors):

- **`src/middleware.ts`** — dynamic `Access-Control-Allow-Origin` for allowed origins (same host, `VERCEL_URL`, `CORS_ALLOWED_ORIGINS`)
- **`next.config.ts` `headers()`** — baseline `Allow-Methods`, `Allow-Headers`, `Max-Age` on `/api/*`

The Aeroscope UI calls **`/api/opensky` on the same Vercel host** (no cross-origin). CORS helps preview URLs and a separate frontend calling your API.

If **Vercel Authentication / Deployment Protection** is on, keep **`/api` in the OPTIONS Allowlist** (default for new projects) so preflight succeeds.

CORS does **not** fix server-side `CONNECT_TIMEOUT` to OpenSky.

## OpenSky proxy, HTTP 499, and Vercel Hobby

When using **Railway** (or any external proxy) with `OPENSKY_STATES_URL` / `OPENSKY_TOKEN_URL`:

1. **`GET <proxy>/diagnose`** must return `"ok": true`. If you see `"ok": false` with `Upstream timeout after 45000ms`, the proxy host **cannot reach OpenSky** (common on **Railway**). Use an EU VPS or Cloudflare Tunnel from a network where OpenSky works — not longer timeouts.
2. **HTTP 499** in Railway logs means **Vercel closed the connection** before the proxy finished (not the browser abandoning a large JSON body).
3. **Vercel Hobby** caps API routes at **~10s** (`vercel.json` and route `maxDuration` are set to `10`). The proxy uses **stale-while-revalidate** so Vercel usually gets a response in under 2s; slow OpenSky fetches run in the background on Railway.
4. **504** from the proxy means OpenSky did not respond within `UPSTREAM_TIMEOUT_MS` on the proxy (default **45s** for background refresh).

| Layer | Hobby default | Notes |
|-------|----------------|-------|
| Vercel `maxDuration` | 10s | Hard cap on Hobby |
| `OPENSKY_STATES_TIMEOUT_MS` | 8000 | Env override on Pro |
| `OPENSKY_PROXY_DEADLINE_MS` | 9000 | Must be < `maxDuration` |
| Railway `UPSTREAM_TIMEOUT_MS` | 45000 | Background only with SWR |

See **`opensky-proxy/README.md`** for Railway env vars (`WARM_INTERVAL_MS`, `WARM_BOUNDS_QUERY`, etc.).

## API routes

- `GET /api/opensky?lamin=&lomin=&lamax=&lomax=`
- `GET /api/opensky/enrich/[icao24]`
- `GET /api/health`

Implementation: `src/lib/opensky/` + `src/app/api/`.
