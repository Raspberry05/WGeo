/**
 * Minimal OpenSky forward proxy — deploy to Railway/Fly/Render (EU region).
 * Point Vercel env OPENSKY_STATES_URL / OPENSKY_TOKEN_URL at this service.
 */
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const PORT = Number(process.env.PORT) || 8080;
const STATES_UPSTREAM =
  "https://opensky-network.org/api/states/all";
const TOKEN_UPSTREAM =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const UPSTREAM_TIMEOUT_MS = 25_000;

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
]);

function filterHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    if (value === undefined) continue;
    out[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function forward(upstreamUrl, req, res, body) {
  const target = new URL(upstreamUrl);
  const headers = filterHeaders(req.headers);
  delete headers.host;

  const proxyReq = https.request(
    {
      hostname: target.hostname,
      port: 443,
      path: `${target.pathname}${target.search}`,
      method: req.method,
      headers,
      family: 4,
      timeout: UPSTREAM_TIMEOUT_MS,
    },
    (proxyRes) => {
      const responseHeaders = { ...proxyRes.headers };
      delete responseHeaders["transfer-encoding"];
      res.writeHead(proxyRes.statusCode ?? 502, responseHeaders);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("timeout", () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Upstream timeout" }));
    }
  });
  proxyReq.on("error", (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  if (body.length > 0) proxyReq.write(body);
  proxyReq.end();
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "opensky-proxy" }));
      return;
    }

    const body = await readBody(req);

    if (url.pathname === "/states" && req.method === "GET") {
      forward(`${STATES_UPSTREAM}${url.search}`, req, res, body);
      return;
    }

    if (url.pathname === "/token" && req.method === "POST") {
      forward(TOKEN_UPSTREAM, req, res, body);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Use GET /states or POST /token" }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
});

server.listen(PORT, () => {
  console.log(`[opensky-proxy] listening on ${PORT}`);
});
