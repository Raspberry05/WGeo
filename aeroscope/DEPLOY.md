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
7. **EU regions:** API routes use `preferredRegion` = `fra1`, `cdg1`, `ams1`, `lhr1` (OpenSky is in Europe). If `/api/health` shows `UND_ERR_CONNECT_TIMEOUT` from a US region (`vercelRegion: iad1`), redeploy and confirm `authHostReachable: true`.
8. If EU Vercel still cannot reach OpenSky (`authHostReachable` and `apiHostReachable` both false), OpenSky may block datacenter IPs — host a tiny EU proxy (Railway/Fly) and set `OPENSKY_STATES_URL` / `OPENSKY_TOKEN_URL` to that proxy, or run the Next app on a host with working outbound access to `opensky-network.org`.

## Build

- **Install:** `npm install` (runs `postinstall` → copies Cesium to `public/cesium`)
- **Build:** `npm run build`
- **Dev:** `npm run dev` → http://localhost:3000

## API routes

- `GET /api/opensky?lamin=&lomin=&lamax=&lomax=`
- `GET /api/opensky/enrich/[icao24]`
- `GET /api/health`

Implementation: `src/lib/opensky/` + `src/app/api/`.
