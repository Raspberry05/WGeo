# WGeo

**WGeo** is a monorepo for web-based geospatial tools—interactive maps, aviation data, and related viewers built with modern TypeScript stacks. The name reflects the focus: **geo** applications you can open in a browser, maintained in one place.

Today, **Aeroscope** is the primary product in this repository. Future WGeo projects will ship as sibling apps under their own folders, each with its own site, README, and deploy settings.

---

## Projects & sites

| Project | Status | Description | Local path |
|---------|--------|-------------|------------|
| **[Aeroscope](./aeroscope/)** | **Active** | Real-time 3D air-traffic viewer (Next.js + Cesium). Airport-centric traffic, worldwide airport catalog, flight inspector. | [`aeroscope/`](./aeroscope/) |
| *WGeo (additional tools)* | Planned | More geo utilities will be added here as separate apps (e.g. static map tools, data explorers, or themed viewers). Each gets its own directory and deployment. | — |

### Aeroscope

- **What it is:** Live flight tracking on a 3D globe—select an airport, see nearby traffic, inspect flights, filters, and tracks.
- **Stack:** Next.js, React, TypeScript, Cesium, FlightAware AeroAPI.
- **Docs:** [aeroscope/README.md](./aeroscope/README.md) (setup, env vars, airport data build).
- **Deploy:** Host as its own site; on Vercel set **Root Directory** to `aeroscope` (see [aeroscope/DEPLOY.md](./aeroscope/DEPLOY.md)).

**Typical URLs (examples):**

| Environment | Example |
|-------------|---------|
| Local dev | `http://localhost:3000` (from `aeroscope/`) |
| Production | Your Vercel or custom domain pointing at the Aeroscope project |

### Future WGeo sites

This repository is structured so new tools can be added without mixing codebases:

```
WGeo/                    ← you are here (org + overview)
├── README.md
├── aeroscope/           ← Aeroscope app → its own website
└── <future-tool>/       ← next geo app → its own website
```

When a new project is added, this table will list its folder, purpose, and production URL. Until then, **all active development lives in `aeroscope/`**.

---

## Repository layout

```
WGeo/
├── README.md           # This file — umbrella / roadmap
└── aeroscope/          # Aeroscope — 3D air-traffic viewer
    ├── src/
    ├── public/
    ├── scripts/
    ├── package.json
    └── README.md       # App-specific setup & architecture
```

There is **no shared package at the repo root** yet. Each app is self-contained (install, build, and env in its own folder).

---

## Quick start (Aeroscope)

```bash
cd aeroscope
npm install
cp .env.example .env.local
# Edit .env.local: AEROAPI_API_KEY, NEXT_PUBLIC_CESIUM_ION_TOKEN
npm run dev
```

Open **http://localhost:3000**.

For airport catalog rebuild, API details, and deployment troubleshooting, see **[aeroscope/README.md](./aeroscope/README.md)**.

---

## Deployment

| App | Root directory | Notes |
|-----|----------------|--------|
| Aeroscope | `aeroscope` | Next.js; see [DEPLOY.md](./aeroscope/DEPLOY.md) |

One GitHub repo (**WGeo**) can host **multiple Vercel projects** (or other hosts), each with a different root directory and domain—e.g. `aeroscope.yourdomain.com` for Aeroscope and later `other-tool.yourdomain.com` for another folder.

---

## Naming

| Name | Meaning |
|------|---------|
| **WGeo** | The repository and family of geo tools |
| **Aeroscope** | The air-traffic scope product (like a radar “scope” on the globe) |

If you clone only for Aeroscope, you still use the **WGeo** repo; work happens in the **`aeroscope/`** subdirectory.

---

## Contributing

- **Bug fixes and features for the live app:** work in `aeroscope/` and follow that app’s README.
- **New WGeo tools:** add a new top-level folder, own `package.json`, README, and entry in the **Projects & sites** table above.

---

## License

Add a root `LICENSE` when you choose a license for the monorepo; until then, refer to project-specific notices in each app folder if present.
