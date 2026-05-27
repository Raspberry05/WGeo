# Aeroscope

Aeroscope is a real-time 3D air-traffic viewer built with Next.js and Cesium. It focuses on airport-centric situational awareness: select an airport, visualize nearby traffic, and inspect individual flights with live state, schedule, and track history.

## Technologies

- **Next.js (App Router)**: UI + server routes (`src/app/api/*`)
- **React + TypeScript**: typed UI and domain logic
- **Cesium + Resium**: 3D globe, camera control, entity rendering
- **FlightAware AeroAPI**: live flight search + flight detail + flight track
- **Zustand**: client state (traffic, selection, HUD, camera modes)

## Core functionality

- **Airport selection**: search and jump to an airport; traffic refreshes around the active airport
- **World airport catalog** (OurAirports): large, medium, small, seaplane, and heliport data with HUD type filters (default: international/large only)
- **Live traffic map**: aircraft entities update continuously; off-screen culling in viewport mode
- **Flight inspector HUD**:
  - callsign/registration, type/model/operator (when available)
  - route summary (origin → destination)
  - schedule table (OUT/OFF/ON/IN) + gates/terminals/baggage (when available)
  - delays and status chips (when available)
- **Track & trail**: fetches historical track points for a selected flight and renders a trail
- **Classification + filtering**:
  - **CLASS** and **WAKE** filters from an offline **OpenAircraftType** index (Doc 8643-style)
  - placeholder glTF silhouettes vary by class/wake; helicopters include a simple rotor animation

## Setup

### Prerequisites

- **Node.js 18+** (recommended 20+)
- **npm**

### Install

```bash
cd aeroscope
npm install
```

### Airport data (worldwide)

Airports ship as static JSON under `public/data/` (from [OurAirports](https://ourairports.com/data/)). To refresh or include heliports/seaplane bases:

```bash
node scripts/build-airport-catalog.mjs
```

This writes `airports-index.json` (full catalog + search) and `airports-global.json` (all airport types for the map). Enable types in the **AIRPORTS** HUD panel; marker size and shape still follow type and filter (triangles, H, seaplane square).

### Environment variables

Create `.env.local` from the example and set the required keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with:
- **FlightAware AeroAPI** credentials (key/host)
- **Cesium Ion** access token (for imagery/terrain, depending on config)

### Run (development)

```bash
npm run dev
```

Open `http://localhost:3000`.

### Build & run (production)

```bash
npm run build
npm run start
```

## Data & accuracy notes

- **Availability varies**: some flights may not provide operator/model/schedule/gate fields.
- **Classification is best-effort**: CLASS/WAKE come from the ICAO type designator when a valid `aircraft_type` (ICAO code) is present; otherwise values may be `null`.
- **Rate limits**: FlightAware API usage is subject to account limits; polling cadence and bounding-box caps are tuned to avoid excessive requests.

### Viewport traffic vs “load the whole globe”

**Viewport mode** (camera traffic) is intentional: each request asks AeroAPI for a **lat/lon bounding box** aligned to a coarse grid chunk (~4° cells), with padding ahead of the camera. As you pan into a new chunk, a new request runs; within the same chunk, the ~6s timer refreshes positions. The map **only draws aircraft inside the current camera rectangle**; airport mode still uses a fixed airport bbox.

A **single global fetch** is not used because it would be slower and more expensive in practice: tens of thousands of flights, huge JSON payloads, rate-limit risk, and stale positions everywhere. Filtering on the client after a global download would still require downloading all of that data first. Chunked viewport queries match how AeroAPI search works and keep responses small.

## Project structure (high level)

```
aeroscope/
├── src/
│   ├── app/                 # Routes & API (App Router)
│   │   └── api/             # Server routes (AeroAPI proxy + enrich + track)
│   ├── components/          # React UI (HUD + Cesium layers)
│   ├── domain/              # Domain logic (classification, indexes)
│   ├── lib/aeroapi/         # AeroAPI mapping + types
│   ├── services/            # Browser helpers (fetch, enrichment)
│   ├── store/               # Zustand state
│   ├── systems/             # Simulation/interpolation systems
│   ├── utils/               # Formatting, bounds, geo helpers
│   └── config/              # Rendering + traffic configuration
├── public/models/           # Placeholder glTF assets
├── scripts/                 # Local scripts (Cesium copy, placeholder gen, indexing)
└── docs/                    # Additional docs (deploy/troubleshooting)
```

## Deployment

- **Vercel**: set **Root Directory** to `aeroscope`
- See `DEPLOY.md` for platform notes and troubleshooting.
