/**
 * Sovereign AI Workbench — Pure Node.js Raster PNG Generator
 * Creates valid raster PNG images for Gemma 3 4B Multimodal Benchmarking with zero external dependencies.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.resolve(__dirname, "../../tests/benchmark/gemma3/images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, "ascii");
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPng(width, height, drawFn) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB (3 bytes per pixel)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk("IHDR", ihdr);

  // Raw pixels: each row has 1 filter byte (0) + width * 3 bytes (RGB)
  const rawBytes = Buffer.alloc(height * (1 + width * 3));
  
  const getPixel = (x, y) => {
    return drawFn(x, y, width, height);
  };

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
    }
  }

  // Compress with deflate
  const compressed = zlib.deflateSync(rawBytes);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// 1. Equipment Photo / Inspection: HX-204 Heat Exchanger with red highlighted defect
function generateHx204Png() {
  const width = 640;
  const height = 480;
  const buf = createPng(width, height, (x, y) => {
    // Dark industrial background (slate)
    let r = 30, g = 41, b = 59;

    // Shell vessel body (cylinder: 100 <= x <= 540, 160 <= y <= 320)
    if (x >= 100 && x <= 540 && y >= 160 && y <= 320) {
      r = 71; g = 85; b = 105; // steel grey
      // highlight curve
      if (y >= 170 && y <= 190) { r = 100; g = 116; b = 139; }
    }

    // Nozzle 1 (x: 180..240, y: 110..160)
    if (x >= 180 && x <= 240 && y >= 110 && y <= 160) {
      r = 148; g = 163; b = 184;
    }

    // Nozzle 2 (x: 400..460, y: 110..160)
    if (x >= 400 && x <= 460 && y >= 110 && y <= 160) {
      r = 148; g = 163; b = 184;
    }

    // Flange rings (x: 100..120 or 520..540, y: 150..330)
    if ((x >= 90 && x <= 110 || x >= 530 && x <= 550) && y >= 150 && y <= 330) {
      r = 51; g = 65; b = 85;
    }

    // Red Defect Circle at (430, 240, r=40) - Corrosion Pitting Zone
    const dx = x - 430;
    const dy = y - 240;
    const distSq = dx * dx + dy * dy;
    if (distSq <= 40 * 40) {
      r = 239; g = 68; b = 68; // Bright red defect
      if (distSq <= 30 * 30 && (x + y) % 6 < 3) {
        r = 185; g = 28; b = 28; // Pitting texture
      }
    }

    // Warning Banner at top (y: 20..60)
    if (y >= 20 && y <= 60 && x >= 50 && x <= 590) {
      r = 15; g = 23; b = 42;
      if (x % 30 < 15) { r = 245; g = 158; b = 11; } // Amber stripes
    }

    return [r, g, b];
  });

  const outPath = path.join(IMAGES_DIR, "hx204_equipment.png");
  fs.writeFileSync(outPath, buf);
  console.log(`[PNG Generator] Created ${outPath} (${buf.length} bytes, ${width}x${height})`);
}

// 2. P&ID Drawing PNG
function generatePidPng() {
  const width = 640;
  const height = 480;
  const buf = createPng(width, height, (x, y) => {
    // Blueprint navy background
    let r = 15, g = 23, b = 42;

    // Grid lines every 40px
    if (x % 40 === 0 || y % 40 === 0) {
      r = 30; g = 41; b = 59;
    }

    // Main process pipe line (y: 200..206, x: 50..590) - Cyan
    if (y >= 200 && y <= 206 && x >= 50 && x <= 590) {
      r = 56; g = 189; b = 248;
    }

    // Isolation Valve HV-102 (Hourglass shape around x: 300..340, y: 180..226) - Orange
    if (x >= 300 && x <= 340 && y >= 180 && y <= 226) {
      const midX = 320;
      const relX = Math.abs(x - midX);
      const relY = Math.abs(y - 203);
      if (relX >= relY * 0.7) {
        r = 245; g = 158; b = 11;
      }
    }

    // Valve stem & actuator circle at (320, 150, r=16)
    const adx = x - 320;
    const ady = y - 150;
    if (adx * adx + ady * ady <= 16 * 16) {
      r = 245; g = 158; b = 11;
    }

    // Bypass loop: x: 180..460, y: 200..320
    if ((x === 180 || x === 181 || x === 460 || x === 461) && y >= 200 && y <= 320) {
      r = 148; g = 163; b = 184; // Grey pipe
    }
    if (y >= 319 && y <= 321 && x >= 180 && x <= 460) {
      r = 148; g = 163; b = 184;
    }

    // Safety relief valve at (500, 140, r=14) - Red
    const rdx = x - 500;
    const rdy = y - 140;
    if (rdx * rdx + rdy * rdy <= 14 * 14) {
      r = 239; g = 68; b = 68;
    }

    return [r, g, b];
  });

  const outPath = path.join(IMAGES_DIR, "pid_drawing.png");
  fs.writeFileSync(outPath, buf);
  console.log(`[PNG Generator] Created ${outPath} (${buf.length} bytes, ${width}x${height})`);
}

// 3. Scanned NDT Report Document Page PNG
function generateNdtDocumentPng() {
  const width = 600;
  const height = 800;
  const buf = createPng(width, height, (x, y) => {
    // White/Cream document paper background
    let r = 248, g = 250, b = 252;

    // Header bar (y: 40..80, x: 40..560)
    if (y >= 40 && y <= 80 && x >= 40 && x <= 560) {
      r = 30; g = 41; b = 59;
    }

    // Table border (x: 40..560, y: 120..600)
    if ((x === 40 || x === 560 || x === 200 || x === 380) && y >= 120 && y <= 600) {
      r = 100; g = 116; b = 139;
    }
    // Table row lines every 60px
    if (y >= 120 && y <= 600 && (y - 120) % 60 === 0) {
      r = 100; g = 116; b = 139;
    }

    // Critical Deficit Highlight in Row 3 (y: 240..300, x: 40..560) - Light Red fill
    if (y >= 240 && y <= 300 && x >= 40 && x <= 560) {
      r = 254; g = 226; b = 226;
    }

    // Simulated text lines inside rows (dark text bars)
    if (y % 60 >= 25 && y % 60 <= 35 && x >= 60 && x <= 180 && y >= 120 && y <= 600) {
      r = 30; g = 41; b = 59;
    }
    if (y % 60 >= 25 && y % 60 <= 35 && x >= 220 && x <= 340 && y >= 120 && y <= 600) {
      r = 30; g = 41; b = 59;
    }
    if (y % 60 >= 25 && y % 60 <= 35 && x >= 400 && x <= 520 && y >= 120 && y <= 600) {
      r = y >= 240 && y <= 300 ? 220 : 30; // Red text in deficit row
      g = y >= 240 && y <= 300 ? 38 : 41;
      b = y >= 240 && y <= 300 ? 38 : 59;
    }

    return [r, g, b];
  });

  const outPath = path.join(IMAGES_DIR, "ndt_report_page.png");
  fs.writeFileSync(outPath, buf);
  console.log(`[PNG Generator] Created ${outPath} (${buf.length} bytes, ${width}x${height})`);
}

generateHx204Png();
generatePidPng();
generateNdtDocumentPng();
console.log("All real raster PNG fixtures generated successfully!");
