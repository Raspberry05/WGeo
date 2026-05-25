const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
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

export async function getOpenSkyAuthHeaders(): Promise<Record<string, string>> {
  const { clientId, clientSecret } = getOpenSkyCredentials();
  if (!clientId || !clientSecret) {
    return {};
  }

  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return { Authorization: `Bearer ${tokenCache.token}` };
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const text = await response.text();
    tokenCache = null;
    throw new Error(`OpenSky token refresh failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };

  const expiresIn = data.expires_in ?? 1800;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - TOKEN_REFRESH_MARGIN) * 1000,
  };

  return { Authorization: `Bearer ${tokenCache.token}` };
}

/** Probe OAuth without throwing — used by /api/health. */
export async function probeOpenSkyAuth(): Promise<{
  configured: boolean;
  ok: boolean;
  error?: string;
}> {
  const configured = isOpenSkyConfigured();
  if (!configured) {
    return {
      configured: false,
      ok: false,
      error: "OPENSKY_CLIENT_ID or OPENSKY_CLIENT_SECRET is not set on the server",
    };
  }

  try {
    await getOpenSkyAuthHeaders();
    return { configured: true, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { configured: true, ok: false, error: message };
  }
}
