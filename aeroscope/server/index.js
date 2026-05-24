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
const BOUNDS = "?lamin=32.5&lomin=-85.8&lamax=34.8&lomax=-83.2";

const CACHE_TTL = 10000; // 10 seconds
const TOKEN_REFRESH_MARGIN = 30; // seconds before expiry to refresh

let cache = null;
let lastFetch = 0;

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
  try {
    const now = Date.now();

    if (cache && now - lastFetch < CACHE_TTL) {
      console.log("📦 Returning cached data");
      return res.json(cache);
    }

    console.log("🌐 Fetching fresh data from OpenSky...");

    // Get valid token and fetch data
    const headers = await tokenManager.headers();
    const response = await axios.get(AIRCRAFT_URL + BOUNDS, {
      headers,
      timeout: 25000,
    });

    cache = response.data;
    lastFetch = now;

    console.log(`✓ Fetched ${response.data.states?.length || 0} aircraft`);
    return res.json(cache);
  } catch (err) {
    console.error("❌ OpenSky error:", {
      status: err.response?.status,
      message: err.message,
      data: err.response?.data,
    });

    // Return stale cache if available
    if (cache) {
      console.log("⚠ Returning stale cache");
      return res.json(cache);
    }

    return res.json({ states: [] });
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    endpoint: "/api/opensky",
    cached: cache !== null,
    cacheAge: cache ? Math.floor((Date.now() - lastFetch) / 1000) : null,
    tokenValid:
      tokenManager.token !== null && Date.now() < tokenManager.expiresAt,
  });
});

app.listen(4000, () => {
  console.log("✈ OpenSky proxy running on http://localhost:4000");
  console.log("📍 Test endpoint: http://localhost:4000/api/opensky");
});
