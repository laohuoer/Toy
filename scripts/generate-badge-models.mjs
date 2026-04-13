/**
 * generate-badge-models.mjs
 *
 * Generates a .glb file for every badge defined in lib/badges.ts.
 * Uses only Node.js built-in modules — no npm dependencies required.
 *
 * Usage:
 *   node scripts/generate-badge-models.mjs
 *
 * Output:
 *   public/models/badge_*.glb  (one file per badge)
 *
 * Each GLB is a proper binary glTF 2.0 file containing a colored,
 * extruded 3-D badge shape (circle / hexagon / star / shield / diamond).
 * The Badge3DViewer will load these instead of falling back to the
 * in-browser procedural geometry.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'models');

// ─── Badge definitions ────────────────────────────────────────────────────────
// Extracted from lib/badges.ts
const BADGES = [
  // Toy Story
  { id: 'badge_woody',        modelType: 'star',    color: '#c8860a' },
  { id: 'badge_buzz',         modelType: 'diamond', color: '#5c6bc0' },
  { id: 'badge_alien',        modelType: 'circle',  color: '#55efc4' },
  { id: 'badge_forky',        modelType: 'circle',  color: '#74b9ff' },
  { id: 'badge_bo_peep',      modelType: 'hexagon', color: '#fd79a8' },
  { id: 'badge_buzz_helmet',  modelType: 'shield',  color: '#a29bfe' },
  { id: 'badge_andy_footprint', modelType: 'circle', color: '#e17055' },
  { id: 'badge_rocket_ship',  modelType: 'shield',  color: '#74b9ff' },
  // Monsters Inc
  { id: 'badge_sulley',       modelType: 'diamond', color: '#2980b9' },
  { id: 'badge_mike',         modelType: 'hexagon', color: '#00b894' },
  { id: 'badge_boo',          modelType: 'star',    color: '#fd79a8' },
  { id: 'badge_scare_door',   modelType: 'shield',  color: '#6c5ce7' },
  { id: 'badge_one_eye_symbol', modelType: 'circle', color: '#fdcb6e' },
  { id: 'badge_mu_emblem',    modelType: 'hexagon', color: '#00b894' },
  { id: 'badge_scream_canister', modelType: 'diamond', color: '#0984e3' },
  { id: 'badge_sulley_tail',  modelType: 'circle',  color: '#48c9b0' },
  // Finding Nemo
  { id: 'badge_nemo',         modelType: 'circle',  color: '#e17055' },
  { id: 'badge_marlin',       modelType: 'hexagon', color: '#fdcb6e' },
  { id: 'badge_dory',         modelType: 'star',    color: '#0984e3' },
  { id: 'badge_gill',         modelType: 'shield',  color: '#2d3436' },
  { id: 'badge_crush',        modelType: 'circle',  color: '#00b894' },
  { id: 'badge_whale_speak',  modelType: 'hexagon', color: '#74b9ff' },
  { id: 'badge_coral_reef',   modelType: 'diamond', color: '#fd79a8' },
  // Incredibles
  { id: 'badge_mr_incredible', modelType: 'diamond', color: '#e74c3c' },
  { id: 'badge_elastigirl',   modelType: 'star',    color: '#e74c3c' },
  { id: 'badge_violet',       modelType: 'hexagon', color: '#8b5cf6' },
  { id: 'badge_dash',         modelType: 'circle',  color: '#f1c40f' },
  { id: 'badge_jack_jack',    modelType: 'star',    color: '#e17055' },
  { id: 'badge_incredibles_logo', modelType: 'shield', color: '#e74c3c' },
  { id: 'badge_frozone_symbol', modelType: 'circle', color: '#74b9ff' },
  { id: 'badge_super_car',    modelType: 'shield',  color: '#2d3436' },
  // Cars
  { id: 'badge_mcqueen',      modelType: 'diamond', color: '#e74c3c' },
  { id: 'badge_mater',        modelType: 'circle',  color: '#b07c4f' },
  { id: 'badge_sally',        modelType: 'hexagon', color: '#74b9ff' },
  { id: 'badge_doc_hudson',   modelType: 'star',    color: '#2980b9' },
  { id: 'badge_piston_cup',   modelType: 'shield',  color: '#f39c12' },
  { id: 'badge_95',           modelType: 'circle',  color: '#e74c3c' },
  { id: 'badge_radiator_springs', modelType: 'hexagon', color: '#e67e22' },
  // Ratatouille
  { id: 'badge_remy',         modelType: 'diamond', color: '#9b59b6' },
  { id: 'badge_linguini',     modelType: 'circle',  color: '#e67e22' },
  { id: 'badge_chef_hat',     modelType: 'hexagon', color: '#f5cba7' },
  { id: 'badge_french_dish',  modelType: 'shield',  color: '#f39c12' },
  { id: 'badge_eiffel_tower', modelType: 'diamond', color: '#2c3e50' },
];

// ─── Hex color → [r, g, b] (0–1) ─────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16 & 0xff) / 255, (n >> 8 & 0xff) / 255, (n & 0xff) / 255];
}

// ─── Geometry builders ────────────────────────────────────────────────────────
/**
 * Returns { positions: Float32Array, normals: Float32Array, indices: Uint32Array }
 * All coordinates are in a [-1, 1] cube so Badge3DViewer's auto-scale still works.
 */

/** Disc (flat cylinder): N-gon top + bottom + N side quads */
function buildCircle(segments = 48, depth = 0.18) {
  const half = depth / 2;
  const positions = [];
  const normals = [];
  const indices = [];

  // Top / bottom cap centers
  // We triangulate each cap as a fan from the center.
  const addCap = (z, normalZ) => {
    const baseIdx = positions.length / 3;
    // center
    positions.push(0, 0, z);
    normals.push(0, 0, normalZ);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      positions.push(Math.cos(a), Math.sin(a), z);
      normals.push(0, 0, normalZ);
    }
    for (let i = 0; i < segments; i++) {
      const a = baseIdx;
      const b = baseIdx + 1 + i;
      const c = baseIdx + 1 + (i + 1) % segments;
      if (normalZ > 0) indices.push(a, b, c);
      else             indices.push(a, c, b);
    }
  };

  addCap( half,  1);
  addCap(-half, -1);

  // Side ring
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const nx0 = Math.cos(a0), ny0 = Math.sin(a0);
    const nx1 = Math.cos(a1), ny1 = Math.sin(a1);

    const base = positions.length / 3;
    positions.push(nx0, ny0,  half,  nx1, ny1,  half,
                   nx1, ny1, -half,  nx0, ny0, -half);
    normals.push(nx0, ny0, 0, nx1, ny1, 0, nx1, ny1, 0, nx0, ny0, 0);
    indices.push(base, base+1, base+2, base, base+2, base+3);
  }

  return pack(positions, normals, indices);
}

/** Hexagonal prism */
function buildHexagon(depth = 0.18) {
  const segments = 6;
  return buildNGon(segments, depth);
}

/** N-sided prism helper */
function buildNGon(n, depth = 0.18) {
  const half = depth / 2;
  const positions = [];
  const normals = [];
  const indices = [];

  const verts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    verts.push([Math.cos(a), Math.sin(a)]);
  }

  // Top cap
  let base = 0;
  positions.push(0, 0, half); normals.push(0, 0, 1);
  for (const [x, y] of verts) { positions.push(x, y, half); normals.push(0, 0, 1); }
  for (let i = 0; i < n; i++) {
    indices.push(base, base + 1 + i, base + 1 + (i + 1) % n);
  }

  // Bottom cap
  base = positions.length / 3;
  positions.push(0, 0, -half); normals.push(0, 0, -1);
  for (const [x, y] of verts) { positions.push(x, y, -half); normals.push(0, 0, -1); }
  for (let i = 0; i < n; i++) {
    indices.push(base, base + 1 + (i + 1) % n, base + 1 + i);
  }

  // Sides
  for (let i = 0; i < n; i++) {
    const [x0, y0] = verts[i];
    const [x1, y1] = verts[(i + 1) % n];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const len = Math.sqrt(mx * mx + my * my);
    const nx = mx / len, ny = my / len;

    base = positions.length / 3;
    positions.push(x0, y0, half,  x1, y1, half,
                   x1, y1, -half, x0, y0, -half);
    normals.push(nx, ny, 0, nx, ny, 0, nx, ny, 0, nx, ny, 0);
    indices.push(base, base+1, base+2, base, base+2, base+3);
  }

  return pack(positions, normals, indices);
}

/** Star (10-point alternating inner/outer) */
function buildStar(outerR = 1.0, innerR = 0.42, points = 5, depth = 0.14) {
  const half = depth / 2;
  const positions = [];
  const normals = [];
  const indices = [];

  const totalPts = points * 2;
  const verts = [];
  for (let i = 0; i < totalPts; i++) {
    const a = (i / totalPts) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    verts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }

  // Top cap (fan)
  let base = 0;
  positions.push(0, 0, half); normals.push(0, 0, 1);
  for (const [x, y] of verts) { positions.push(x, y, half); normals.push(0, 0, 1); }
  for (let i = 0; i < totalPts; i++) {
    indices.push(base, base + 1 + i, base + 1 + (i + 1) % totalPts);
  }

  // Bottom cap (fan, reversed winding)
  base = positions.length / 3;
  positions.push(0, 0, -half); normals.push(0, 0, -1);
  for (const [x, y] of verts) { positions.push(x, y, -half); normals.push(0, 0, -1); }
  for (let i = 0; i < totalPts; i++) {
    indices.push(base, base + 1 + (i + 1) % totalPts, base + 1 + i);
  }

  // Sides
  for (let i = 0; i < totalPts; i++) {
    const [x0, y0] = verts[i];
    const [x1, y1] = verts[(i + 1) % totalPts];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const len = Math.sqrt(mx * mx + my * my) || 1;
    const nx = mx / len, ny = my / len;

    base = positions.length / 3;
    positions.push(x0, y0, half,  x1, y1, half,
                   x1, y1, -half, x0, y0, -half);
    normals.push(nx, ny, 0, nx, ny, 0, nx, ny, 0, nx, ny, 0);
    indices.push(base, base+1, base+2, base, base+2, base+3);
  }

  return pack(positions, normals, indices);
}

/** Shield shape (polygon approximation with 12 points) */
function buildShield(depth = 0.16) {
  // Approximated shield outline (normalized to [-1, 1])
  const shieldVerts = [
    [0, 1.0],
    [0.55, 0.9],
    [0.9, 0.5],
    [0.9, 0],
    [0.7, -0.5],
    [0.4, -0.8],
    [0, -1.05],
    [-0.4, -0.8],
    [-0.7, -0.5],
    [-0.9, 0],
    [-0.9, 0.5],
    [-0.55, 0.9],
  ];

  const n = shieldVerts.length;
  const half = depth / 2;
  const positions = [];
  const normals = [];
  const indices = [];

  // Top cap (fan from centroid)
  // Centroid
  let cx = 0, cy = 0;
  for (const [x, y] of shieldVerts) { cx += x; cy += y; }
  cx /= n; cy /= n;

  let base = 0;
  positions.push(cx, cy, half); normals.push(0, 0, 1);
  for (const [x, y] of shieldVerts) { positions.push(x, y, half); normals.push(0, 0, 1); }
  for (let i = 0; i < n; i++) {
    indices.push(base, base + 1 + i, base + 1 + (i + 1) % n);
  }

  // Bottom cap
  base = positions.length / 3;
  positions.push(cx, cy, -half); normals.push(0, 0, -1);
  for (const [x, y] of shieldVerts) { positions.push(x, y, -half); normals.push(0, 0, -1); }
  for (let i = 0; i < n; i++) {
    indices.push(base, base + 1 + (i + 1) % n, base + 1 + i);
  }

  // Sides
  for (let i = 0; i < n; i++) {
    const [x0, y0] = shieldVerts[i];
    const [x1, y1] = shieldVerts[(i + 1) % n];
    const ex = x1 - x0, ey = y1 - y0;
    const len = Math.sqrt(ex * ex + ey * ey) || 1;
    const nx = ey / len, ny = -ex / len;

    base = positions.length / 3;
    positions.push(x0, y0, half,  x1, y1, half,
                   x1, y1, -half, x0, y0, -half);
    normals.push(nx, ny, 0, nx, ny, 0, nx, ny, 0, nx, ny, 0);
    indices.push(base, base+1, base+2, base, base+2, base+3);
  }

  return pack(positions, normals, indices);
}

/** Diamond (rhombus / 4-point star shape extruded) */
function buildDiamond(depth = 0.16) {
  const verts = [
    [0,  1.15],
    [0.75, 0],
    [0, -1.15],
    [-0.75, 0],
  ];
  const n = 4;
  const half = depth / 2;
  const positions = [];
  const normals = [];
  const indices = [];

  // Top cap
  let base = 0;
  positions.push(0, 0, half); normals.push(0, 0, 1);
  for (const [x, y] of verts) { positions.push(x, y, half); normals.push(0, 0, 1); }
  for (let i = 0; i < n; i++) {
    indices.push(base, base + 1 + i, base + 1 + (i + 1) % n);
  }

  // Bottom cap
  base = positions.length / 3;
  positions.push(0, 0, -half); normals.push(0, 0, -1);
  for (const [x, y] of verts) { positions.push(x, y, -half); normals.push(0, 0, -1); }
  for (let i = 0; i < n; i++) {
    indices.push(base, base + 1 + (i + 1) % n, base + 1 + i);
  }

  // Sides
  for (let i = 0; i < n; i++) {
    const [x0, y0] = verts[i];
    const [x1, y1] = verts[(i + 1) % n];
    const ex = x1 - x0, ey = y1 - y0;
    const len = Math.sqrt(ex * ex + ey * ey) || 1;
    const nx = ey / len, ny = -ex / len;

    base = positions.length / 3;
    positions.push(x0, y0, half,  x1, y1, half,
                   x1, y1, -half, x0, y0, -half);
    normals.push(nx, ny, 0, nx, ny, 0, nx, ny, 0, nx, ny, 0);
    indices.push(base, base+1, base+2, base, base+2, base+3);
  }

  return pack(positions, normals, indices);
}

/** Pack loose arrays into typed arrays and compute bounding box */
function pack(posArr, normArr, idxArr) {
  const positions = new Float32Array(posArr);
  const normals   = new Float32Array(normArr);
  const indices   = new Uint32Array(idxArr);

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    if (positions[i]   < minX) minX = positions[i];
    if (positions[i]   > maxX) maxX = positions[i];
    if (positions[i+1] < minY) minY = positions[i+1];
    if (positions[i+1] > maxY) maxY = positions[i+1];
    if (positions[i+2] < minZ) minZ = positions[i+2];
    if (positions[i+2] > maxZ) maxZ = positions[i+2];
  }

  return { positions, normals, indices, min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

// ─── GLB writer ───────────────────────────────────────────────────────────────
/**
 * Builds a minimal GLB 2.0 buffer.
 * @param {object} geo - { positions, normals, indices, min, max }
 * @param {string} hexColor - e.g. '#c8860a'
 */
function buildGLB(geo, hexColor) {
  const [r, g, b] = hexToRgb(hexColor);

  const { positions, normals, indices, min, max } = geo;

  // ── BIN chunk layout ─────────────────────────────────────────────────────
  // Pad each buffer view to 4-byte boundary
  const pad4 = (n) => Math.ceil(n / 4) * 4;

  const posBytes  = positions.buffer;
  const normBytes = normals.buffer;
  const idxBytes  = indices.buffer;

  const posLen  = posBytes.byteLength;
  const normLen = normBytes.byteLength;
  const idxLen  = idxBytes.byteLength;

  const posOffset  = 0;
  const normOffset = pad4(posLen);
  const idxOffset  = normOffset + pad4(normLen);
  const binLen     = idxOffset  + pad4(idxLen);

  const binData = new Uint8Array(binLen);
  binData.set(new Uint8Array(posBytes),  posOffset);
  binData.set(new Uint8Array(normBytes), normOffset);
  binData.set(new Uint8Array(idxBytes),  idxOffset);

  // ── GLTF JSON ────────────────────────────────────────────────────────────
  const gltf = {
    asset: { version: '2.0', generator: 'badge-model-gen' },
    scene: 0,
    scenes:  [{ nodes: [0] }],
    nodes:   [{ mesh: 0 }],
    meshes:  [{
      name: 'badge',
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
        mode: 4, // TRIANGLES
      }],
    }],
    materials: [{
      name: 'badge_mat',
      pbrMetallicRoughness: {
        baseColorFactor: [r, g, b, 1.0],
        metallicFactor:  0.35,
        roughnessFactor: 0.25,
      },
      doubleSided: true,
    }],
    accessors: [
      // 0: positions (VEC3 float)
      {
        bufferView: 0, byteOffset: 0,
        componentType: 5126, // FLOAT
        count: positions.length / 3,
        type: 'VEC3',
        min: min, max: max,
      },
      // 1: normals (VEC3 float)
      {
        bufferView: 1, byteOffset: 0,
        componentType: 5126,
        count: normals.length / 3,
        type: 'VEC3',
      },
      // 2: indices (SCALAR uint32)
      {
        bufferView: 2, byteOffset: 0,
        componentType: 5125, // UNSIGNED_INT
        count: indices.length,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: posOffset,  byteLength: posLen,  target: 34962 }, // ARRAY_BUFFER
      { buffer: 0, byteOffset: normOffset, byteLength: normLen, target: 34962 },
      { buffer: 0, byteOffset: idxOffset,  byteLength: idxLen,  target: 34963 }, // ELEMENT_ARRAY_BUFFER
    ],
    buffers: [{ byteLength: binLen }],
  };

  // ── Encode JSON (padded to 4 bytes with spaces) ──────────────────────────
  let jsonStr = JSON.stringify(gltf);
  while (jsonStr.length % 4 !== 0) jsonStr += ' ';
  const jsonBytes = Buffer.from(jsonStr, 'utf8');

  // ── Assemble GLB ─────────────────────────────────────────────────────────
  // Header: 12 bytes
  // JSON chunk: 8 + jsonBytes.length
  // BIN chunk:  8 + binLen
  const totalLen = 12 + 8 + jsonBytes.length + 8 + binLen;
  const glb = Buffer.alloc(totalLen);
  let offset = 0;

  const write32 = (v) => { glb.writeUInt32LE(v, offset); offset += 4; };

  // Header
  write32(0x46546C67); // magic 'glTF'
  write32(2);          // version
  write32(totalLen);   // total length

  // JSON chunk
  write32(jsonBytes.length);
  write32(0x4E4F534A); // 'JSON'
  jsonBytes.copy(glb, offset); offset += jsonBytes.length;

  // BIN chunk
  write32(binLen);
  write32(0x004E4942); // 'BIN\0'
  Buffer.from(binData.buffer).copy(glb, offset);

  return glb;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });

const BUILDER = {
  circle:  () => buildCircle(),
  hexagon: () => buildHexagon(),
  star:    () => buildStar(),
  shield:  () => buildShield(),
  diamond: () => buildDiamond(),
};

let generated = 0;
for (const badge of BADGES) {
  const builder = BUILDER[badge.modelType] ?? BUILDER.circle;
  const geo = builder();
  const glb = buildGLB(geo, badge.color);
  const outPath = join(OUT_DIR, `${badge.id}.glb`);
  writeFileSync(outPath, glb);
  generated++;
  console.log(`✓ ${badge.id}.glb  (${(glb.length / 1024).toFixed(1)} KB)`);
}

console.log(`\nDone — ${generated} GLB files written to public/models/`);
