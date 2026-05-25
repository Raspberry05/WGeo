/**
 * Generates minimal category placeholder .bin + .gltf pairs for Aeroscope.
 * Run: node scripts/generate-placeholders.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/models");

function boxVerts(nx, ny, nz, mx, my, mz) {
  return new Float32Array([
    nx, ny, nz, mx, ny, nz, mx, my, nz, nx, my, nz,
    nx, ny, mz, mx, ny, mz, mx, my, mz, nx, my, mz,
  ]);
}

const CUBE_INDICES = new Uint16Array([
  0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1,
  2, 6, 7, 2, 7, 3, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2,
]);

function buildTwoMeshGltf(name, bodyBox, wingBox) {
  const bodyVerts = boxVerts(...bodyBox);
  const wingVerts = boxVerts(...wingBox);
  const bodyIdx = CUBE_INDICES;
  const wingIdx = CUBE_INDICES;

  const bodyBytes = new Uint8Array(bodyVerts.buffer);
  const wingBytes = new Uint8Array(wingVerts.buffer);
  const bodyIdxBytes = new Uint8Array(bodyIdx.buffer);
  const wingIdxBytes = new Uint8Array(wingIdx.buffer);

  const bodyLen = bodyBytes.length;
  const wingLen = wingBytes.length;
  const bodyIdxLen = bodyIdxBytes.length;
  const wingIdxLen = wingIdxBytes.length;

  const total = bodyLen + wingLen + bodyIdxLen + wingIdxLen;
  const bin = new Uint8Array(total);
  let off = 0;
  bin.set(bodyBytes, off);
  off += bodyLen;
  bin.set(wingBytes, off);
  off += wingLen;
  bin.set(bodyIdxBytes, off);
  off += bodyIdxLen;
  bin.set(wingIdxBytes, off);

  const bodyMax = bodyBox.slice(3);
  const bodyMin = bodyBox.slice(0, 3);
  const wingMax = wingBox.slice(3);
  const wingMin = wingBox.slice(0, 3);

  const gltf = {
    asset: { version: "2.0", generator: "Aeroscope" },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [
      { name: "body", mesh: 0 },
      { name: "wings", mesh: 1 },
    ],
    meshes: [
      {
        primitives: [
          { attributes: { POSITION: 0 }, indices: 2, mode: 4 },
        ],
      },
      {
        primitives: [
          { attributes: { POSITION: 1 }, indices: 3, mode: 4 },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 8,
        type: "VEC3",
        max: bodyMax,
        min: bodyMin,
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 8,
        type: "VEC3",
        max: wingMax,
        min: wingMin,
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: 36,
        type: "SCALAR",
      },
      {
        bufferView: 3,
        componentType: 5123,
        count: 36,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteLength: bodyLen, target: 34962 },
      { buffer: 0, byteOffset: bodyLen, byteLength: wingLen, target: 34962 },
      {
        buffer: 0,
        byteOffset: bodyLen + wingLen,
        byteLength: bodyIdxLen,
        target: 34963,
      },
      {
        buffer: 0,
        byteOffset: bodyLen + wingLen + bodyIdxLen,
        byteLength: wingIdxLen,
        target: 34963,
      },
    ],
    buffers: [{ byteLength: total, uri: `${name}.bin` }],
  };

  return { gltf, bin };
}

function buildSingleMeshGltf(name, box) {
  const verts = boxVerts(...box);
  const idx = CUBE_INDICES;
  const vBytes = new Uint8Array(verts.buffer);
  const iBytes = new Uint8Array(idx.buffer);
  const total = vBytes.length + iBytes.length;
  const bin = new Uint8Array(total);
  bin.set(vBytes, 0);
  bin.set(iBytes, vBytes.length);

  const gltf = {
    asset: { version: "2.0", generator: "Aeroscope" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: "mesh", mesh: 0 }],
    meshes: [
      {
        primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 8,
        type: "VEC3",
        max: box.slice(3),
        min: box.slice(0, 3),
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: 36,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteLength: vBytes.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: vBytes.length,
        byteLength: iBytes.length,
        target: 34963,
      },
    ],
    buffers: [{ byteLength: total, uri: `${name}.bin` }],
  };

  return { gltf, bin };
}

const specs = [
  {
    name: "balloon-placeholder",
    single: [-0.35, -0.35, -0.45, 0.35, 0.35, 0.45],
  },
  {
    name: "glider-placeholder",
    body: [-0.06, -0.04, -0.25, 0.06, 0.04, 0.25],
    wing: [-1.4, -0.02, -0.08, 1.4, 0.02, 0.08],
  },
  {
    name: "light-placeholder",
    body: [-0.08, -0.05, -0.35, 0.08, 0.05, 0.35],
    wing: [-0.45, -0.03, -0.08, 0.45, 0.03, 0.08],
  },
  {
    name: "small-placeholder",
    body: [-0.1, -0.06, -0.45, 0.1, 0.06, 0.45],
    wing: [-0.65, -0.035, -0.1, 0.65, 0.035, 0.1],
  },
  {
    name: "large-placeholder",
    body: [-0.14, -0.08, -0.7, 0.14, 0.08, 0.7],
    wing: [-1.0, -0.04, -0.14, 1.0, 0.04, 0.14],
  },
  {
    name: "heavy-placeholder",
    body: [-0.18, -0.1, -0.95, 0.18, 0.1, 0.95],
    wing: [-1.25, -0.05, -0.18, 1.25, 0.05, 0.18],
  },
];

for (const spec of specs) {
  let gltf;
  let bin;
  if (spec.single) {
    ({ gltf, bin } = buildSingleMeshGltf(spec.name, spec.single));
  } else {
    ({ gltf, bin } = buildTwoMeshGltf(spec.name, spec.body, spec.wing));
  }
  writeFileSync(join(outDir, `${spec.name}.bin`), bin);
  writeFileSync(
    join(outDir, `${spec.name}.gltf`),
    JSON.stringify(gltf, null, 2),
  );
  console.log(`Wrote ${spec.name}`);
}

console.log("Done.");
