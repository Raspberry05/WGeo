import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");
const cesiumBuild = path.join(projectRoot, "node_modules", "cesium", "Build", "Cesium");
const publicCesium = path.join(projectRoot, "public", "cesium");

const folders = ["Assets", "ThirdParty", "Workers", "Widgets"];

if (!existsSync(cesiumBuild)) {
  console.warn("[copy-cesium] Cesium build not found — run npm install first.");
  process.exit(0);
}

mkdirSync(publicCesium, { recursive: true });

for (const folder of folders) {
  const from = path.join(cesiumBuild, folder);
  const to = path.join(publicCesium, folder);
  if (!existsSync(from)) {
    console.warn(`[copy-cesium] Skipping missing folder: ${folder}`);
    continue;
  }
  cpSync(from, to, { recursive: true });
  console.log(`[copy-cesium] ${folder} → public/cesium/${folder}`);
}

const cesiumJs = path.join(cesiumBuild, "Cesium.js");
if (existsSync(cesiumJs)) {
  copyFileSync(cesiumJs, path.join(publicCesium, "Cesium.js"));
  console.log("[copy-cesium] Cesium.js → public/cesium/Cesium.js");
} else {
  console.warn("[copy-cesium] Cesium.js not found — globe may fail to load.");
}
