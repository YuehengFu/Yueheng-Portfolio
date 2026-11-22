// Pixel shooter that runs inside the hero. The canvas is drawn at a low
// internal resolution (one canvas pixel = one "cell") and scaled up by CSS
// with image-rendering: pixelated, so every shape stays crisp and chunky.

import { createCrt } from "./crt";

// Original sprites, two animation frames each.
const SPRITES = {
  drone: [
    ["..XXXXX..", ".XXXXXXX.", "XX..X..XX", "XXXXXXXXX", ".X.X.X.X.", "X.......X"],
    ["..XXXXX..", ".XXXXXXX.", "XX.X.X.XX", "XXXXXXXXX", ".X.X.X.X.", ".X.....X."],
  ],
  jelly: [
    ["...XXX...", ".XXXXXXX.", "XX.XXX.XX", "XXXXXXXXX", "X.X.X.X.X", "X.X.X.X.X"],
    ["...XXX...", ".XXXXXXX.", "XXX.X.XXX", "XXXXXXXXX", ".X.X.X.X.", "X.X.X.X.X"],
  ],
  prism: [
    ["....X....", "...XXX...", "..XX.XX..", ".XXXXXXX.", "..X.X.X..", ".X.....X."],
    ["....X....", "...XXX...", "..X.X.X..", ".XXXXXXX.", "..X.X.X..", "X.......X"],
  ],
};
export const SHIP = ["....XXX....", "....XXX....", "..X.XXX.X..", ".XXXXXXXXX.", "XXX.XXX.XXX", "X...X.X...X"];
const ROW_KINDS = ["prism", "jelly", "drone"];
const ROW_POINTS = [150, 100, 50];

const toMask = (rows) => rows.map((r) => [...r].map((c) => c === "X"));
const MASKS = Object.fromEntries(
  Object.entries(SPRITES).map(([k, frames]) => [k, frames.map(toMask)])
);
const SHIP_MASK = toMask(SHIP);

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function readPalette(el) {
  const cs = getComputedStyle(el);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    bg: v("--ground", "#07080c"),
    green: v("--green", "#3dff7a"),
    amber: v("--amber", "#ffb43a"),
    red: v("--red", "#ff3d6e"),
    ink: v("--ink", "#e6efe8"),
    star: v("--line-strong", "#2f4a3c"),
  };
}

// Rasterize the name with the page's pixel font, then read back which font
// pixels are lit. Each lit pixel becomes one destructible brick.
//
// The face is an 8x8 bitmap font, so at 8px one font pixel is one canvas
// pixel. Drawn at that size, canvas anti-aliasing leaves a half-lit fringe
// between strokes one pixel apart, and a threshold on it bridges letters
// (E + H became a closed box, so "YUEHENG" read as "YUDHDNG"). Instead draw
// it SS times larger on whole-pixel coordinates and sample the centre of each
// font pixel, which reads the exact bitmap.
function rasterize(lines, family) {
  const fs = 8, SS = 4, pad = 4, lineStep = 12;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const font = `${fs * SS}px ${family}`;
  ctx.font = font;
  const widthOf = (l) => ctx.measureText(l).width / SS;
  const widest = Math.max(...lines.map(widthOf));
  const W = Math.ceil(widest) + pad * 2;
  const H = lines.length * lineStep + pad * 2;
  c.width = W * SS;
  c.height = H * SS;
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  lines.forEach((line, i) => {
    const x = pad + Math.round((widest - widthOf(line)) / 2);
    const y = pad + i * lineStep;
    ctx.fillText(line, x * SS, y * SS);
  });
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const half = SS >> 1;
  const lit = [];
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[((y * SS + half) * c.width + x * SS + half) * 4 + 3] > 127) {
        lit.push([x, y]);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  if (!lit.length) return { w: 0, h: 0, cells: [] };
  return {
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    cells: lit.map(([x, y]) => [x - minX, y - minY]),
  };
}

// below: { el, gap } is the HTML copy hung under the name (gap is its CSS
// offset from the name's bottom), so the name can keep it clear of the ship.
export function mountGame(canvas, { output, onHud, reducedMotion, fontFamily, hiScore = 0, below = null }) {
  const ctx = canvas.getContext("2d");
  let pal = readPalette(canvas);
  const crt = output ? createCrt(output, canvas, pal.bg) : null;
  canvas.parentElement?.toggleAttribute("data-crt", !!crt);

  // Geometry, rebuilt on resize.
  let cols = 0, rows = 0, P = 4, k = 1;
  let name = { x: 0, y: 0, s: 1, w: 0, h: 0, bricks: [], alive: null, flash: null, index: null };
  let stars = [];

  // World state.
  let mode = "demo"; // demo | play | over
  let score = 0, hi = hiScore, lives = 3, wave = 1;
  let fleet = null;
  let ship = { x: 0, y: 0, w: 11, h: 6, target: null, invuln: 0, dead: 0 };
  let bullets = [], bombs = [], particles = [];
  let fireCooldown = 0, bombTimer = 1, regenTimer = 0, lastBrickHit = 0;
  let demoTarget = 0, demoRetarget = 0, overTimer = 0, waveTimer = 0;
  let shake = 0, now = 0;

  const input = { left: false, right: false, fire: false, pointerFire: false };
  let running = false, raf = 0, last = 0;

  const emit = () => onHud?.({ mode, score, hi, lives, wave });

  function layout() {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;
    // Mid-game, a resize (rotation, devtools, window drag) keeps the run as it
    // is: same fleet, same damage to the name, shots rescaled, never a free
    // new fleet.
    const keep = mode === "play" && fleet && cols > 0 ? { cols, rows, P, name, fleet } : null;
    // Phones get a finer grid so the name's bricks stay distinct.
    P = cssW < 640 ? 2 : 4;
    cols = Math.ceil(cssW / P);
    rows = Math.ceil(cssH / P);
    canvas.width = cols;
    canvas.height = rows;
    k = P === 2 || cols >= 280 ? 2 : 1;

    // Name bricks.
    const lines = cols < 220 ? ["YUEHENG", "FU"] : ["YUEHENG FU"];
    const r = rasterize(lines, fontFamily);
    // Phones may use more of the width: at P=2 a factor of .94 lifts the
    // brick scale to 3 from about 358px up, which leaves room for the gap.
    const fill = P === 2 ? 0.94 : 0.86;
    let s = Math.max(1, Math.floor(Math.min((cols * fill) / r.w, (rows * 0.3) / r.h)));

    // The name is centred unless the HTML copy hung under it would run into
    // the ship; then it rides up. If that would squeeze the fleet below two
    // bands (short phones), the name steps down a size first, never below 2.
    const shipY = rows - 6 * k - Math.round(rows * 0.06);
    const reserve = below ? Math.ceil((below.el.offsetHeight + below.gap + 24) / P) : 0;
    const place = (sc) => Math.min(Math.round(rows * 0.5 - (r.h * sc) / 2), shipY - reserve - r.h * sc);
    const fleetFloor = (bands) => fleetTop() + bands * 6 * k + (bands - 1) * 5 * k + 6 * k;
    let y = place(s);
    while (y < fleetFloor(2) && s > 2) y = place(--s);
    y = Math.max(y, fleetFloor(1));
    const w = r.w * s, h = r.h * s;
    const x = Math.round((cols - w) / 2);
    const index = new Int32Array(r.w * r.h).fill(-1);
    r.cells.forEach(([cx, cy], i) => { index[cy * r.w + cx] = i; });
    const sameGrid = keep && keep.name.gw === r.w && keep.name.gh === r.h && keep.name.bricks.length === r.cells.length;
    name = {
      x, y, s, w, h, gw: r.w, gh: r.h,
      bricks: r.cells,
      alive: sameGrid ? keep.name.alive : new Uint8Array(r.cells.length).fill(1),
      flash: sameGrid ? keep.name.flash : new Float32Array(r.cells.length),
      index,
    };
    // Lets the HTML copy sit right under the name at any size.
    canvas.parentElement?.style.setProperty("--name-bottom", `${(y + h) * P}px`);

    stars = Array.from({ length: Math.round((cols * rows) / 700) }, () => ({
      x: Math.floor(rand(0, cols)),
      y: Math.floor(rand(0, rows)),
      t: rand(0, Math.PI * 2),
    }));

    const oldShipCenter = ship.x + ship.w / 2;
    ship.w = 11 * k;
    ship.h = 6 * k;
    ship.y = rows - ship.h - Math.round(rows * 0.06);
    if (!ship.x) ship.x = Math.round(cols / 2 - ship.w / 2);

    if (keep) {
      const sx = cols / keep.cols, sy = rows / keep.rows;
      ship.x = oldShipCenter * sx - ship.w / 2;
      if (ship.target != null) ship.target *= sx;
      if (P !== keep.P) {
        bullets = [];
        bombs = [];
      } else {
        for (const b of bullets) { b.x *= sx; b.y *= sy; }
        for (const m of bombs) { m.x *= sx; m.y *= sy; }
      }
      particles = [];
      refitFleet(keep.fleet, sx);
    } else {
      spawnFleet(false);
    }
    ship.x = clamp(ship.x, 0, cols - ship.w);
  }

  // Lay the fleet out for the new grid, carrying over the aliens that are
  // still alive. Each survivor maps to one slot (same band, same relative
  // column); bands that no longer fit are dropped, so a resize can only ever
  // remove targets, never add them.
  function refitFleet(old, sx) {
    const perRowOf = (f) => f.aliens.reduce((m, a) => Math.max(m, a.col + 1), 1);
    const oldPerRow = perRowOf(old);
    const { dir, frame, stepTimer, total } = old;
    spawnFleet(false);
    const perRow = perRowOf(fleet);
    const slots = new Map(fleet.aliens.map((a) => [`${a.band}:${a.col}`, a]));
    for (const a of fleet.aliens) a.alive = false;
    for (const a of old.aliens) {
      if (!a.alive) continue;
      const slot = slots.get(`${a.band}:${Math.floor((a.col * perRow) / oldPerRow)}`);
      if (slot) slot.alive = true;
    }
    Object.assign(fleet, { dir, frame, stepTimer, total });
    if (waveTimer <= 0 && !aliveAliens().length) waveTimer = 0.9;
    // Keep the fleet's place in its sweep, then make sure it is on screen.
    const live = fleet.aliens.filter((a) => a.alive);
    if (live.length) {
      const minX = Math.min(...live.map((a) => a.ox));
      const maxX = Math.max(...live.map((a) => a.ox + fleet.sw));
      fleet.x = clamp(Math.round(old.x * sx), 2 * k - minX, cols - 2 * k - maxX);
    }
  }

  // Where the fleet's first band sits (clear of the HUD).
  function fleetTop() {
    return Math.max(Math.round(rows * 0.13), 12 * k);
  }

  function spawnFleet(faster) {
    const sw = 9 * k, sh = 6 * k;
    const gapX = 6 * k, gapY = 5 * k;
    const perRow = clamp(Math.floor((cols * 0.62) / (sw + gapX)), 4, 11);
    const fleetW = perRow * (sw + gapX) - gapX;
    const top = fleetTop();
    // Keep the fleet clear of the name.
    const maxBottom = name.y - 6 * k;
    const rowCount = clamp(Math.floor((maxBottom - top + gapY) / (sh + gapY)), 1, 3);
    const aliens = [];
    for (let r = 0; r < rowCount; r++) {
      const band = 3 - rowCount + r;
      for (let c = 0; c < perRow; c++) {
        aliens.push({
          ox: c * (sw + gapX), oy: r * (sh + gapY), col: c,
          kind: ROW_KINDS[band], band, points: ROW_POINTS[band], alive: true,
        });
      }
    }
    if (faster) wave += 1;
    fleet = {
      x: Math.round((cols - fleetW) / 2), y: top, w: fleetW, sw, sh,
      dir: 1, frame: 0, stepTimer: 0, aliens, total: aliens.length,
    };
  }

  const aliveAliens = () => fleet.aliens.filter((a) => a.alive);

  function burst(x, y, color, n = 6) {
    if (reducedMotion) n = Math.min(n, 3);
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y, vx: rand(-40, 40) / P, vy: rand(-60, 10) / P,
        life: rand(0.25, 0.55), color,
      });
    }
  }

  function brickAt(px, py) {
    const gx = Math.floor((px - name.x) / name.s);
    const gy = Math.floor((py - name.y) / name.s);
    if (gx < 0 || gy < 0 || gx >= name.gw || gy >= name.gh) return -1;
    const i = name.index[gy * name.gw + gx];
    return i >= 0 && name.alive[i] ? i : -1;
  }

  function killBrick(i, byPlayer) {
    name.alive[i] = 0;
    lastBrickHit = now;
    const [bx, by] = name.bricks[i];
    burst(name.x + bx * name.s, name.y + by * name.s, pal.green, 3);
    if (byPlayer && mode === "play") { score += 1; emit(); }
  }

  function fire() {
    if (fireCooldown > 0 || ship.dead > 0) return;
    if (bullets.length >= 2) return;
    bullets.push({ x: ship.x + Math.floor(ship.w / 2), y: ship.y - 1 });
    fireCooldown = 0.26;
  }

  function hitShip() {
    if (ship.invuln > 0 || ship.dead > 0) return;
    burst(ship.x + ship.w / 2, ship.y + ship.h / 2, pal.green, 14);
    if (!reducedMotion) shake = 0.25;
    if (mode !== "play") { ship.invuln = 1; return; }
    lives -= 1;
    ship.dead = 0.9;
    ship.invuln = 2;
    if (lives <= 0) {
      mode = "over";
      overTimer = 2.6;
      if (score > hi) hi = score;
    }
    emit();
  }

  function update(dt) {
    now += dt;
    fireCooldown = Math.max(0, fireCooldown - dt);
    ship.invuln = Math.max(0, ship.invuln - dt);
    ship.dead = Math.max(0, ship.dead - dt);
    shake = Math.max(0, shake - dt);

    if (mode === "over") {
      overTimer -= dt;
      if (overTimer <= 0) toDemo();
    }

    // Ship movement.
    const speed = 380 / P;
    if (mode === "play") {
      let dx = 0;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;
      if (dx) {
        ship.target = null;
        ship.x += dx * speed * dt;
      } else if (ship.target != null) {
        const d = ship.target - (ship.x + ship.w / 2);
        ship.x += clamp(d, -speed * dt, speed * dt);
      }
      if (input.fire || input.pointerFire) fire();
    } else if (mode === "demo") {
      demoRetarget -= dt;
      const alive = aliveAliens();
      if (demoRetarget <= 0 && alive.length) {
        const a = alive[Math.floor(Math.random() * alive.length)];
        demoTarget = fleet.x + a.ox + fleet.sw / 2;
        demoRetarget = rand(0.9, 2.2);
      }
      const d = demoTarget - (ship.x + ship.w / 2);
      ship.x += clamp(d, -speed * 0.6 * dt, speed * 0.6 * dt);
      if (Math.abs(d) < 4 * k && Math.random() < dt * 2.2) fire();
    }
    ship.x = clamp(ship.x, 0, cols - ship.w);

    // Fleet march: steps get quicker as the fleet thins out.
    if (waveTimer > 0) {
      waveTimer -= dt;
      if (waveTimer <= 0) spawnFleet(true);
    } else {
      const alive = aliveAliens();
      const ratio = alive.length / fleet.total;
      const interval = Math.max(0.06, (0.5 - Math.min(wave - 1, 4) * 0.05) * (0.25 + ratio * 0.75));
      fleet.stepTimer += dt;
      if (fleet.stepTimer >= interval) {
        fleet.stepTimer = 0;
        fleet.frame ^= 1;
        let minX = Infinity, maxX = -Infinity;
        for (const a of alive) {
          minX = Math.min(minX, a.ox);
          maxX = Math.max(maxX, a.ox + fleet.sw);
        }
        const step = 2 * k;
        const next = fleet.x + fleet.dir * step;
        if (next + minX < 2 * k || next + maxX > cols - 2 * k) fleet.dir *= -1;
        else fleet.x = next;
      }

      // Bombs come from the lowest alien in a random column.
      bombTimer -= dt;
      if (bombTimer <= 0 && alive.length && mode !== "over") {
        const pick = alive[Math.floor(Math.random() * alive.length)];
        const lowest = alive
          .filter((a) => a.ox === pick.ox)
          .reduce((m, a) => (a.oy > m.oy ? a : m), pick);
        bombs.push({ x: fleet.x + lowest.ox + Math.floor(fleet.sw / 2), y: fleet.y + lowest.oy + fleet.sh, t: 0 });
        bombTimer = mode === "play" ? rand(0.5, 1.1) / Math.min(1 + (wave - 1) * 0.15, 1.6) : rand(0.8, 1.6);
      }
    }

    // Player bullets.
    const bSpeed = 560 / P;
    bullets = bullets.filter((b) => {
      const steps = Math.max(1, Math.ceil(bSpeed * dt));
      for (let i = 0; i < steps; i++) {
        b.y -= (bSpeed * dt) / steps;
        if (b.y < 0) return false;
        const bi = brickAt(b.x, b.y);
        if (bi >= 0) { killBrick(bi, true); return false; }
        if (waveTimer <= 0) {
          for (const a of fleet.aliens) {
            if (!a.alive) continue;
            const ax = fleet.x + a.ox, ay = fleet.y + a.oy;
            if (b.x >= ax && b.x < ax + fleet.sw && b.y >= ay && b.y < ay + fleet.sh) {
              a.alive = false;
              burst(ax + fleet.sw / 2, ay + fleet.sh / 2, [pal.red, pal.amber, pal.green][a.band], 8);
              if (mode === "play") {
                score += a.points;
                if (score > hi) hi = score;
                emit();
              }
              if (!aliveAliens().length) waveTimer = 0.9;
              return false;
            }
          }
        }
      }
      return true;
    });

    // Alien bombs.
    const mSpeed = 210 / P;
    bombs = bombs.filter((m) => {
      m.t += dt;
      const steps = Math.max(1, Math.ceil(mSpeed * dt));
      for (let i = 0; i < steps; i++) {
        m.y += (mSpeed * dt) / steps;
        if (m.y > rows) return false;
        const bi = brickAt(m.x, m.y);
        if (bi >= 0) { killBrick(bi, false); return false; }
        if (m.x >= ship.x && m.x < ship.x + ship.w && m.y >= ship.y && m.y < ship.y + ship.h) {
          hitShip();
          return false;
        }
      }
      return true;
    });

    // The name heals itself one brick at a time once the shooting stops.
    regenTimer -= dt;
    if (regenTimer <= 0 && now - lastBrickHit > 1.4) {
      regenTimer = 0.05;
      const dead = [];
      for (let i = 0; i < name.alive.length; i++) if (!name.alive[i]) dead.push(i);
      if (dead.length) {
        const i = dead[Math.floor(Math.random() * dead.length)];
        name.alive[i] = 1;
        name.flash[i] = 0.35;
      }
    }
    for (let i = 0; i < name.flash.length; i++) {
      if (name.flash[i] > 0) name.flash[i] = Math.max(0, name.flash[i] - dt);
    }

    particles = particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt * 4;
      p.y += p.vy * dt * 4;
      p.vy += (220 / P) * dt;
      return p.life > 0;
    });
  }

  function drawMask(mask, x, y, scale, color) {
    ctx.fillStyle = color;
    for (let r = 0; r < mask.length; r++) {
      const row = mask[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c]) ctx.fillRect(Math.round(x + c * scale), Math.round(y + r * scale), scale, scale);
      }
    }
  }

  function draw() {
    ctx.save();
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, cols, rows);
    if (shake > 0) ctx.translate(Math.round(rand(-1, 1) * k), Math.round(rand(-1, 1) * k));

    // Stars.
    for (const s of stars) {
      const tw = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now * 1.3 + s.t);
      ctx.fillStyle = tw > 0.85 ? pal.ink : pal.star;
      ctx.globalAlpha = 0.35 + tw * 0.5;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Name bricks, with a one-cell gap so they read as separate bricks. Phones
    // (P=2) always keep it, even at scale 2: without it the shader's bloom
    // runs neighbouring bricks together and letters merge.
    const gap = name.s >= 3 || (P === 2 && name.s === 2) ? 1 : 0;
    const size = name.s - gap;
    for (let i = 0; i < name.bricks.length; i++) {
      if (!name.alive[i]) continue;
      const [bx, by] = name.bricks[i];
      ctx.fillStyle = name.flash[i] > 0 ? pal.ink : pal.green;
      ctx.fillRect(name.x + bx * name.s, name.y + by * name.s, size, size);
    }

    // Fleet, tinted in bands the way coloured overlays tinted old cabinets.
    if (waveTimer <= 0) {
      const bandColor = [pal.red, pal.amber, pal.green];
      for (const a of fleet.aliens) {
        if (!a.alive) continue;
        drawMask(MASKS[a.kind][fleet.frame], fleet.x + a.ox, fleet.y + a.oy, k, bandColor[a.band]);
      }
    }

    // Ship blinks while invulnerable and vanishes briefly after a hit.
    const blink = ship.invuln > 0 && Math.floor(now * 12) % 2 === 0;
    if (ship.dead <= 0 && !blink && mode !== "over") drawMask(SHIP_MASK, ship.x, ship.y, k, pal.green);

    ctx.fillStyle = pal.ink;
    for (const b of bullets) ctx.fillRect(Math.round(b.x), Math.round(b.y), k, 3 * k);
    ctx.fillStyle = pal.red;
    for (const m of bombs) {
      const wiggle = Math.floor(m.t * 14) % 2 ? k : 0;
      ctx.fillRect(Math.round(m.x) - wiggle, Math.round(m.y), k, k);
      ctx.fillRect(Math.round(m.x) + (k - wiggle), Math.round(m.y) + k, k, k);
      ctx.fillRect(Math.round(m.x) - wiggle, Math.round(m.y) + 2 * k, k, k);
    }
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life * 3);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), k, k);
    }
    ctx.globalAlpha = 1;

    // Ground line.
    ctx.fillStyle = pal.green;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, ship.y + ship.h + 2 * k, cols, 1);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function present() {
    draw();
    crt?.render();
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    update(dt);
    present();
    raf = requestAnimationFrame(frame);
  }

  function resume() {
    if (running) return;
    // Reduced motion: no attract loop, only a still frame until someone plays.
    if (reducedMotion && mode === "demo") { present(); return; }
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // Held keys never see their keyup after alt-tab or a hidden tab, so drop
  // all held input whenever the loop stops or the window loses focus.
  function clearInput() {
    input.left = input.right = input.fire = input.pointerFire = false;
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    clearInput();
  }

  function toDemo() {
    mode = "demo";
    wave = 1;
    clearInput();
    ship.target = null;
    bombs = [];
    emit();
    if (reducedMotion) { pause(); present(); }
  }

  function play() {
    if (mode === "play") return;
    mode = "play";
    score = 0;
    lives = 3;
    wave = 1;
    bullets = [];
    bombs = [];
    ship.invuln = 1;
    ship.dead = 0;
    waveTimer = 0;
    spawnFleet(false);
    bombTimer = 1.2;
    emit();
    resume();
  }

  function refit() {
    pal = readPalette(canvas);
    crt?.setBackground(pal.bg);
    layout();
    if (!running) present();
  }
  const ro = new ResizeObserver(refit);
  ro.observe(canvas);
  // The copy can reflow on its own (Share Tech Mono swapping in, a text
  // zoom), which changes how much room the name must leave under it.
  if (below) ro.observe(below.el);
  layout();
  present();
  emit();

  return {
    play,
    quit: toDemo,
    resume,
    pause,
    clearInput,
    input,
    get mode() { return mode; },
    get hi() { return hi; },
    aimAt(cssX) { ship.target = cssX / P; },
    fire,
    // Re-rasterize the name, e.g. when the pixel font lands after the game
    // started with the fallback face.
    refit,
    destroy() { pause(); ro.disconnect(); crt?.destroy(); },
  };
}
