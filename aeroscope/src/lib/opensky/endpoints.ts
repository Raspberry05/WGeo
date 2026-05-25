const DEFAULT_STATES_URL =
  "https://opensky-network.org/api/states/all";
const DEFAULT_TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

export function getOpenSkyStatesUrl(): string {
  return process.env.OPENSKY_STATES_URL?.trim() || DEFAULT_STATES_URL;
}

export function getOpenSkyTokenUrl(): string {
  return process.env.OPENSKY_TOKEN_URL?.trim() || DEFAULT_TOKEN_URL;
}

/** True when Vercel talks to a forward proxy instead of OpenSky directly. */
export function isOpenSkyProxyConfigured(): boolean {
  return Boolean(
    process.env.OPENSKY_STATES_URL?.trim() ||
      process.env.OPENSKY_TOKEN_URL?.trim(),
  );
}

/** GET probe URL for health checks (proxy /health or OpenSky states sample). */
export function getOpenSkyStatesProbeUrl(): string {
  const statesUrl = getOpenSkyStatesUrl();
  if (statesUrl.endsWith("/states")) {
    return `${statesUrl}?lamin=0&lomin=0&lamax=1&lomax=1`;
  }
  return `${statesUrl}?lamin=0&lomin=0&lamax=1&lomax=1`;
}

export function getOpenSkyProxyHealthUrl(): string | null {
  const statesUrl = getOpenSkyStatesUrl();
  if (!statesUrl.includes("/states")) return null;
  return statesUrl.replace(/\/states\/?$/, "/health");
}
