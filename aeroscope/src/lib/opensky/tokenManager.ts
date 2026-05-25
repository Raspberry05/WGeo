import {
  getOpenSkyProxyHealthUrl,
  getOpenSkyStatesProbeUrl,
  getOpenSkyTokenUrl,
  isOpenSkyProxyConfigured,
} from "./endpoints";
import { formatNetworkError } from "./networkError";
import { httpsRequest } from "./httpsGet";
import { OPENSKY_PROBE_TIMEOUT_MS, OPENSKY_TOKEN_TIMEOUT_MS } from "./timeouts";

const TOKEN_URL = getOpenSkyTokenUrl();
const TOKEN_REFRESH_MARGIN = 30;

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

async function requestToken(
  clientId: string,
  clientSecret: string,
): Promise<{ access_token: string; expires_in?: number }> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  const result = await httpsRequest(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    timeoutMs: OPENSKY_TOKEN_TIMEOUT_MS,
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `OpenSky token refresh failed: ${result.status} ${result.text.slice(0, 300)}`,
    );
  }

  return JSON.parse(result.text) as {
    access_token: string;
    expires_in?: number;
  };
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

async function probeHostHttps(
  url: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const result = await httpsRequest(url, {
      method: "GET",
      timeoutMs: OPENSKY_PROBE_TIMEOUT_MS,
    });
    return { ok: true, status: result.status };
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
  vercelRegion: string | null;
  authHostProbe: { ok: boolean; status?: number; error?: string };
  apiHostProbe: { ok: boolean; status?: number; error?: string };
}> {
  const configured = isOpenSkyConfigured();
  const vercelRegion = process.env.VERCEL_REGION ?? null;

  const usingProxy = isOpenSkyProxyConfigured();
  const proxyHealthUrl = getOpenSkyProxyHealthUrl();

  const [authHostProbe, apiHostProbe] = usingProxy && proxyHealthUrl
    ? await (async () => {
        const proxyProbe = await probeHostHttps(proxyHealthUrl);
        return [proxyProbe, proxyProbe] as const;
      })()
    : await Promise.all([
        probeHostHttps("https://auth.opensky-network.org/"),
        probeHostHttps(getOpenSkyStatesProbeUrl()),
      ]);

  if (!configured) {
    return {
      configured: false,
      ok: false,
      tokenUrl: TOKEN_URL,
      vercelRegion,
      authHostProbe,
      apiHostProbe,
      error: "OPENSKY_CLIENT_ID or OPENSKY_CLIENT_SECRET is not set on the server",
    };
  }

  if (usingProxy && isOpenSkyTokenCached()) {
    return {
      configured: true,
      ok: true,
      tokenUrl: TOKEN_URL,
      vercelRegion,
      authHostProbe,
      apiHostProbe,
    };
  }

  try {
    await getOpenSkyAuthHeaders();
    return {
      configured: true,
      ok: true,
      tokenUrl: TOKEN_URL,
      vercelRegion,
      authHostProbe,
      apiHostProbe,
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      tokenUrl: TOKEN_URL,
      vercelRegion,
      authHostProbe,
      apiHostProbe,
      error: formatNetworkError(err),
    };
  }
}
