# OpenSky proxy (for Vercel)

Vercel serverless in `fra1` can still fail to reach `opensky-network.org` (TCP timeout). This tiny proxy runs on a host with working outbound access (Railway/Fly/Render in **EU**).

## Deploy on Railway

1. Create a new Railway project → **Deploy from GitHub** (or empty service).
2. Set **Root Directory** to `aeroscope/opensky-proxy` (or deploy only this folder).
3. **Region:** EU West (Amsterdam) or EU Central (Frankfurt).
4. Start command: `npm start` (Nixpacks detects Node).
5. Copy the public URL, e.g. `https://your-proxy.up.railway.app`.

## Vercel env (Production + Preview)

| Variable | Example |
|----------|---------|
| `OPENSKY_STATES_URL` | `https://your-proxy.up.railway.app/states` |
| `OPENSKY_TOKEN_URL` | `https://your-proxy.up.railway.app/token` |

Keep `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` on **Vercel** (the Next app still sends OAuth to your proxy, which forwards to OpenSky).

Redeploy Vercel after setting env vars.

## Verify

- Proxy: `GET https://your-proxy/health` → `{"ok":true}`
- Proxy: `GET https://your-proxy/states?lamin=0&lomin=0&lamax=1&lomax=1` → JSON with `states` (repeat should be fast, `X-Cache: HIT`)
- Vercel: `/api/health` → `authOk: true`, `opensky.usingProxy: true`

## Railway 499 on `/states`

**499** means the client (Vercel) closed the connection before Railway finished — usually OpenSky is slow and Vercel timed out first. This proxy caches states for **6s** and dedupes concurrent identical bbox requests. Redeploy Railway after pulling updates.

Optional env on Railway:

| Variable | Default |
|----------|---------|
| `UPSTREAM_TIMEOUT_MS` | `12000` |
| `STATES_CACHE_TTL_MS` | `6000` |

## Local

```bash
cd opensky-proxy
npm start
# OPENSKY_STATES_URL=http://localhost:8080/states npm run dev  (in aeroscope root)
```
