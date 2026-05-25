# OpenSky proxy (for Vercel)

Vercel (and some Railway regions) **cannot open TCP connections** to `opensky-network.org`. Your Next app on Vercel calls **your** proxy; the proxy calls OpenSky.

## If `/diagnose` shows timeout (Railway)

Example: `states.ok: false`, `error: "Upstream timeout... opensky-network.org"`.

**Railway outbound to OpenSky is blocked or broken in your region.** The Node proxy cannot fix that. Use the **Cloudflare Worker** instead:

### Cloudflare Worker (recommended)

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/): `npm i -g wrangler`
2. `cd aeroscope/opensky-proxy/cloudflare`
3. `wrangler login`
4. `wrangler deploy`
5. Note the URL, e.g. `https://aeroscope-opensky.<account>.workers.dev`
6. On **Vercel** set:
   - `OPENSKY_STATES_URL` = `https://<worker-url>/states`
   - `OPENSKY_TOKEN_URL` = `https://<worker-url>/token`
7. Test: `GET <worker-url>/diagnose` → `opensky.states.ok: true`
8. Redeploy Vercel.

Worker uses Cloudflare’s network (usually can reach OpenSky even when Railway cannot).

---

## Railway (only if `/diagnose` succeeds)

1. Root Directory: `aeroscope/opensky-proxy`
2. **Region:** EU (Frankfurt / Amsterdam)
3. Env: `NODE_OPTIONS=--dns-result-order=ipv4first`
4. `npm start`

| Variable | Default |
|----------|---------|
| `UPSTREAM_TIMEOUT_MS` | `20000` |
| `STATES_CACHE_TTL_MS` | `6000` |

- **`/health`** — instant (Railway healthcheck)
- **`/diagnose`** — probes OpenSky; must show `states.ok: true` before using this host

## Vercel env

| Variable | Example |
|----------|---------|
| `OPENSKY_STATES_URL` | `https://<proxy-host>/states` |
| `OPENSKY_TOKEN_URL` | `https://<proxy-host>/token` |

Keep `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` on **Vercel** only.

Redeploy Vercel after changing env vars.

## Verify

1. `GET <proxy>/diagnose` → `ok: true`, `opensky.states.ms` &lt; 5000
2. `GET <proxy>/states?lamin=0&lomin=0&lamax=1&lomax=1` → JSON with `states`
3. `https://<vercel-app>/api/health` → `usingProxy: true`, `authOk: true`

## Local Node proxy

```bash
cd opensky-proxy
npm start
```
