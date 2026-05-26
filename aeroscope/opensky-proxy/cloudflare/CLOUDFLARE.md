# OpenSky + Cloudflare + Vercel (why local works, production doesn’t)

## Why `npm run dev` works but Vercel/Railway don’t

| Where code runs | Network | OpenSky |
|-----------------|---------|---------|
| **Your PC** (`npm run dev`) | Home ISP | Usually **allowed** |
| **Vercel** (`fra1`, etc.) | AWS/datacenter | Often **blocked or timeout** |
| **Railway** | Datacenter | Often **blocked or timeout** |
| **Worker → OpenSky direct** | Cloudflare egress | Often **522** (same class of problem) |

OpenSky’s API docs and client README note they may **limit or block hyperscaler / datacenter traffic**. Your token test from home returns **200** — credentials and credits are fine. The failure is **TCP from cloud to OpenSky**, not Aeroscope or mobile UI code.

Railway “worked for a minute” can be a cold path, cache, or intermittent routing — not something to rely on.

## Recommended architecture (all Cloudflare-branded URLs)

```text
Browser
  → Vercel (Next.js /api/opensky)
    → Cloudflare Worker  https://aeroscope-opensky.<you>.workers.dev
      → Cloudflare Tunnel  https://….trycloudflare.com (or named tunnel)
        → Your PC: opensky-proxy (npm start :8080)
          → OpenSky (works from your network)
```

Vercel only talks to the **Worker** (always works). The Worker talks to your **Tunnel** (public HTTPS). The tunnel reaches **localhost** where OpenSky is actually called.

---

## Setup (about 15 minutes)

### 1. Local proxy (same machine as `npm run dev`)

```bash
cd aeroscope/opensky-proxy
npm start
```

Leave running. Test: http://localhost:8080/health → `{"ok":true}`

### 2. Cloudflare Tunnel (free)

Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/download/).

New terminal:

```bash
cloudflared tunnel --url http://localhost:8080
```

Copy the `https://….trycloudflare.com` URL (changes each run unless you configure a **named tunnel**).

Test: `https://….trycloudflare.com/diagnose` → should show `ok: true` and OpenSky reachable.

### 3. Worker — point at your tunnel

```bash
cd aeroscope/opensky-proxy/cloudflare
wrangler login
wrangler secret put BACKEND_ORIGIN
# paste: https://YOUR-ID.trycloudflare.com  (no trailing slash)

wrangler deploy
```

Test Worker:

- `https://aeroscope-opensky.<you>.workers.dev/health`  
  → `"mode":"backend-tunnel"`, `"backendOrigin":"https://…"`
- `https://aeroscope-opensky.<you>.workers.dev/diagnose`  
  → `"ok": true`

### 4. Vercel env

Production + Preview:

| Variable | Value |
|----------|--------|
| `OPENSKY_STATES_URL` | `https://aeroscope-opensky.<you>.workers.dev/states` |
| `OPENSKY_TOKEN_URL` | `https://aeroscope-opensky.<you>.workers.dev/token` |

Keep `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` on Vercel (unchanged).

Redeploy Vercel. Check `/api/health` → `usingProxy: true`, `authOk: true`.

### 5. While demoing

Keep running:

1. `npm start` (opensky-proxy)
2. `cloudflared tunnel …`
3. Worker already deployed on Cloudflare

If the tunnel URL changes, update the secret: `wrangler secret put BACKEND_ORIGIN`

---

## Stable tunnel URL (optional)

Quick tunnels (`trycloudflare.com`) change when cloudflared restarts. For a fixed hostname, use a [named Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) on your account and route a subdomain to `http://localhost:8080`.

---

## Without tunnel (direct Worker only)

Only works if `/diagnose` on the Worker shows `ok: true` in **direct-opensky** mode (no `BACKEND_ORIGIN`). If you see **522**, you **must** use the tunnel setup above.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Worker `/diagnose` ok, Vercel 502 | Redeploy Vercel; check env URLs end with `/states` and `/token` |
| Worker 502, `backend-tunnel` | Restart `npm start` + cloudflared; update `BACKEND_ORIGIN` |
| Tunnel diagnose timeout | OpenSky from PC broken — fix local network first |
| Local dev works, production empty | Expected until Worker + tunnel + Vercel env are wired |
