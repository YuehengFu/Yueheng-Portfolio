import { useEffect, useRef, useState } from 'react'
import { catFrame, FADED, PARALLAX } from './layout.js'
import { BOX, SCALE, visible, hidden, dots, ring, tris, outline, head, face } from './fallbackDrawing.js'
import { provideCat } from '../catCard.js'

const smoothstep = (x, a, b) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

// Is (x, y) inside any of the drawing's faces? 331 triangles, sign tests only.
function onFaces(x, y) {
  for (let i = 0; i < tris.length; i += 6) {
    const [ax, ay, bx, by, cx, cy] = [tris[i], tris[i + 1], tris[i + 2], tris[i + 3], tris[i + 4], tris[i + 5]]
    const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by)
    const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy)
    const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay)
    const neg = d1 < 0 || d2 < 0 || d3 < 0
    const pos = d1 > 0 || d2 > 0 || d3 > 0
    if (!(neg && pos)) return true
  }
  return false
}

// The resting pose as a line drawing, for browsers without WebGL (or when the
// scene fails). It stands exactly where the live cat would (same catFrame),
// takes the page ink through currentColor, and on narrow screens leaves with
// the hero and fades just like the live one.
export default function StaticCat() {
  const ref = useRef(null)
  const [view, setView] = useState(() => [window.innerWidth, window.innerHeight])
  const [hot, setHot] = useState(false)
  const frame = catFrame(view[0], view[1])

  useEffect(() => {
    const onResize = () => setView([window.innerWidth, window.innerHeight])
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (frame.wide) {
      el.style.transform = ''
      el.style.opacity = ''
      return
    }
    let raf = 0
    const place = () => {
      raf = 0
      const y = window.scrollY
      el.style.transform = `translate3d(0, ${-y * PARALLAX}px, 0)`
      el.style.opacity = String(1 - 0.9 * smoothstep(y, 24, 220))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(place)
    }
    place()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [frame.wide])

  // The cat card's questions, answered from the drawing's own geometry
  // (generated with it) and where the SVG sits right now.
  useEffect(() => {
    const shown = () => frame.wide || window.scrollY < FADED
    const scale = () => {
      const r = ref.current.getBoundingClientRect()
      return [r, r.width / BOX]
    }
    const toPage = (b, r, k) => ({
      left: r.left + b.left * k,
      right: r.left + b.right * k,
      top: r.top + b.top * k,
      bottom: r.top + b.bottom * k,
    })
    return provideCat({
      hit(x, y) {
        if (!ref.current || !shown()) return false
        const [r, k] = scale()
        return onFaces((x - r.left) / k, (y - r.top) / k)
      },
      outline() {
        if (!ref.current || !shown()) return null
        const [r, k] = scale()
        return {
          box: toPage(outline, r, k),
          head: { ...toPage(head, r, k), topX: r.left + head.topX * k },
          face: {
            left: r.left + face.left * k,
            leftY: r.top + face.leftY * k,
            right: r.left + face.right * k,
            rightY: r.top + face.rightY * k,
          },
        }
      },
      highlight: setHot,
    })
  }, [frame.wide])

  const side = frame.size / SCALE
  const px = BOX / side // one CSS pixel in viewBox units
  return (
    <svg
      ref={ref}
      className="static-cat"
      viewBox={`0 0 ${BOX} ${BOX}`}
      width={side}
      height={side}
      style={{ left: frame.x - side / 2, top: frame.y - side / 2 }}
      aria-hidden="true"
      focusable="false"
    >
      <path className="static-dots" d={dots} fill="currentColor" />
      {frame.wide && (
        <path d={ring} fill="none" stroke="currentColor" strokeWidth={px} strokeDasharray="1.6 1" opacity="0.1" />
      )}
      <path d={hidden} fill="none" stroke="currentColor" strokeWidth={px} strokeDasharray="0.9 1.2" opacity={hot ? 0.27 : 0.17} />
      <path d={visible} fill="none" stroke="currentColor" strokeWidth={(hot ? 1.7 : 1.2) * px} strokeLinecap="round" />
    </svg>
  )
}
