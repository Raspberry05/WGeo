import https from "node:https";

export function httpsRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  } = {},
): Promise<{ status: number; text: string }> {
  const { method = "GET", headers = {}, body, timeoutMs = 25_000 } = options;

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqHeaders = { ...headers };
    if (body) {
      reqHeaders["Content-Length"] = String(Buffer.byteLength(body));
    }

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        family: 4,
        headers: reqHeaders,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
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
      reject(
        new Error(
          `HTTPS ${method} ${parsed.hostname} timed out after ${timeoutMs}ms`,
        ),
      );
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}
