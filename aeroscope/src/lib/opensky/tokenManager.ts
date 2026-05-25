const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const TOKEN_REFRESH_MARGIN = 30;

export class OpenSkyTokenManager {
  private token: string | null = null;
  private expiresAt: number | null = null;

  constructor(
    private readonly clientId: string | undefined,
    private readonly clientSecret: string | undefined,
    private readonly tokenUrl: string = TOKEN_URL,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  isTokenValid(): boolean {
    return (
      this.token !== null &&
      this.expiresAt !== null &&
      Date.now() < this.expiresAt
    );
  }

  async headers(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return { Authorization: `Bearer ${token}` };
  }

  private async getToken(): Promise<string> {
    if (this.token && this.expiresAt && Date.now() < this.expiresAt) {
      return this.token;
    }
    return this.refresh();
  }

  private async refresh(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("OpenSky credentials are not configured");
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenSky token refresh failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in?: number;
    };

    this.token = data.access_token;
    const expiresIn = data.expires_in ?? 1800;
    this.expiresAt = Date.now() + (expiresIn - TOKEN_REFRESH_MARGIN) * 1000;
    return this.token;
  }
}

let singleton: OpenSkyTokenManager | null = null;

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getOpenSkyTokenManager(): OpenSkyTokenManager {
  if (!singleton) {
    singleton = new OpenSkyTokenManager(
      readEnv("OPENSKY_CLIENT_ID"),
      readEnv("OPENSKY_CLIENT_SECRET"),
    );
  }
  return singleton;
}
