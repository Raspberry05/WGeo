/**
 * HTTPS helper for OpenSky server routes.
 * Uses native fetch (not node:https) so Next.js does not bundle CJS require()
 * into ESM output when package.json has "type": "module".
 *
 * Prefer NODE_OPTIONS=--dns-result-order=ipv4first on Vercel if IPv6 to OpenSky fails.
 */
export async function httpsRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  } = {},
): Promise<{ status: number; text: string }> {
  const { method = "GET", headers = {}, body, timeoutMs = 10_000 } = options;

  const response = await fetch(url, {
    method,
    headers: {
      "User-Agent": "Aeroscope/1.0 (https://github.com)",
      ...headers,
    },
    body,
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });

  return {
    status: response.status,
    text: await response.text(),
  };
}
