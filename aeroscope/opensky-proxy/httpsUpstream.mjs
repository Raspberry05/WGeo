import https from "node:https";

const USER_AGENT = "Aeroscope-OpenSky-Proxy/1.0";

/**
 * HTTPS via IPv4 — avoids Railway/Vercel hanging on IPv6 to OpenSky.
 */
export function httpsRequest(
  url,
  { method = "GET", headers = {}, body, timeoutMs = 20_000 } = {},
) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqHeaders = {
      "User-Agent": USER_AGENT,
      ...headers,
    };
    const bodyBuf =
      body != null
        ? typeof body === "string"
          ? Buffer.from(body, "utf8")
          : body
        : null;
    if (bodyBuf?.length) {
      reqHeaders["Content-Length"] = String(bodyBuf.length);
    }

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        family: 4,
        headers: reqHeaders,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Upstream timeout after ${timeoutMs}ms (${method} ${parsed.hostname})`));
    });
    req.on("error", reject);
    if (bodyBuf?.length) req.write(bodyBuf);
    req.end();
  });
}
