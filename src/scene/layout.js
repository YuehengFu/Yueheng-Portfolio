// Where the cat stands on screen, in CSS pixels. This is the one source of
// truth: the page CSS mirrors these numbers (--band, the 544px column, the
// 1120px container and its 48px gutter), so text and cat never claim the
// same space. Both the live scene and the no-WebGL drawing use catFrame().

export const WIDE = 1024 // px; at and above this the cat gets its own column
export const BAR = 56 // the top bar's height
export const PARALLAX = 0.7 // narrow screens: how fast the cat leaves with the page
export const FADED = 120 // narrow screens: px of scroll after which the cat has half faded and stops answering the pointer

const CONTAINER = 1120
const GUTTER = 48
const COLUMN = 544
const GAP = 64

export function catFrame(w, h) {
  if (w >= WIDE) {
    const container = Math.min(CONTAINER, w - GUTTER * 2)
    const left = (w - container) / 2
    const start = left + COLUMN + GAP
    const free = left + container - start
    return {
      wide: true,
      x: start + free / 2,
      y: h * 0.52,
      // model height in px: tall enough to hold the column, never past the bar
      size: Math.min(h * 0.6, free * 1.15),
    }
  }
  // Phone and tablet: the cat sits in a band above the intro (.hero padding).
  const band = bandHeight(w)
  return { wide: false, x: w / 2, y: BAR + band * 0.46, size: band * 0.68 }
}

// Tied to the width, not the height, so a phone's collapsing URL bar never
// resizes it. CSS: --band: clamp(260px, 78vw, 400px).
export function bandHeight(w) {
  return Math.min(Math.max(w * 0.78, 260), 400)
}

// Narrow screens: how far the page scrolls before the cat's shadow has left
// the top of the screen (it moves at PARALLAX times the page's speed).
export function scrollAway(w, h) {
  const f = catFrame(w, h)
  return f.wide ? Infinity : (f.y + f.size * 0.75) / PARALLAX
}

// The pose numbers the live rig and the generated drawing share.
export const POSE = {
  fov: 24,
  elevation: 16, // degrees the camera looks down
  lookY: -0.05,
  floor: -0.52, // the model is one unit tall, centred, so its feet are at -0.5
  restingYaw: -0.55, // a three-quarter view; also the still pose
  lift: 0.06, // how far the cat rises off its shadow after the draw-in
  edgeAngle: 20, // degrees between faces before their shared edge is drawn
  headY: 0.15, // model heights above this are the head (the cat card sits beside it)
  earY: 0.4, // and above this only the two ear tips; between the two is the face
}

// Wide screens: the right edge of the text column, which the cat card never
// crosses. Narrow screens have no cat column, so there is no edge.
export function textEdge(w) {
  if (w < WIDE) return 0
  const container = Math.min(CONTAINER, w - GUTTER * 2)
  return (w - container) / 2 + COLUMN
}
