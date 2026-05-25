import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());

const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const CLIENT_ID = process.env.OPENSKY_CLIENT_ID;
const CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET;

const AIRCRAFT_URL = "https://opensky-network.org/api/states/all";

const CACHE_TTL = 10000; // 10 seconds
const TOKEN_REFRESH_MARGIN = 30; // seconds before expiry to refresh

/** @type {Map<string, { data: object, lastFetch: number }>} */
const cacheByBounds = new Map();

function parseBounds(query) {
  const lamin = parseFloat(query.lamin);
  const lomin = parseFloat(query.lomin);
  const lamax = parseFloat(query.lamax);
  const lomax = parseFloat(query.lomax);

  if (
    [lamin, lomin, lamax, lomax].some((v) => Number.isNaN(v)) ||
    lamin < -90 ||
    lamin > 90 ||
    lamax < -90 ||
    lamax > 90 ||
    lomin < -180 ||
    lomin > 180 ||
    lomax < -180 ||
    lomax > 180 ||
    lamin >= lamax ||
    lomin >= lomax
  ) {
    return null;
  }

  return { lamin, lomin, lamax, lomax };
}

function boundsKey(bounds) {
  return `${bounds.lamin},${bounds.lomin},${bounds.lamax},${bounds.lomax}`;
}

function boundsQuery(bounds) {
  return `?lamin=${bounds.lamin}&lomin=${bounds.lomin}&lamax=${bounds.lamax}&lomax=${bounds.lomax}`;
}

// Token manager
class TokenManager {
  constructor(clientId, clientSecret, tokenUrl) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tokenUrl = tokenUrl;
    this.token = null;
    this.expiresAt = null;
  }

  async getToken() {
    // Return cached token if still valid
    if (this.token && this.expiresAt && Date.now() < this.expiresAt) {
      return this.token;
    }
    return await this.refresh();
  }

  async refresh() {
    console.log("🔄 Refreshing OAuth token...");

    try {
      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );

      const data = response.data;
      console.log("Token response:", data);
      this.token = data.access_token;

      const expiresIn = data.expires_in || 1800; // default 30 min
      this.expiresAt = Date.now() + (expiresIn - TOKEN_REFRESH_MARGIN) * 1000;

      console.log(`✅ Token acquired, expires in ${expiresIn}s`);
      return this.token;
    } catch (err) {
      console.error(
        "❌ Token refresh failed:",
        err.response?.data || err.message,
      );
      throw err;
    }
  }

  async headers() {
    const token = await this.getToken();
    return { Authorization: `Bearer ${token}` };
  }
}

const tokenManager = new TokenManager(CLIENT_ID, CLIENT_SECRET, TOKEN_URL);

console.log("Credentials loaded:", {
  user: CLIENT_ID ? "✓" : "✗",
  pass: CLIENT_SECRET ? "✓" : "✗",
});

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("⚠ WARNING: OpenSky credentials not found in .env file!");
}

app.get("/api/opensky", async (req, res) => {
  const bounds = parseBounds(req.query);
  if (!bounds) {
    return res.status(400).json({
      error: "Invalid or missing bounds. Required: lamin, lomin, lamax, lomax",
    });
  }

  const key = boundsKey(bounds);

  try {
    const now = Date.now();
    const cached = cacheByBounds.get(key);

    if (cached && now - cached.lastFetch < CACHE_TTL) {
      console.log(`📦 Returning cached data for ${key}`);
      return res.json(cached.data);
    }

    console.log(`🌐 Fetching OpenSky for ${key}...`);

    const headers = await tokenManager.headers();
    const response = await axios.get(AIRCRAFT_URL + boundsQuery(bounds), {
      headers,
      timeout: 25000,
    });

    cacheByBounds.set(key, { data: response.data, lastFetch: now });

    console.log(`✓ Fetched ${response.data.states?.length || 0} aircraft`);
    return res.json(response.data);
  } catch (err) {
    console.error("❌ OpenSky error:", {
      status: err.response?.status,
      message: err.message,
      data: err.response?.data,
    });

    const cached = cacheByBounds.get(key);
    if (cached) {
      console.log("⚠ Returning stale cache");
      return res.json(cached.data);
    }

    return res.json({ states: [] });
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    endpoint: "/api/opensky?lamin=&lomin=&lamax=&lomax=",
    cachedRegions: cacheByBounds.size,
    tokenValid:
      tokenManager.token !== null && Date.now() < tokenManager.expiresAt,
  });
});

app.listen(4000, () => {
  console.log("✈ OpenSky proxy running on http://localhost:4000");
  console.log("📍 Test endpoint: http://localhost:4000/api/opensky");
});
