// Favicon generation script — run with: node scripts/gen-favicon.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "src", "app");

// ─── SVG design ──────────────────────────────────────────────────────────────
// ChapterOne brand favicon: open book on emerald green rounded square.
// Designed for clarity at 16×16 — two solid white page-shapes, green spine.
const SVG = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <!-- Rounded-square background -->
  <rect width="32" height="32" rx="7" fill="url(#bg)"/>
  <!-- Left page of open book -->
  <path d="M6 23 L6 11.5 C7.5 10.5 10.5 9.5 15 10 L15 22.5 C10.5 22 7.5 22.5 6 23Z" fill="white"/>
  <!-- Right page of open book (slightly dimmer = depth) -->
  <path d="M26 23 L26 11.5 C24.5 10.5 21.5 9.5 17 10 L17 22.5 C21.5 22 24.5 22.5 26 23Z" fill="white" fill-opacity="0.88"/>
  <!-- Spine (matches background, splits the two pages) -->
  <rect x="15" y="10" width="2" height="13" rx="0.5" fill="#059669"/>
</svg>`;

// ─── ICO builder (RFC-compliant, embeds PNG images) ──────────────────────────
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const HEADER = 6;
  const ENTRY = 16;
  let offset = HEADER + ENTRY * count;

  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = ICO
  header.writeUInt16LE(count, 4);

  const entries = pngBuffers.map((buf, i) => {
    const sz = sizes[i];
    const e = Buffer.alloc(ENTRY);
    e.writeUInt8(sz >= 256 ? 0 : sz, 0); // width  (0 = 256)
    e.writeUInt8(sz >= 256 ? 0 : sz, 1); // height (0 = 256)
    e.writeUInt8(0, 2);                   // palette
    e.writeUInt8(0, 3);                   // reserved
    e.writeUInt16LE(1, 4);                // planes
    e.writeUInt16LE(32, 6);               // bpp
    e.writeUInt32LE(buf.length, 8);       // data size
    e.writeUInt32LE(offset, 12);          // data offset
    offset += buf.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

// ─── Main ────────────────────────────────────────────────────────────────────
const svgBuf = Buffer.from(SVG);

// Write SVG
fs.writeFileSync(path.join(PUBLIC, "favicon.svg"), SVG);
console.log("✓ public/favicon.svg");

// PNG sizes
const targets = [
  { size: 16,  dest: [path.join(PUBLIC, "favicon-16x16.png")] },
  { size: 32,  dest: [path.join(PUBLIC, "favicon-32x32.png"), path.join(APP, "icon.png")] },
  { size: 180, dest: [path.join(PUBLIC, "apple-touch-icon.png"), path.join(APP, "apple-icon.png")] },
  { size: 192, dest: [path.join(PUBLIC, "icon-192.png")] },
  { size: 512, dest: [path.join(PUBLIC, "icon-512.png")] },
];

for (const { size, dest } of targets) {
  const buf = await sharp(svgBuf).resize(size, size).png().toBuffer();
  for (const d of dest) {
    fs.writeFileSync(d, buf);
    console.log(`✓ ${path.relative(ROOT, d)}`);
  }
}

// ICO (16 + 32 embedded)
const png16 = await sharp(svgBuf).resize(16, 16).png().toBuffer();
const png32 = await sharp(svgBuf).resize(32, 32).png().toBuffer();
const ico = buildIco([png16, png32], [16, 32]);

fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), ico);
fs.writeFileSync(path.join(APP, "favicon.ico"), ico);
console.log("✓ public/favicon.ico");
console.log("✓ src/app/favicon.ico");
console.log("\nAll favicon assets generated.");
