// Generates the site icons in public/ from one pixel design: the green
// prompt chevron on the page ground, in the site tokens (--green #3dff7a on
// --ground #07080c).
//   favicon.svg           16x16 vector, crisp at any tab size
//   favicon-32.png        32x32 for browsers that skip SVG icons
//   apple-touch-icon.png  180x180 for iOS home screens (iOS rounds the corners)
//   node scripts/make-icons.mjs

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const INK = [0x3d, 0xff, 0x7a, 255];
const GROUND = [0x07, 0x08, 0x0c, 255];

// The chevron on an 8x8 grid (each cell is 2px of the 16px favicon),
// centred: 4 cells wide, 7 tall.
const GRID = [
  "........",
  "..X.....",
  "...X....",
  "....X...",
  ".....X..",
  "....X...",
  "...X....",
  "..X.....",
];
// The grid is 8 rows for 7 lit ones, so the glyph sits half a cell high;
// this nudges it down 1px at 16px so it is centred exactly.
const NUDGE_16 = -1;

const cells = GRID.flatMap((row, y) => [...row].flatMap((c, x) => (c === "X" ? [[x, y]] : [])));

function svg() {
  const d = cells.map(([x, y]) => `M${x * 2} ${y * 2 + NUDGE_16}h2v2h-2Z`).join(" ");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges">` +
    `<rect width="16" height="16" fill="#07080c"/><path fill="#3dff7a" d="${d}"/></svg>\n`
  );
}

// size: output px; cell: px per grid cell; ox/oy: glyph offset of the grid.
function raster(size, cell, ox, oy) {
  const px = Array.from({ length: size }, () => Array(size).fill(GROUND));
  for (const [x, y] of cells)
    for (let dy = 0; dy < cell; dy++)
      for (let dx = 0; dx < cell; dx++) {
        const X = ox + x * cell + dx, Y = oy + y * cell + dy;
        if (X >= 0 && Y >= 0 && X < size && Y < size) px[Y][X] = INK;
      }
  return px;
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

// Opaque RGB PNG: iOS fills transparent touch icons with black anyway.
function png(px) {
  const H = px.length, W = px[0].length;
  const raw = Buffer.alloc((W * 3 + 1) * H);
  px.forEach((row, y) => row.forEach((c, x) => raw.set(c.slice(0, 3), y * (W * 3 + 1) + 1 + x * 3)));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const pub = new URL("../public/", import.meta.url);
writeFileSync(new URL("favicon.svg", pub), svg());
// 32px: the 16px design at exactly 2x.
writeFileSync(new URL("favicon-32.png", pub), png(raster(32, 4, 0, NUDGE_16 * 2)));
// 180px: 16px cells, so the 4x7 glyph is 64x112, centred with room for the
// iOS corner mask. Grid column 2 / row 1 is the glyph's top-left cell.
const CELL = 16;
const ox = Math.round((180 - 4 * CELL) / 2) - 2 * CELL;
const oy = Math.round((180 - 7 * CELL) / 2) - 1 * CELL;
writeFileSync(new URL("apple-touch-icon.png", pub), png(raster(180, CELL, ox, oy)));
console.log("wrote public/favicon.svg, favicon-32.png, apple-touch-icon.png");
