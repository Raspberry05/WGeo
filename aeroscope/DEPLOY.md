# Deploy Aeroscope on Vercel

## Vercel settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `aeroscope` |
| **Framework** | Next.js |

## Environment variables

| Variable | Scope | Description |
|----------|--------|-------------|
| `AEROAPI_API_KEY` | Server | FlightAware AeroAPI key ([My AeroAPI](https://www.flightaware.com/aeroapi/)) — header `x-apikey` |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Client | [Cesium Ion](https://ion.cesium.com/) token |
| `CORS_ALLOWED_ORIGINS` | Server (optional) | Comma-separated extra origins allowed to call `/api/*` |
| `NEXT_PUBLIC_APP_URL` | Client (optional) | Canonical site URL — also added to CORS allow list |
| `AEROAPI_TIMEOUT_MS` | Server (optional) | Upstream timeout ms (default `8000`) |

Use `.env.local` locally (see `.env.example`).

### Vercel checklist (if the map shows 0 aircraft)

1. **Root Directory** must be `aeroscope` (not the repo root).
2. Add `AEROAPI_API_KEY` with scope **Production** and **Preview** (server-only, not `NEXT_PUBLIC_`).
3. No quotes or trailing spaces in the key value.
4. **Redeploy** after changing env vars.
5. Open `https://<your-app>/api/health` — expect `aeroapi.authOk: true`.
   - `configured: false` → `AEROAPI_API_KEY` is missing on the server.
   - `authOk: false` → key invalid or AeroAPI account issue; verify in FlightAware → My AeroAPI.
6. Optional: `vercel.json` sets `"regions": ["fra1"]` for EU functions (not required for AeroAPI).

## Build

- **Install:** `npm install` (runs `postinstall` → copies Cesium to `public/cesium`)
- **Build:** `npm run build`
- **Dev:** `npm run dev` → http://localhost:3000

## CORS

Follows [Vercel: How to enable CORS](https://vercel.com/kb/guide/how-to-enable-cors):

- **`src/middleware.ts`** — dynamic `Access-Control-Allow-Origin` for allowed origins
- **`next.config.ts` `headers()`** — baseline headers on `/api/*`

The UI calls **`/api/flights` on the same Vercel host** (no cross-origin).

## API routes

- `GET /api/flights?lamin=&lomin=&lamax=&lomax=` — live aircraft in bbox (FlightAware `/flights/search`)
- `GET /api/flights/enrich/[flightId]` — full flight detail: schedules, gates, delays (`fa_flight_id`, 5 min cache)
- `GET /api/flights/[flightId]/track` — recent track positions for trail polyline (on select only, 5 min cache)
- `GET /api/health` — AeroAPI probe + optional `aeroapi.usage` snippet

Implementation: `src/lib/aeroapi/` + `src/app/api/flights/`.

## Traffic view modes

| Mode | HUD toggle | Flight query | Airports |
|------|------------|--------------|----------|
| **Airport** (default) | Status bar → Airport | Bbox around active airport | Full catalog; small airports when zoomed in (&lt; 2M m camera height) |
| **Aircraft / Viewport** | Status bar → Viewport | Camera view rectangle (max ~8° span) | Small airports only when zoomed in (&lt; 800 km height) |

- Viewport mode caps rendered aircraft at **400** (nearest to map center).
- Selecting a flight fetches enrich + track once (not on every poll).
- Poll interval ~6s with ~5.5s server cache (see `src/config/aircraftMotion.ts`).

## Rate limits (Basic tier)

- Poll interval ~6s with ~5.5s server cache (see `src/config/aircraftMotion.ts`).
- AeroAPI search uses `max_pages=1` per request.
- Enrich and track are cached **5 minutes** server-side; avoid rapid selection spam.
- On **429**, the API may return 503; the client shows an empty map until the next poll.
