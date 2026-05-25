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
8. If EU Vercel still cannot reach OpenSky (`authHostReachable` and `apiHostReachable` both false), OpenSky may block datacenter IPs — host a tiny EU proxy (Railway/Fly) and set `OPENSKY_STATES_URL` / `OPENSKY_TOKEN_URL` to that proxy, or run the Next app on a host with working outbound access to `opensky-network.org`.

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

## API routes

- `GET /api/opensky?lamin=&lomin=&lamax=&lomax=`
- `GET /api/opensky/enrich/[icao24]`
- `GET /api/health`

Implementation: `src/lib/opensky/` + `src/app/api/`.
