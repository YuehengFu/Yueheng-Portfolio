import { useEffect, useRef, useState } from 'react'
import { catFrame, PARALLAX } from './layout.js'
import { BOX, SCALE, visible, hidden, dots, ring } from './fallbackDrawing.js'

const smoothstep = (x, a, b) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

// The resting pose as a line drawing, for browsers without WebGL (or when the
// scene fails). It stands exactly where the live cat would (same catFrame),
// takes the page ink through currentColor, and on narrow screens leaves with
// the hero and fades just like the live one.
export default function StaticCat() {
  const ref = useRef(null)
  const [view, setView] = useState(() => [window.innerWidth, window.innerHeight])
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
      <path d={hidden} fill="none" stroke="currentColor" strokeWidth={px} strokeDasharray="0.9 1.2" opacity="0.17" />
      <path d={visible} fill="none" stroke="currentColor" strokeWidth={1.2 * px} strokeLinecap="round" />
    </svg>
  )
}
