import https from "node:https";
import { formatNetworkError } from "./networkError";

const TOKEN_URL =
  process.env.OPENSKY_TOKEN_URL?.trim() ||
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const TOKEN_REFRESH_MARGIN = 30;
const TOKEN_TIMEOUT_MS = 20_000;

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getOpenSkyCredentials(): {
  clientId: string | undefined;
  clientSecret: string | undefined;
} {
  return {
    clientId: readEnv("OPENSKY_CLIENT_ID"),
    clientSecret: readEnv("OPENSKY_CLIENT_SECRET"),
  };
}

export function isOpenSkyConfigured(): boolean {
  const { clientId, clientSecret } = getOpenSkyCredentials();
  return Boolean(clientId && clientSecret);
}

export function isOpenSkyTokenCached(): boolean {
  return tokenCache !== null && Date.now() < tokenCache.expiresAt;
}

function postFormHttps(
  url: string,
  body: string,
  timeoutMs: number,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: "POST",
        family: 4,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
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
      reject(new Error(`OpenSky token request timed out after ${timeoutMs}ms`));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function postFormFetch(
  url: string,
  body: string,
  timeoutMs: number,
): Promise<{ status: number; text: string }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  return { status: response.status, text: await response.text() };
}

async function requestToken(
  clientId: string,
  clientSecret: string,
): Promise<{ access_token: string; expires_in?: number }> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  let lastError: unknown;

  for (const attempt of ["https-ipv4", "fetch"] as const) {
    try {
      const result =
        attempt === "https-ipv4"
          ? await postFormHttps(TOKEN_URL, body, TOKEN_TIMEOUT_MS)
          : await postFormFetch(TOKEN_URL, body, TOKEN_TIMEOUT_MS);

      if (result.status < 200 || result.status >= 300) {
        throw new Error(
          `OpenSky token refresh failed: ${result.status} ${result.text.slice(0, 300)}`,
        );
      }

      return JSON.parse(result.text) as {
        access_token: string;
        expires_in?: number;
      };
    } catch (err) {
      lastError = err;
      console.warn(
        `[Aeroscope] OpenSky token via ${attempt} failed:`,
        formatNetworkError(err),
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(formatNetworkError(lastError));
}

export async function getOpenSkyAuthHeaders(): Promise<Record<string, string>> {
  const { clientId, clientSecret } = getOpenSkyCredentials();
  if (!clientId || !clientSecret) {
    return {};
  }

  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return { Authorization: `Bearer ${tokenCache.token}` };
  }

  const data = await requestToken(clientId, clientSecret);
  const expiresIn = data.expires_in ?? 1800;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - TOKEN_REFRESH_MARGIN) * 1000,
  };

  return { Authorization: `Bearer ${tokenCache.token}` };
}

async function probeHost(
  url: string,
  method: "GET" | "HEAD" = "HEAD",
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(url, {
      method,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    return { ok: true, status: response.status };
  } catch (err) {
    return { ok: false, error: formatNetworkError(err) };
  }
}

/** Probe OAuth without throwing — used by /api/health. */
export async function probeOpenSkyAuth(): Promise<{
  configured: boolean;
  ok: boolean;
  error?: string;
  tokenUrl: string;
  authHostProbe: { ok: boolean; status?: number; error?: string };
  apiHostProbe: { ok: boolean; status?: number; error?: string };
}> {
  const configured = isOpenSkyConfigured();
  const authHostProbe = await probeHost(TOKEN_URL);
  const apiHostProbe = await probeHost(
    "https://opensky-network.org/api/states/all?lamin=0&lomin=0&lamax=1&lomax=1",
    "GET",
  );

  if (!configured) {
    return {
      configured: false,
      ok: false,
      tokenUrl: TOKEN_URL,
      authHostProbe,
      apiHostProbe,
      error: "OPENSKY_CLIENT_ID or OPENSKY_CLIENT_SECRET is not set on the server",
    };
  }

  try {
    await getOpenSkyAuthHeaders();
    return {
      configured: true,
      ok: true,
      tokenUrl: TOKEN_URL,
      authHostProbe,
      apiHostProbe,
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      tokenUrl: TOKEN_URL,
      authHostProbe,
      apiHostProbe,
      error: formatNetworkError(err),
    };
  }
}
