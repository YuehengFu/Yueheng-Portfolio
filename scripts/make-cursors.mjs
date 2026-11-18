// Generates the pixel cursors in src/assets/cursors as crisp PNGs at 1x and
// 2x. Each design is a fill-only grid; the dark outline is derived from it so
// every cursor reads on light photos as well as the dark page.
//   node scripts/make-cursors.mjs

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const OUTLINE = [7, 8, 12, 255];
const SCALE = 2; // CSS pixels per art pixel

// X = fill, D = dark detail line inside the fill.
const designs = {
  arrow: {
    color: [61, 255, 122, 255],
    hot: [0, 0],
    grid: [
      "X..........",
      "XX.........",
      "XXX........",
      "XXXX.......",
      "XXXXX......",
      "XXXXXX.....",
      "XXXXXXX....",
      "XXXXXXXX...",
      "XXXXXXXXX..",
      "XXXXXXXXXX.",
      "XXXXXX.....",
      "XX.XXX.....",
      "X...XXX....",
      "....XXX....",
    ],
  },
  hand: {
    color: [255, 180, 58, 255],
    hot: [4.5, 0],
    grid: [
      "....XX.......",
      "....XX.......",
      "....XX.......",
      "....XX.......",
      "....XXDXX....",
      "....XXDXXDXX.",
      "XX..XXDXXDXXX",
      "XXX.XXXXXXXXX",
      ".XXXXXXXXXXXX",
      "..XXXXXXXXXXX",
      "..XXXXXXXXXXX",
      "...XXXXXXXXX.",
      "...XXXXXXXXX.",
      "....XXXXXXX..",
    ],
  },
  crosshair: {
    color: [228, 237, 230, 255],
    hot: [6, 6],
    grid: [
      "......X......",
      "......X......",
      "......X......",
      ".............",
      ".............",
      ".............",
      "XXX...X...XXX",
      ".............",
      ".............",
      ".............",
      "......X......",
      "......X......",
      "......X......",
    ],
  },
};

function rasterize({ grid, color }) {
  const w = grid[0].length + 2;
  const h = grid.length + 2;
  const px = Array.from({ length: h }, () => Array(w).fill(null));
  grid.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === "X") px[y + 1][x + 1] = color;
      if (c === "D") px[y + 1][x + 1] = OUTLINE;
    })
  );
  // Outline: every empty pixel touching a filled one, diagonals included.
  const filled = (x, y) => px[y]?.[x] && px[y][x] !== OUTLINE;
  const out = px.map((row) => row.slice());
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (px[y][x]) continue;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (filled(x + dx, y + dy)) out[y][x] = OUTLINE;
    }
  return { w, h, px: out };
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

function png({ w, h, px }, scale) {
  const W = w * scale, H = h * scale;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const c = px[Math.floor(y / scale)][Math.floor(x / scale)] || [0, 0, 0, 0];
      raw.set(c, y * (W * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const dir = new URL("../src/assets/cursors/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [name, design] of Object.entries(designs)) {
  const img = rasterize(design);
  writeFileSync(new URL(`${name}.png`, dir), png(img, SCALE));
  writeFileSync(new URL(`${name}@2x.png`, dir), png(img, SCALE * 2));
  // Hotspot in CSS pixels: art pixel + 1 for the outline padding, centred.
  const hx = Math.round((design.hot[0] + 1) * SCALE + SCALE / 2 - 1);
  const hy = Math.round((design.hot[1] + 1) * SCALE + SCALE / 2 - 1);
  console.log(`${name}: ${img.w * SCALE}x${img.h * SCALE}px, hotspot ${hx} ${hy}`);
}
