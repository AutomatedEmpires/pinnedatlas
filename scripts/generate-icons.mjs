// Generates public/icon-192.png and public/icon-512.png with zero dependencies.
// Implements a minimal PNG encoder (RGBA, 8-bit, filter 0 per row) using
// node:zlib for the IDAT deflate stream and a hand-rolled CRC32.
//
// Run with: node scripts/generate-icons.mjs

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// PNG encoding
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

/** Encode raw RGBA pixels into a PNG buffer. */
function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace

  // Filter byte 0 (None) prepended to each scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Rasterizer — dark square with an emerald map pin (dark inner dot)
// ---------------------------------------------------------------------------

const BG = [12, 10, 9]; // #0c0a09
const EMERALD = [52, 211, 153]; // #34d399

/**
 * True when the sample point (x, y) — in pixel units for an s×s canvas — lies
 * on the emerald pin: head circle + downward triangle taper, minus the dark
 * inner dot punched from the head.
 */
function isPin(x, y, s) {
  const cx = s * 0.5;
  const cy = s * 0.38;
  const dx = x - cx;
  const dy = y - cy;
  const d2 = dx * dx + dy * dy;

  const innerR = s * 0.1;
  if (d2 <= innerR * innerR) return false; // hollow dark dot

  const headR = s * 0.22;
  if (d2 <= headR * headR) return true;

  // Triangle taper: base inside the head circle, tip pointing down.
  const baseY = s * 0.44;
  const tipY = s * 0.8;
  const halfBase = s * 0.16;
  if (y >= baseY && y <= tipY) {
    const half = (halfBase * (tipY - y)) / (tipY - baseY);
    if (Math.abs(dx) <= half) return true;
  }
  return false;
}

/** Render an s×s RGBA buffer with 3×3 supersampling for smooth edges. */
function render(s) {
  const rgba = Buffer.alloc(s * s * 4);
  const SUB = 3;
  const SAMPLES = SUB * SUB;
  for (let py = 0; py < s; py++) {
    for (let px = 0; px < s; px++) {
      let hits = 0;
      for (let j = 0; j < SUB; j++) {
        for (let i = 0; i < SUB; i++) {
          const sx = px + (i + 0.5) / SUB;
          const sy = py + (j + 0.5) / SUB;
          if (isPin(sx, sy, s)) hits++;
        }
      }
      const t = hits / SAMPLES;
      const o = (py * s + px) * 4;
      rgba[o] = Math.round(BG[0] + (EMERALD[0] - BG[0]) * t);
      rgba[o + 1] = Math.round(BG[1] + (EMERALD[1] - BG[1]) * t);
      rgba[o + 2] = Math.round(BG[2] + (EMERALD[2] - BG[2]) * t);
      rgba[o + 3] = 255;
    }
  }
  return rgba;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const scriptDir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(scriptDir, '..', 'public');
mkdirSync(publicDir, { recursive: true });

for (const size of [192, 512]) {
  const outPath = join(publicDir, `icon-${size}.png`);
  writeFileSync(outPath, encodePng(size, size, render(size)));
  const { size: bytes } = statSync(outPath);
  console.log(`wrote ${outPath} (${size}x${size}, ${bytes} bytes)`);
}
