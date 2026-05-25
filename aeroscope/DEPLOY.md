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

## Build

- **Install:** `npm install` (runs `postinstall` → copies Cesium to `public/cesium`)
- **Build:** `npm run build`
- **Dev:** `npm run dev` → http://localhost:3000

## API routes

- `GET /api/opensky?lamin=&lomin=&lamax=&lomax=`
- `GET /api/opensky/enrich/[icao24]`
- `GET /api/health`

Implementation: `src/lib/opensky/` + `src/app/api/`.
