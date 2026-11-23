import { useEffect, useRef } from 'react'

// One shared IntersectionObserver for things that animate in once: the
// scrapbook's prints. An element gets data-in when it first comes
// into view and keeps it, so nothing replays on the way back up.
let io = null

function observer() {
  if (io) return io
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.setAttribute('data-in', '')
        io.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
  return io
}

export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-in', '')
      return
    }
    const o = observer()
    o.observe(el)
    return () => {
      o.unobserve(el)
    }
  }, [])
  return ref
}
