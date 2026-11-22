// Draws the no-WebGL fallback: the cat in its still pose (three-quarter view,
// lifted off its shadow) as an SVG line drawing, from the same model, camera,
// pose and edge rules as the live scene. Visible edges solid, hidden edges
// dashed, the halftone shadow and the floor circle.
// Run: node scripts/make-fallback.mjs  ->  src/scene/fallbackDrawing.js
import { readFileSync, writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { CatLoader } from '../src/scene/CatLoader.js'
import { prepareGeometry } from '../src/scene/edges.js'
import { POSE } from '../src/scene/layout.js'

const { degToRad } = THREE.MathUtils
const BOX = 100 // viewBox units; the cat is SCALE of it tall
const SCALE = 0.7
const THRESHOLD = Math.cos(degToRad(POSE.edgeAngle))
const SAMPLES = 3 // hidden-line tests per edge; each third of an edge is judged on its own
const SPREAD = 1 - POSE.lift * 2.2 // the shadow tightens as the cat rises (as in CatRig)

const object = new CatLoader().parse(readFileSync(new URL('../public/models/meowmeow.obj', import.meta.url), 'utf8'))
const { geometry, loose } = prepareGeometry(object)
geometry.rotateY(POSE.restingYaw)
geometry.translate(0, POSE.lift, 0)
const yAxis = new THREE.Vector3(0, 1, 0)
const lifted = new THREE.Vector3(0, POSE.lift, 0)
const looseVecs = []
for (let i = 0; i < loose.length; i += 3) {
  looseVecs.push(new THREE.Vector3(loose[i], loose[i + 1], loose[i + 2]).applyAxisAngle(yAxis, POSE.restingYaw).add(lifted))
}
const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
mesh.updateMatrixWorld()

const elevation = degToRad(POSE.elevation)
const d = BOX / (2 * Math.tan(degToRad(POSE.fov / 2)) * BOX * SCALE)
const camera = new THREE.PerspectiveCamera(POSE.fov, 1, d * 0.3, d * 3)
camera.position.set(0, Math.sin(elevation) * d, Math.cos(elevation) * d)
camera.lookAt(0, POSE.lookY, 0)
camera.updateMatrixWorld()
camera.updateProjectionMatrix()

const toSvg = (v) => {
  const p = v.clone().project(camera)
  return [((p.x + 1) / 2) * BOX, ((1 - p.y) / 2) * BOX]
}
const f = (n) => n.toFixed(2)

// Is this point on the model seen from the camera, or is a face in front of it?
const raycaster = new THREE.Raycaster()
const dir = new THREE.Vector3()
function seen(point) {
  dir.subVectors(point, camera.position)
  const dist = dir.length()
  raycaster.set(camera.position, dir.normalize())
  const hit = raycaster.intersectObject(mesh)[0]
  return !hit || hit.distance > dist - 0.004
}

// Splits an edge into SAMPLES equal parts, tests each part at its middle, and
// merges neighbouring parts that agree. An edge that dips behind the ear is
// drawn solid where it shows and dashed where it doesn't, instead of being
// judged whole by its midpoint.
const visible = []
const hidden = []
function addEdge(p, q) {
  const parts = []
  for (let i = 0; i < SAMPLES; i++) {
    const show = seen(p.clone().lerp(q, (i + 0.5) / SAMPLES))
    const last = parts[parts.length - 1]
    if (last && last.show === show) last.to = (i + 1) / SAMPLES
    else parts.push({ show, from: i / SAMPLES, to: (i + 1) / SAMPLES })
  }
  for (const { show, from, to } of parts) {
    const [x1, y1] = toSvg(p.clone().lerp(q, from))
    const [x2, y2] = toSvg(p.clone().lerp(q, to))
    ;(show ? visible : hidden).push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`)
  }
}

// Feature edges: an edge with one face, or between faces that meet at more
// than the threshold angle (the rule EdgesGeometry applies live).
const pos = geometry.attributes.position
const key = (v) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
const edges = new Map()
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const c = new THREE.Vector3()
for (let i = 0; i < pos.count; i += 3) {
  a.fromBufferAttribute(pos, i)
  b.fromBufferAttribute(pos, i + 1)
  c.fromBufferAttribute(pos, i + 2)
  const normal = new THREE.Triangle(a, b, c).getNormal(new THREE.Vector3())
  for (const [p, q] of [
    [a, b],
    [b, c],
    [c, a],
  ]) {
    const k = [key(p), key(q)].sort().join('|')
    if (!edges.has(k)) edges.set(k, { p: p.clone(), q: q.clone(), normals: [] })
    edges.get(k).normals.push(normal)
  }
}
for (const { p, q, normals } of edges.values()) {
  const feature = normals.length === 1 || normals.some((x) => normals.some((y) => x.dot(y) < THRESHOLD))
  if (feature) addEdge(p, q)
}
for (let i = 0; i < looseVecs.length; i += 2) addEdge(looseVecs[i], looseVecs[i + 1]) // the whiskers

// The dot shadow: the same world-space grid and falloff as the shader, at the
// lifted cat's tighter radius.
const dots = []
const cell = 0.04
for (let i = -20; i <= 20; i++) {
  for (let j = -20; j <= 20; j++) {
    const x = (i + 0.5) * cell
    const z = (j + 0.5) * cell
    const r = Math.hypot(x / (0.4 * SPREAD), z / (0.3 * SPREAD))
    if (r > 1) continue
    const t = Math.min(Math.max((r - 0.1) / 0.9, 0), 1)
    const fill = 1 - t * t * (3 - 2 * t)
    const radius = 0.38 * Math.sqrt(fill) * cell
    if (radius < cell * 0.06) continue
    const [sx, sy] = toSvg(new THREE.Vector3(x, POSE.floor, z))
    const [ex] = toSvg(new THREE.Vector3(x + radius, POSE.floor, z))
    const w = ex - sx
    const h = w * 0.6 // the floor seen from 16 degrees up, a touch rounder than exact
    dots.push(`M${f(sx - w)} ${f(sy)}a${f(w)} ${f(h)} 0 1 0 ${f(2 * w)} 0a${f(w)} ${f(h)} 0 1 0 ${f(-2 * w)} 0`)
  }
}

// The floor circle (wide screens only, as in the live scene).
const ring = []
for (let i = 0; i <= 96; i++) {
  const t = (i / 96) * Math.PI * 2
  const [x, y] = toSvg(new THREE.Vector3(Math.cos(t) * 0.4, POSE.floor, Math.sin(t) * 0.4))
  ring.push(`${i ? 'L' : 'M'}${f(x)} ${f(y)}`)
}

const out = `// Generated by scripts/make-fallback.mjs. Do not edit by hand.
export const BOX = ${BOX}
export const SCALE = ${SCALE}
export const visible = ${JSON.stringify(visible.join(''))}
export const hidden = ${JSON.stringify(hidden.join(''))}
export const dots = ${JSON.stringify(dots.join(''))}
export const ring = ${JSON.stringify(ring.join(''))}
`
writeFileSync(new URL('../src/scene/fallbackDrawing.js', import.meta.url), out)
console.log(`visible ${visible.length}, hidden ${hidden.length}, dots ${dots.length}, ${out.length} bytes`)
