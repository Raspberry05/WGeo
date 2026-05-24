import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());

const URL =
  "https://opensky-network.org/api/states/all?lamin=33.3&lomin=-84.8&lamax=33.9&lomax=-84.0";

const CACHE_TTL = 5000; // 5 sec

let cache = null;
let lastFetch = 0;

app.get("/api/opensky", async (req, res) => {
  try {
    const now = Date.now();

    if (cache && now - lastFetch < CACHE_TTL) {
      return res.json(cache);
    }

    const response = await axios.get(URL, {
      timeout: 8000,
    });

    cache = response.data;
    lastFetch = now;

    return res.json(cache);
  } catch (err) {
    console.error("OpenSky error:", err.message);

    // IMPORTANT: never crash frontend
    return res.json({ states: [] });
  }
});

app.listen(4000, () =>
  console.log("OpenSky proxy running on http://localhost:4000"),
);
