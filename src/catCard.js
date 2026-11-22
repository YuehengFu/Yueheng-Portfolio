import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BAR, FADED, PARALLAX, WIDE, textEdge } from './scene/layout.js'

// The "about the cat" card. Whichever cat is on the page (the live scene or
// the SVG drawing) registers itself here with three things:
//   hit(x, y)     is this viewport point on the cat's silhouette right now?
//   outline()     its on-screen box and head box, or null when it's gone
//   highlight(on) ink it a touch stronger while it's pointed at
// The page canvas ignores the pointer, so the hit test runs from window
// events, against the cat's current pose, only when the pointer moves.
let cat = null
export function provideCat(target) {
  cat = target
  return () => {
    if (cat === target) cat = null
  }
}

export const CARD_ID = 'cat-card'
const OPEN_DELAY = 200 // ms on the cat before the card opens
const CLOSE_GRACE = 300 // ms to travel from the cat onto the card
const WARM = 400 // ms after closing during which it reopens at once
const TAP_SLOP = 10 // px a finger may move and still count as a tap
const EDGE = 16 // px the card keeps from the viewport edges
const GAP = 22 // px between the cat and the card; the leader spans it

// The page's own background, where pointing means pointing at the cat: not
// text, not a link or button, not the card. On wide screens the cat stands
// beside the column, so this is the page margin; on phones it's the band
// above the intro.
const isGround = (el) =>
  el === document.documentElement ||
  el === document.body ||
  (el instanceof Element && (el.id === 'root' || el.matches('.page, main, section')))

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), Math.max(lo, hi))

// Beside the head if there's room (never over the text column), clear of the
// ears, with the leader level with the nose or the back of the skull. Else
// above the head, else below the cat. Returns the card's spot, the leader's
// length and the scale origin (--ox, --oy): the leader's far end, so the card
// grows out of the cat.
function besideCat({ box, head, face }, w, h, vw, vh) {
  const minX = textEdge(vw) ? textEdge(vw) + 24 : EDGE
  const maxX = vw - EDGE - w
  const level = (y) => {
    const top = clamp(y - 26, BAR + 8, vh - EDGE - h) // the leader meets the card's first line
    return { y: top, oy: clamp(y - top, 12, h - 12) }
  }

  if (head.right + GAP <= maxX) {
    const x = head.right + GAP
    const len = Math.max(x - face.right - 6, 14)
    return { x, ...level(face.rightY), side: 'right', len, ox: -len - 1 }
  }
  if (head.left - GAP - w >= minX) {
    const x = head.left - GAP - w
    const len = Math.max(face.left - 6 - (x + w), 14)
    return { x, ...level(face.leftY), side: 'left', len, ox: w + len + 1 }
  }
  const len = GAP - 6
  const centre = clamp(head.topX - w / 2, minX, maxX)
  if (head.top - GAP - h >= BAR + 8) {
    const ox = clamp(head.topX - centre, 12, w - 12)
    return { x: centre, y: head.top - GAP - h, side: 'top', len, ox, oy: h + len + 1 }
  }
  const mid = clamp((box.left + box.right) / 2 - w / 2, minX, maxX)
  const ox = clamp((box.left + box.right) / 2 - mid, 12, w - 12)
  return { x: mid, y: Math.min(box.bottom + GAP, vh - EDGE - h), side: 'bottom', len, ox, oy: -len - 1 }
}

// Opened from the footer while the cat is off screen (phones): above the
// footer line that holds the button, or below the button when there's no room.
function besideButton(r, w, h, vw) {
  const x = clamp(r.left, EDGE, vw - EDGE - w)
  const above = r.top - 10 - h >= BAR + 8
  const y = above ? r.top - 10 - h : r.bottom + 10
  return { x, y, side: 'none', ox: r.left - x + 12, oy: above ? h + 10 : -10 }
}

// Everything the card needs: open state, where it sits, and the handlers.
// `source` says how it was opened: 'hover' closes when the pointer leaves;
// 'tap', 'click' and 'button' stay until a tap elsewhere, Escape, or (for the
// button) focus leaving the card.
export function useCatCard() {
  const [card, setCard] = useState({ open: false, source: null, place: null, instant: false })
  const cardRef = useRef(null)
  const creditRef = useRef(null)
  const live = useRef({ open: false, source: null, place: null, hot: false, openT: 0, closeT: 0, closedAt: -1e9 })

  const setHot = useCallback((hot) => {
    const s = live.current
    if (s.hot === hot) return
    s.hot = hot
    document.documentElement.toggleAttribute('data-cat-hot', hot)
    cat?.highlight(hot || (s.open && s.place?.side !== 'none'))
  }, [])

  const hide = useCallback(() => {
    const s = live.current
    clearTimeout(s.openT)
    clearTimeout(s.closeT)
    s.openT = s.closeT = 0
    if (!s.open) return
    s.open = false
    s.source = null
    s.closedAt = performance.now()
    cat?.highlight(s.hot)
    setCard((c) => ({ ...c, open: false, source: null }))
  }, [])

  const show = useCallback((source, instant = false) => {
    const s = live.current
    const el = cardRef.current
    clearTimeout(s.openT)
    clearTimeout(s.closeT)
    s.openT = s.closeT = 0
    if (!el) return
    if (s.open) {
      // Already showing (say, hovered, then clicked): keep it where it is.
      s.source = source
      setCard((c) => ({ ...c, source }))
      return
    }
    const w = el.offsetWidth
    const h = el.offsetHeight
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const shape = cat?.outline()
    let place
    if (shape) {
      place = besideCat(shape, w, h, vw, vh)
      place.follow = vw >= WIDE ? 0 : PARALLAX // the cat leaves phones at PARALLAX speed
    } else if (source === 'button' && creditRef.current) {
      const b = creditRef.current.getBoundingClientRect()
      const line = creditRef.current.parentElement.getBoundingClientRect()
      place = besideButton({ left: b.left, top: line.top, bottom: b.bottom }, w, h, vw)
      place.follow = 1
    } else return
    place.scroll = window.scrollY
    s.open = true
    s.source = source
    s.place = place
    cat?.highlight(s.hot || place.side !== 'none')
    setCard({ open: true, source, place, instant: instant || performance.now() - s.closedAt < WARM })
  }, [])

  // The fixed card rides along with whatever it's pinned to while the page
  // scrolls: the cat on phones, the footer button. Set here, not in render, so
  // scrolling never re-renders React.
  useLayoutEffect(() => {
    const el = cardRef.current
    if (el) el.style.translate = ''
  }, [card.place])

  useEffect(() => {
    const s = live.current
    const tap = { id: -1, x: 0, y: 0, t: 0 }
    let last = null // the mouse's last position, to re-test after a scroll

    const test = (target, x, y) => {
      const el = cardRef.current
      const onCard = Boolean(el && target instanceof Node && el.contains(target))
      const onCat = !onCard && isGround(target) && Boolean(cat?.hit(x, y))
      setHot(onCat)
      if (s.source && s.source !== 'hover') return
      if (onCat || onCard) {
        clearTimeout(s.closeT)
        s.closeT = 0
        if (!s.open && onCat && !s.openT) {
          const warm = performance.now() - s.closedAt < WARM
          if (warm) show('hover', true)
          else s.openT = setTimeout(() => show('hover'), OPEN_DELAY)
        }
      } else {
        clearTimeout(s.openT)
        s.openT = 0
        if (s.open && !s.closeT) s.closeT = setTimeout(hide, CLOSE_GRACE)
      }
    }

    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      last = { target: e.target, x: e.clientX, y: e.clientY }
      test(e.target, e.clientX, e.clientY)
    }
    const onLeave = () => {
      last = null
      test(null, -1, -1)
    }

    // Taps: a press and release in about the same place. A finger that
    // scrolls gets pointercancel instead, so scrolling never toggles the card,
    // and nothing here calls preventDefault, so it never blocks a scroll.
    const onDown = (e) => {
      if (!e.isPrimary) return
      tap.id = e.pointerId
      tap.x = e.clientX
      tap.y = e.clientY
      tap.t = performance.now()
    }
    const onUp = (e) => {
      if (e.pointerId !== tap.id) return
      tap.id = -1
      if (e.button > 0 || Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > TAP_SLOP) return
      if (performance.now() - tap.t > 700) return
      const el = cardRef.current
      if (el?.contains(e.target) || creditRef.current?.contains(e.target)) return
      const onCat = isGround(e.target) && Boolean(cat?.hit(e.clientX, e.clientY))
      if (onCat) {
        // A tap (or click) on the cat pins the card, or closes a pinned one.
        if (s.open && s.source !== 'hover') hide()
        else show(e.pointerType === 'mouse' ? 'click' : 'tap', s.open)
      } else if (s.open && s.source !== 'hover') hide()
    }
    const onCancel = (e) => {
      if (e.pointerId === tap.id) tap.id = -1
    }

    const onKey = (e) => {
      if (e.key !== 'Escape' || !s.open) return
      const inside = cardRef.current?.contains(document.activeElement)
      hide()
      if (inside || s.source === 'button') creditRef.current?.focus()
    }

    // Opened from the button: it closes once focus leaves both.
    const onFocusOut = () => {
      requestAnimationFrame(() => {
        if (s.source !== 'button' || !s.open) return
        const a = document.activeElement
        if (cardRef.current?.contains(a) || creditRef.current?.contains(a)) return
        if (a === document.body || a === null) return // a click on the page; onUp decides
        hide()
      })
    }

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (last) test(last.target, last.x, last.y) // the cat moved under a still mouse
        const el = cardRef.current
        const p = s.place
        if (!s.open || !el || !p || !p.follow) return
        const dy = (window.scrollY - p.scroll) * p.follow
        // On phones the card leaves with the cat: close once the head
        // passes under the bar, or the cat has faded.
        if (p.side !== 'none' && (p.y - dy < BAR || window.scrollY > FADED)) hide()
        else el.style.translate = `0 ${-dy}px`
      })
    }
    let width = window.innerWidth
    const onResize = () => {
      // A phone's URL bar changes only the height; that keeps the card.
      if (window.innerWidth !== width) hide()
      width = window.innerWidth
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onCancel, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('keydown', onKey)
    document.addEventListener('focusout', onFocusOut)
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('focusout', onFocusOut)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
      clearTimeout(s.openT)
      clearTimeout(s.closeT)
      document.documentElement.removeAttribute('data-cat-hot')
    }
  }, [hide, show, setHot])

  // The footer button. A keyboard press (click with detail 0) opens with no
  // animation: keyboard actions shouldn't wait on motion.
  const toggle = useCallback(
    (e) => {
      const s = live.current
      if (s.open && s.source === 'button') hide()
      else show('button', e.detail === 0)
    },
    [hide, show],
  )

  return { ...card, toggle, cardRef, creditRef }
}
