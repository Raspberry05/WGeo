/**
 * Downloads OurAirports airports.csv and builds:
 *   public/data/airports-global.json  — all types (map markers)
 *   public/data/airports-index.json   — full catalog (search / metadata)
 * Run: node scripts/build-airport-catalog.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/data");
const indexFile = join(outDir, "airports-index.json");
const globalFile = join(outDir, "airports-global.json");

const CSV_URL =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

const INCLUDED_TYPES = new Set([
  "large_airport",
  "medium_airport",
  "small_airport",
  "heliport",
  "seaplane_base",
]);

/** Every included type is drawn on the global map layer (filtered in the HUD). */
const GLOBAL_TYPES = INCLUDED_TYPES;

function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = vals[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

console.log("Fetching OurAirports CSV...");
const res = await fetch(CSV_URL);
if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
const csv = await res.text();
const rows = parseCsv(csv);

const airports = [];
const globalAirports = [];

for (const row of rows) {
  const type = row.type;
  if (!INCLUDED_TYPES.has(type)) continue;

  const ident = (row.ident || row.gps_code || "").trim().toUpperCase();
  if (ident.length !== 4) continue;

  const lat = parseFloat(row.latitude_deg);
  const lon = parseFloat(row.longitude_deg);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

  const full = {
    id: ident,
    name: (row.name || ident).trim(),
    lat,
    lon,
    country: (row.iso_country || "").trim().toUpperCase(),
    type,
    municipality: (row.municipality || "").trim(),
  };
  airports.push(full);

  if (GLOBAL_TYPES.has(type)) {
    globalAirports.push({ id: ident, lat, lon, type });
  }
}

airports.sort((a, b) => a.id.localeCompare(b.id));
globalAirports.sort((a, b) => a.id.localeCompare(b.id));

mkdirSync(outDir, { recursive: true });
writeFileSync(indexFile, JSON.stringify(airports));
writeFileSync(globalFile, JSON.stringify(globalAirports));
console.log(`Wrote ${airports.length} airports to ${indexFile}`);
console.log(`Wrote ${globalAirports.length} airports to ${globalFile}`);
