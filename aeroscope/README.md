# Aeroscope

Live aircraft map over airports — Next.js, Cesium, OpenSky.

## Project structure (Next.js App Router)

```
aeroscope/
├── src/
│   ├── app/                 # Routes & API (App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── globals.css
│   │   ├── _components/     # Private — not routable
│   │   └── api/               # Serverless API routes
│   ├── components/          # React UI
│   ├── lib/opensky/         # Server-only OpenSky client
│   ├── hooks/
│   ├── services/            # Browser API helpers
│   ├── store/
│   ├── systems/
│   ├── utils/
│   ├── data/
│   └── config/
├── public/                  # Static assets
├── scripts/
├── docs/                    # Project documentation (not part of the app)
├── package.json
└── next.config.ts
```

See [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure).

## Quick start

```bash
cd aeroscope
cp .env.example .env.local   # add OpenSky + Cesium Ion credentials
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy (Vercel)

Set **Root Directory** to `aeroscope`. See [DEPLOY.md](./DEPLOY.md).

re-deploy
