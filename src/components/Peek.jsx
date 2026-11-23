import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getPeek, subscribePeek } from '../peek.js'
import { photos } from '../content.js'

const FOLLOW = 14 // how quickly the stack catches the pointer (1/s)
const SWING = 0.035 // degrees of tilt per px/s of sideways speed
const MAX_SWING = 9
const TILTS = [-5, 4, -1.5] // the prints fan out a little
const OFFSET = 28 // px from the pointer to the stack's near edge

// A stack of prints by the pointer while an experience row with photos is
// hovered. Decorative (the photos also appear, with alt text, in the
// scrapbook), so it's aria-hidden and ignores the pointer.
export default function Peek({ reduced }) {
  const peek = useSyncExternalStore(subscribePeek, getPeek)
  const ref = useRef(null)
  const list = peek.last

  useEffect(() => {
    const el = ref.current
    if (!el || !peek.list) return
    const target = { x: peek.x, y: peek.y }
    const pos = { x: peek.x, y: peek.y, swing: 0 }
    let prevX = pos.x
    let raf = 0
    let then = performance.now()

    const place = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      // To the right of the pointer, or the left near the screen's edge.
      const flip = pos.x + OFFSET + w > window.innerWidth - 12
      const x = flip ? pos.x - OFFSET - w : pos.x + OFFSET
      const y = Math.min(Math.max(pos.y - h / 2, 12), window.innerHeight - h - 12)
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${pos.swing}deg)`
    }
    const tick = (now) => {
      const dt = Math.min((now - then) / 1000, 0.05)
      then = now
      const k = 1 - Math.exp(-dt * FOLLOW)
      pos.x += (target.x - pos.x) * k
      pos.y += (target.y - pos.y) * k
      const speed = dt > 0 ? (pos.x - prevX) / dt : 0
      prevX = pos.x
      const goal = Math.max(-MAX_SWING, Math.min(MAX_SWING, speed * SWING))
      pos.swing += (goal - pos.swing) * (1 - Math.exp(-dt * 10))
      place()
      const settled = Math.abs(target.x - pos.x) < 0.3 && Math.abs(target.y - pos.y) < 0.3 && Math.abs(pos.swing) < 0.05
      raf = settled ? 0 : requestAnimationFrame(tick)
    }
    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      if (reduced) {
        pos.x = target.x
        pos.y = target.y
        place()
      } else if (!raf) {
        then = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    place()
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [peek, reduced])

  return (
    <div ref={ref} className="peek" data-open={peek.list ? '' : undefined} aria-hidden="true">
      {list?.map((key, i) => {
        const p = photos[key]
        return (
          <img
            key={key}
            className="peek-print"
            src={p.src}
            width={p.w}
            height={p.h}
            alt=""
            decoding="async"
            style={{ '--tilt': `${TILTS[i % TILTS.length]}deg`, '--i': i, zIndex: list.length - i }}
          />
        )
      })}
    </div>
  )
}
