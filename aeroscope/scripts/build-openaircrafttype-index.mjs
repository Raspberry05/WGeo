/**
 * Build a compact lookup index from OpenAircraftType.
 *
 * Source repo: https://github.com/atoff/OpenAircraftType
 *
 * Output: src/domain/aircraft/openAircraftTypeIndex.json
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const repoRoot = join(process.cwd(), ".cache", "OpenAircraftType");
const srcRoot = join(repoRoot, "src");
const outPath = join(
  process.cwd(),
  "src",
  "domain",
  "aircraft",
  "openAircraftTypeIndex.json",
);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.toLowerCase().endsWith(".txt")) {
      out.push(full);
    }
  }
  return out;
}

function parseKeyValues(text) {
  /** @type {Record<string,string>} */
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim().toUpperCase();
    const value = line.slice(idx + 1).trim();
    if (!key || !value) continue;
    out[key] = value;
  }
  return out;
}

if (!statSync(repoRoot, { throwIfNoEntry: false })) {
  console.error(
    `OpenAircraftType repo not found at ${repoRoot}. Clone it first.`,
  );
  process.exit(1);
}

const files = walk(srcRoot);
/** @type {Record<string, { class: string | null, wake: string | null, model: string | null }>} */
const index = {};

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const kv = parseKeyValues(content);
  const icao = (kv.ICAO ?? "").trim().toUpperCase();
  if (!icao) continue;
  const cls = (kv.CLASS ?? "").trim().toUpperCase() || null;
  const wake = (kv.WAKE ?? "").trim().toUpperCase() || null;
  const model = (kv.MODEL ?? "").trim() || null;
  index[icao] = { class: cls, wake, model };
}

writeFileSync(outPath, `${JSON.stringify(index)}\n`, "utf8");
console.log(`Wrote ${Object.keys(index).length} ICAO types to ${outPath}`);

