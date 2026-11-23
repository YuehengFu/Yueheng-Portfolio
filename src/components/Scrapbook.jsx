import { useRef } from 'react'
import Section from './Section.jsx'
import { photos, prints } from '../content.js'
import { useReveal } from '../reveal.js'

// Prints scattered on a board, dropped in one after another when it scrolls
// into view. A mouse can drag them around (the one picked up comes to the
// front); a tap only brings a print forward, so a swipe still scrolls. The
// prints are in black and white; the one last reached for shows its colour.
export default function Scrapbook() {
  const board = useReveal()
  const top = useRef(prints.length)

  const onDown = (e) => {
    const el = e.currentTarget
    el.style.zIndex = String(++top.current)
    // The print last reached for keeps its colour.
    for (const p of board.current.querySelectorAll('[data-lit]')) p.removeAttribute('data-lit')
    el.setAttribute('data-lit', '')
    if (e.pointerType === 'touch' || e.button !== 0) return
    e.preventDefault()
    const box = board.current.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY }
    const dx0 = parseFloat(el.style.getPropertyValue('--dx')) || 0
    const dy0 = parseFloat(el.style.getPropertyValue('--dy')) || 0
    const cx = parseFloat(el.dataset.x) * box.width
    const cy = parseFloat(el.dataset.y) * box.height
    el.setPointerCapture(e.pointerId)
    el.setAttribute('data-held', '')

    const move = (ev) => {
      // Keep the print's centre on the board.
      const dx = Math.min(Math.max(dx0 + ev.clientX - start.x, -cx), box.width - cx)
      const dy = Math.min(Math.max(dy0 + ev.clientY - start.y, -cy), box.height - cy)
      el.style.setProperty('--dx', `${dx}px`)
      el.style.setProperty('--dy', `${dy}px`)
    }
    const up = () => {
      el.removeAttribute('data-held')
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  return (
    <Section id="scrapbook" label="scrapbook">
      <p className="board-hint" aria-hidden="true">
        drag them around
      </p>
      <div ref={board} className="board">
        {prints.map((p, i) => {
          const ph = photos[p.photo]
          return (
            <figure
              key={p.photo}
              className="print"
              data-x={p.x}
              data-y={p.y}
              style={{
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                width: `${p.w * 100}%`,
                zIndex: i + 1,
                '--r': `${p.r}deg`,
                '--i': i,
              }}
              onPointerDown={onDown}
            >
              <img src={ph.src} width={ph.w} height={ph.h} alt={ph.alt} loading="lazy" decoding="async" draggable="false" />
              <figcaption>{p.caption}</figcaption>
            </figure>
          )
        })}
      </div>
    </Section>
  )
}
