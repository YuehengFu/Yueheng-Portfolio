import * as THREE from 'three'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { prepareGeometry, orderedEdges } from './edges.js'
import { makeFillMaterial, makeDotShadowMaterial } from './materials.js'
import { catFrame, PARALLAX, POSE } from './layout.js'

const { damp, clamp, smoothstep, degToRad } = THREE.MathUtils
const ELEVATION = degToRad(POSE.elevation)

// Entrance, in seconds of the rig's own clock.
const DRAW = 2.1 // edges appear in walk order from the ear tip
const LIFT_AT = 1.9 // the cat leaves its shadow as the last strokes land
const LIFT_FOR = 0.9
const ENTERED = LIFT_AT + LIFT_FOR

// Idle motion. A limited sway instead of a spin: the face or the three-quarter
// view always reads, and the back (which looks like an owl's bust) never shows.
const SWAY = [0.45, 0.42, 0.12, 0.17, 1.3] // a1, w1, a2, w2, phase2
const BOB = 0.045 // ±, on top of the lift; about a 7.4 s period
const BOB_RATE = 0.85
const ROLL = 0.025
const ROLL_RATE = 0.55
const LEAN = { yaw: 0.5, pitch: 0.14, rate: 2.5 } // fine pointers only

const COLOR_RATE = 14 // follows the page's 240 ms colour transition
const HOVER_RATE = 18 // the pointed-at ink settles in about 150 ms
const HOVER = { line: 0.5, hidden: 0.1, tone: 0.35 } // added at full hover
const SHADOW = { dark: 0.3, light: 0.34 }
const GUIDE = 0.1 // the dashed floor ellipse, wide screens only

const easeOutCubic = (x) => 1 - (1 - x) ** 3
const easeOutQuart = (x) => 1 - (1 - x) ** 4

// Everything three.js about the cat: the drawing (faces, visible and hidden
// edges, dot shadow, floor ellipse), its framing, and the per-frame motion.
// React mounts `root` and calls frame() and update(); nothing here allocates
// per frame.
export class CatRig {
  constructor(object) {
    const { geometry, loose } = prepareGeometry(object)
    const { positions, count } = orderedEdges(geometry, loose, POSE.edgeAngle)
    this.geometry = geometry
    this.count = count
    this.lines = new LineSegmentsGeometry().setPositions(positions)

    this.front = new LineMaterial({ linewidth: 1.2, transparent: true, depthWrite: false })
    this.hidden = new LineMaterial({
      linewidth: 1,
      transparent: true,
      depthWrite: false,
      dashed: true,
      dashSize: 0.01,
      gapSize: 0.014,
    })
    this.hidden.depthFunc = THREE.GreaterDepth // drawn only where the faces cover it
    this.fill = makeFillMaterial()
    this.shadow = makeDotShadowMaterial()

    const faces = new THREE.Mesh(geometry, this.fill)
    this.faces = faces
    const hiddenLines = new LineSegments2(this.lines, this.hidden)
    hiddenLines.computeLineDistances()
    hiddenLines.renderOrder = 1
    const frontLines = new LineSegments2(this.lines, this.front)
    frontLines.renderOrder = 2

    this.spin = new THREE.Group()
    this.spin.add(faces, hiddenLines, frontLines)
    this.lift = new THREE.Group()
    this.lift.add(this.spin)

    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), this.shadow)
    this.floor.rotation.x = -Math.PI / 2
    this.floor.position.y = POSE.floor

    // One construction line, as on a turntable drawing: the floor circle.
    const ring = []
    const R = 0.4
    for (let i = 0; i < 96; i++) {
      const a0 = (i / 96) * Math.PI * 2
      const a1 = ((i + 1) / 96) * Math.PI * 2
      ring.push(Math.cos(a0) * R, POSE.floor, Math.sin(a0) * R, Math.cos(a1) * R, POSE.floor, Math.sin(a1) * R)
    }
    this.ringLines = new LineSegmentsGeometry().setPositions(ring)
    this.guide = new LineMaterial({
      linewidth: 1,
      transparent: true,
      depthWrite: false,
      dashed: true,
      dashSize: 0.028,
      gapSize: 0.018,
    })
    this.ring = new LineSegments2(this.ringLines, this.guide)
    this.ring.computeLineDistances()
    this.ring.renderOrder = 3

    this.root = new THREE.Group()
    this.root.add(this.lift, this.floor, this.ring)

    // Picking: a stand-in for the faces that never renders, with both sides
    // hittable, so the test is the silhouette whatever the winding.
    this.pickMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    this.pick = new THREE.Mesh(geometry, this.pickMaterial)
    this.pick.matrixAutoUpdate = false
    this.raycaster = new THREE.Raycaster()
    this.hits = []
    this.ndc = new THREE.Vector2()
    this.v = new THREE.Vector3()
    this.hover = 0

    this.first = true
    this.t = 0 // motion clock: runs only while the cat is allowed to move
    this.te = 0 // entrance clock: the same, but finishes at once when held
    this.yaw = 0
    this.pitch = 0
    this.dim = 1
    this.shade = SHADOW.dark
    this.bg = new THREE.Color()
    this.ink = new THREE.Color()
    this.view = null
    this.viewKey = ''
  }

  // Camera distance and height for this viewport, so the cat stands at
  // catFrame()'s spot and size.
  frame(camera, width, height) {
    this.view = { ...catFrame(width, height), width, height }
    const d = height / (2 * Math.tan(degToRad(POSE.fov / 2)) * this.view.size)
    camera.fov = POSE.fov
    camera.near = d * 0.3
    camera.far = d * 3
    camera.position.set(0, Math.sin(ELEVATION) * d, Math.cos(ELEVATION) * d)
    camera.lookAt(0, POSE.lookY, 0)
    // Coarser dots on a small cat, so the halftone stays legible on a phone.
    this.shadow.uniforms.uCell.value = 0.04 * clamp(440 / this.view.size, 1, 1.6)
    this.viewKey = ''
    this.offset(camera, 0)
  }

  // A view offset moves the picture to the cat's spot without skewing the
  // perspective. On narrow screens the cat leaves a little slower than the page.
  offset(camera, scroll) {
    const v = this.view
    if (!v) return
    const y = v.wide ? v.y : v.y - scroll * PARALLAX
    const key = `${v.width} ${v.height} ${v.x} ${y}`
    if (key === this.viewKey) return
    this.viewKey = key
    camera.setViewOffset(v.width, v.height, v.width / 2 - v.x, v.height / 2 - y, v.width, v.height)
    camera.updateProjectionMatrix()
  }

  // Is this canvas point (CSS px) on the cat as it stands right now? Called
  // from pointer events, so it works when the loop is on demand or stopped:
  // the matrices are refreshed from the current pose first.
  hit(camera, x, y, width, height) {
    if (!this.view) return false
    this.root.updateMatrixWorld()
    camera.updateMatrixWorld()
    this.pick.matrixWorld.copy(this.faces.matrixWorld)
    this.ndc.set((x / width) * 2 - 1, 1 - (y / height) * 2)
    this.raycaster.setFromCamera(this.ndc, camera)
    this.hits.length = 0
    this.pick.raycast(this.raycaster, this.hits)
    return this.hits.length > 0
  }

  // The cat's on-screen box, its head's box and its face's side points (CSS
  // px), from the current pose: 1k vertex projections, run when the card opens.
  outline(camera, width, height) {
    if (!this.view) return null
    this.root.updateMatrixWorld()
    camera.updateMatrixWorld()
    const pos = this.geometry.attributes.position
    const m = this.faces.matrixWorld
    const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
    const head = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity, topX: 0 }
    const face = { left: Infinity, leftY: 0, right: -Infinity, rightY: 0 }
    for (let i = 0; i < pos.count; i++) {
      const my = pos.getY(i)
      const p = this.v.fromBufferAttribute(pos, i).applyMatrix4(m).project(camera)
      const x = ((p.x + 1) / 2) * width
      const y = ((1 - p.y) / 2) * height
      box.left = Math.min(box.left, x)
      box.right = Math.max(box.right, x)
      box.top = Math.min(box.top, y)
      box.bottom = Math.max(box.bottom, y)
      if (my < POSE.headY) continue
      head.left = Math.min(head.left, x)
      head.right = Math.max(head.right, x)
      head.bottom = Math.max(head.bottom, y)
      if (y < head.top) {
        head.top = y
        head.topX = x
      }
      if (my >= POSE.earY) continue
      if (x < face.left) {
        face.left = x
        face.leftY = y
      }
      if (x > face.right) {
        face.right = x
        face.rightY = y
      }
    }
    return { box, head, face }
  }

  // mode: 'run' (moving), 'hold' (paused: keep the pose), 'still' (reduced
  // motion: the resting three-quarter pose). Returns true while colours or
  // opacities are still easing, so an on-demand loop can ask for another frame.
  update({ camera, gl }, delta, input, colors, mode) {
    const dt = Math.min(delta, 0.05)
    if (this.first) {
      this.first = false
      this.bg.copy(colors.bg)
      this.ink.copy(colors.ink)
      this.shade = colors.light ? SHADOW.light : SHADOW.dark
    }
    this.offset(camera, input.scroll)

    if (mode === 'run') {
      this.t += dt
      this.te += dt
    } else {
      this.te = Math.max(this.te, ENTERED) // a held or still cat is fully drawn
    }

    // Theme: ease toward the page colours alongside the CSS transition.
    const k = 1 - Math.exp(-dt * COLOR_RATE)
    this.bg.lerp(colors.bg, k)
    this.ink.lerp(colors.ink, k)
    const shadeTarget = colors.light ? SHADOW.light : SHADOW.dark
    this.shade = damp(this.shade, shadeTarget, COLOR_RATE, dt)
    // On narrow screens the cat steps back once the text scrolls over it.
    const dimTarget = input.wide ? 1 : 1 - 0.9 * smoothstep(input.scroll, 24, 220)
    this.dim = damp(this.dim, dimTarget, 10, dt)
    // Pointed at (or its card is open): the ink comes forward a little.
    const hoverTarget = input.hover ? 1 : 0
    this.hover = damp(this.hover, hoverTarget, HOVER_RATE, dt)

    // Entrance: the pen draws the edges, then shading and shadow settle in,
    // then the cat rises off the floor.
    const p = clamp(this.te / DRAW, 0, 1)
    this.lines.instanceCount = Math.max(1, Math.ceil(easeOutCubic(p) * this.count))
    const settle = smoothstep(p, 0.45, 1)
    const rise = POSE.lift * easeOutQuart(clamp((this.te - LIFT_AT) / LIFT_FOR, 0, 1))

    // Idle: a limited sway, a slow bob above the shadow, a little roll.
    const t = this.t
    const still = mode === 'still'
    const bob = still ? 0 : BOB * smoothstep(this.te, LIFT_AT, ENTERED + 1.5) * Math.sin(t * BOB_RATE)
    const sway = still ? 0 : SWAY[0] * Math.sin(t * SWAY[1]) + SWAY[2] * Math.sin(t * SWAY[3] + SWAY[4])
    if (still) {
      this.yaw = 0
      this.pitch = 0
    } else if (mode === 'run') {
      this.yaw = damp(this.yaw, input.lean ? input.px * LEAN.yaw : 0, LEAN.rate, dt)
      this.pitch = damp(this.pitch, input.lean ? input.py * LEAN.pitch : 0, LEAN.rate, dt)
    }
    const height = rise + bob
    this.spin.rotation.y = POSE.restingYaw + sway + this.yaw
    this.lift.position.y = height
    this.lift.rotation.x = this.pitch
    this.lift.rotation.z = still ? 0 : Math.sin(t * ROLL_RATE) * ROLL

    // Ink.
    const hover = this.hover
    this.front.color.copy(this.ink)
    this.front.opacity = this.dim
    this.front.linewidth = 1.2 + HOVER.line * hover
    this.hidden.color.copy(this.ink)
    this.hidden.opacity = (0.17 + HOVER.hidden * hover) * settle * this.dim
    const fu = this.fill.uniforms
    fu.uBg.value.copy(this.bg)
    fu.uInk.value.copy(this.ink)
    fu.uTone.value = settle * this.dim * (1 + HOVER.tone * hover)
    fu.uDpr.value = gl.getPixelRatio()

    this.ring.visible = input.wide
    this.guide.color.copy(this.ink)
    this.guide.opacity = GUIDE * smoothstep(p, 0.7, 1) * this.dim

    // A higher cat casts a tighter, lighter shadow.
    const su = this.shadow.uniforms
    su.uInk.value.copy(this.ink)
    su.uOpacity.value = this.shade * settle * this.dim * (1 - height * 3)
    const spread = 1 - height * 2.2
    su.uRadius.value.set(0.4 * spread, 0.3 * spread)

    return (
      Math.abs(this.dim - dimTarget) > 0.002 ||
      Math.abs(this.hover - hoverTarget) > 0.002 ||
      Math.abs(this.shade - shadeTarget) > 0.001 ||
      !near(this.bg, colors.bg) ||
      !near(this.ink, colors.ink)
    )
  }

  dispose() {
    this.geometry.dispose()
    this.lines.dispose()
    this.ringLines.dispose()
    this.floor.geometry.dispose()
    for (const m of [this.front, this.hidden, this.guide, this.fill, this.shadow, this.pickMaterial]) m.dispose()
  }
}

const near = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 0.003
