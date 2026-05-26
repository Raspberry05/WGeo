/**
 * Generates minimal category placeholder .bin + .gltf pairs for Aeroscope.
 * Run: node scripts/generate-placeholders.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/models");

const CUBE_INDICES = new Uint16Array([
  0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1,
  2, 6, 7, 2, 7, 3, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2,
]);

function boxVerts(nx, ny, nz, mx, my, mz) {
  return new Float32Array([
    nx, ny, nz, mx, ny, nz, mx, my, nz, nx, my, nz,
    nx, ny, mz, mx, ny, mz, mx, my, mz, nx, my, mz,
  ]);
}

function boxMinMax(box) {
  return { min: box.slice(0, 3), max: box.slice(3) };
}

function buildMultiMeshGltf(name, boxes) {
  const binParts = [];
  const meshes = [];
  const nodes = [];
  const accessors = [];
  const bufferViews = [];
  let acc = 0;

  for (let i = 0; i < boxes.length; i++) {
    const verts = boxVerts(...boxes[i]);
    const vOff = binParts.reduce((s, p) => s + p.length, 0);
    const vBytes = new Uint8Array(verts.buffer);
    const iBytes = new Uint8Array(CUBE_INDICES.buffer);
    binParts.push(vBytes, iBytes);
    const { min, max } = boxMinMax(boxes[i]);

    bufferViews.push(
      { buffer: 0, byteOffset: vOff, byteLength: vBytes.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: vOff + vBytes.length,
        byteLength: iBytes.length,
        target: 34963,
      },
    );
    accessors.push(
      {
        bufferView: bufferViews.length - 2,
        componentType: 5126,
        count: 8,
        type: "VEC3",
        max,
        min,
      },
      {
        bufferView: bufferViews.length - 1,
        componentType: 5123,
        count: 36,
        type: "SCALAR",
      },
    );
    meshes.push({
      primitives: [{ attributes: { POSITION: acc }, indices: acc + 1, mode: 4 }],
    });
    nodes.push({ name: `part_${i}`, mesh: i });
    acc += 2;
  }

  const total = binParts.reduce((s, p) => s + p.length, 0);
  const bin = new Uint8Array(total);
  let off = 0;
  for (const p of binParts) {
    bin.set(p, off);
    off += p.length;
  }

  const gltf = {
    asset: { version: "2.0", generator: "Aeroscope" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    accessors,
    bufferViews,
    buffers: [{ byteLength: total, uri: `${name}.bin` }],
  };

  return { gltf, bin };
}

/** Flat disc (circle silhouette from above). */
function buildDiscGltf(name, radius = 0.55, segments = 20, halfH = 0.07) {
  const positions = [];
  const indices = [];

  positions.push(0, halfH, 0);
  positions.push(0, -halfH, 0);
  const topCenter = 0;
  const botCenter = 1;

  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    positions.push(x, halfH, z);
    if (i < segments) {
      const rimTop = 2 + i;
      const rimTopNext = 2 + i + 1;
      indices.push(topCenter, rimTop, rimTopNext);
    }
  }

  const botRingStart = positions.length / 3;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    positions.push(x, -halfH, z);
    if (i < segments) {
      const rimBot = botRingStart + i;
      const rimBotNext = botRingStart + i + 1;
      indices.push(botCenter, rimBotNext, rimBot);
    }
  }

  for (let i = 0; i < segments; i++) {
    const t0 = 2 + i;
    const t1 = 2 + i + 1;
    const b0 = botRingStart + i;
    const b1 = botRingStart + i + 1;
    indices.push(t0, b0, b1, t0, b1, t1);
  }

  const pos = new Float32Array(positions);
  const idx = new Uint16Array(indices);
  const vBytes = new Uint8Array(pos.buffer);
  const iBytes = new Uint8Array(idx.buffer);
  const total = vBytes.length + iBytes.length;
  const bin = new Uint8Array(total);
  bin.set(vBytes, 0);
  bin.set(iBytes, vBytes.length);

  const gltf = {
    asset: { version: "2.0", generator: "Aeroscope" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: "disc", mesh: 0 }],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: pos.length / 3,
        type: "VEC3",
        max: [radius, halfH, radius],
        min: [-radius, -halfH, -radius],
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: idx.length,
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

/** Fuselage + asterisk rotor (2 crossed blades) with Y-axis spin animation. */
function buildHelicopterGltf(name) {
  const geomParts = [];
  const boxes = [
    [-0.07, -0.07, -0.35, 0.07, 0.07, 0.35],
    [-1.05, -0.025, -0.025, 1.05, 0.025, 0.025],
    [-0.025, -0.025, -1.05, 0.025, 0.025, 1.05],
  ];

  const accessors = [];
  const bufferViews = [];
  let acc = 0;

  for (const box of boxes) {
    const verts = boxVerts(...box);
    const vOff = geomParts.reduce((s, p) => s + p.length, 0);
    const vBytes = new Uint8Array(verts.buffer);
    const iBytes = new Uint8Array(CUBE_INDICES.buffer);
    geomParts.push(vBytes, iBytes);
    const { min, max } = boxMinMax(box);

    bufferViews.push(
      { buffer: 0, byteOffset: vOff, byteLength: vBytes.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: vOff + vBytes.length,
        byteLength: iBytes.length,
        target: 34963,
      },
    );
    accessors.push(
      {
        bufferView: bufferViews.length - 2,
        componentType: 5126,
        count: 8,
        type: "VEC3",
        max,
        min,
      },
      {
        bufferView: bufferViews.length - 1,
        componentType: 5123,
        count: 36,
        type: "SCALAR",
      },
    );
    acc += 2;
  }

  const geomLen = geomParts.reduce((s, p) => s + p.length, 0);
  const times = new Float32Array([0, 1.2]);
  const rots = new Float32Array([0, 0, 0, 1, 0, 1, 0, 0]);
  const timeBytes = new Uint8Array(times.buffer);
  const rotBytes = new Uint8Array(rots.buffer);
  const total = geomLen + timeBytes.length + rotBytes.length;
  const bin = new Uint8Array(total);
  let off = 0;
  for (const p of geomParts) {
    bin.set(p, off);
    off += p.length;
  }
  bin.set(timeBytes, off);
  bin.set(rotBytes, off + timeBytes.length);

  const timeAccIdx = accessors.length;
  const rotAccIdx = accessors.length + 1;
  bufferViews.push(
    { buffer: 0, byteOffset: geomLen, byteLength: timeBytes.length },
    {
      buffer: 0,
      byteOffset: geomLen + timeBytes.length,
      byteLength: rotBytes.length,
    },
  );
  accessors.push(
    {
      bufferView: bufferViews.length - 2,
      componentType: 5126,
      count: 2,
      type: "SCALAR",
      max: [1.2],
      min: [0],
    },
    {
      bufferView: bufferViews.length - 1,
      componentType: 5126,
      count: 2,
      type: "VEC4",
      max: [0, 1, 0, 1],
      min: [0, 0, 0, -1],
    },
  );

  const gltf = {
    asset: { version: "2.0", generator: "Aeroscope" },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [
      { name: "fuselage", mesh: 0 },
      {
        name: "rotors",
        translation: [0, 0.1, 0],
        children: [2, 3],
      },
      { name: "blade_x", mesh: 1 },
      { name: "blade_z", mesh: 2 },
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] },
      { primitives: [{ attributes: { POSITION: 2 }, indices: 3, mode: 4 }] },
      { primitives: [{ attributes: { POSITION: 4 }, indices: 5, mode: 4 }] },
    ],
    accessors,
    bufferViews,
    buffers: [{ byteLength: total, uri: `${name}.bin` }],
    animations: [
      {
        name: "rotor_spin",
        channels: [{ sampler: 0, target: { node: 1, path: "rotation" } }],
        samplers: [
          {
            interpolation: "LINEAR",
            input: timeAccIdx,
            output: rotAccIdx,
          },
        ],
      },
    ],
  };

  return { gltf, bin };
}

const planeSpecs = [
  {
    name: "plane-placeholder",
    boxes: [
      [-0.12, -0.07, -0.55, 0.12, 0.07, 0.55],
      [-0.75, -0.035, -0.1, 0.75, 0.035, 0.1],
    ],
  },
  {
    name: "light-placeholder",
    boxes: [
      [-0.06, -0.04, -0.28, 0.06, 0.04, 0.28],
      [-0.38, -0.02, -0.06, 0.38, 0.02, 0.06],
    ],
  },
  {
    name: "medium-placeholder",
    boxes: [
      [-0.1, -0.06, -0.5, 0.1, 0.06, 0.5],
      [-0.72, -0.03, -0.1, 0.72, 0.03, 0.1],
    ],
  },
  {
    name: "heavy-placeholder",
    boxes: [
      [-0.16, -0.09, -0.85, 0.16, 0.09, 0.85],
      [-1.15, -0.045, -0.16, 1.15, 0.045, 0.16],
      [-0.35, -0.03, -0.55, 0.35, 0.03, -0.35],
    ],
  },
  {
    name: "balloon-placeholder",
    boxes: [
      [-0.42, -0.42, -0.15, 0.42, 0.42, 0.48],
      [-0.04, -0.35, -0.55, 0.04, -0.42, -0.15],
    ],
  },
  {
    name: "glider-placeholder",
    boxes: [
      [-0.06, -0.04, -0.25, 0.06, 0.04, 0.25],
      [-1.4, -0.02, -0.08, 1.4, 0.02, 0.08],
    ],
  },
];

for (const spec of planeSpecs) {
  const { gltf, bin } = buildMultiMeshGltf(spec.name, spec.boxes);
  writeFileSync(join(outDir, `${spec.name}.bin`), bin);
  writeFileSync(
    join(outDir, `${spec.name}.gltf`),
    JSON.stringify(gltf, null, 2),
  );
  console.log(`Wrote ${spec.name}`);
}

const { gltf: heliGltf, bin: heliBin } = buildHelicopterGltf(
  "helicopter-placeholder",
);
writeFileSync(join(outDir, "helicopter-placeholder.bin"), heliBin);
writeFileSync(
  join(outDir, "helicopter-placeholder.gltf"),
  JSON.stringify(heliGltf, null, 2),
);
console.log("Wrote helicopter-placeholder");

const { gltf: unknownGltf, bin: unknownBin } = buildDiscGltf(
  "unknown-placeholder",
);
writeFileSync(join(outDir, "unknown-placeholder.bin"), unknownBin);
writeFileSync(
  join(outDir, "unknown-placeholder.gltf"),
  JSON.stringify(unknownGltf, null, 2),
);
console.log("Wrote unknown-placeholder");

console.log("Done.");
