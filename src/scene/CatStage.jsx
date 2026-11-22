import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor.js'
import * as THREE from 'three'
import Cat from './Cat.jsx'
import StaticCat from './StaticCat.jsx'
import { POSE, WIDE, scrollAway } from './layout.js'
import { useMedia, usePageVisible } from '../hooks.js'

const readColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const isLight = () => document.documentElement.dataset.theme === 'light'

// A failed model fetch or a shader error: show the drawing instead.
class Fallback extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <StaticCat /> : this.props.children
  }
}

// One fixed, transparent canvas behind the page. It renders every frame only
// while the tab is visible, the cat is on screen, and the visitor has neither
// paused it nor asked for reduced motion. Otherwise it draws on demand (and
// holds the pose) or not at all.
export default function CatStage({ paused, reduced }) {
  const wide = useMedia(`(min-width: ${WIDE}px)`)
  const fine = useMedia('(hover: hover) and (pointer: fine)')
  const pageVisible = usePageVisible()
  const sentinel = useRef(null)
  const invalidate = useRef(null)
  const [onScreen, setOnScreen] = useState(true)
  const [away, setAway] = useState(() => scrollAway(window.innerWidth, window.innerHeight))
  const [maxDpr, setMaxDpr] = useState(1.5)
  const [ready, setReady] = useState(false)
  const [lost, setLost] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  // Shared, mutable inputs the frame loop reads; React never re-renders for them.
  const inputRef = useRef(null)
  if (inputRef.current === null) {
    inputRef.current = { px: 0, py: 0, scroll: window.scrollY, wide: window.innerWidth >= WIDE, lean: false, hover: false }
  }
  const colorsRef = useRef(null)
  if (colorsRef.current === null) {
    colorsRef.current = { bg: new THREE.Color(readColor('--bg')), ink: new THREE.Color(readColor('--ink')), light: isLight() }
  }

  // Narrow screens: the cat scrolls away with the hero. The sentinel spans the
  // page from the top to the scroll position where the cat's shadow leaves the
  // screen, so "the sentinel is visible" means "the cat is visible".
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const input = inputRef.current
    input.wide = wide
    input.lean = fine && !reduced
    if (!input.lean) {
      input.px = 0
      input.py = 0
    }
    invalidate.current?.()
  }, [wide, fine, reduced])

  useEffect(() => {
    const input = inputRef.current
    const colors = colorsRef.current
    const redraw = () => invalidate.current?.()
    const onScroll = () => {
      input.scroll = window.scrollY
      redraw()
    }
    const onResize = () => setAway(scrollAway(window.innerWidth, window.innerHeight))
    const onPointer = (e) => {
      if (e.pointerType !== 'mouse' || !input.lean) return
      input.px = (e.clientX / window.innerWidth) * 2 - 1
      input.py = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      input.px = 0
      input.py = 0
    }
    // The theme toggle flips data-theme on <html>; the rig eases toward it.
    const themeWatch = new MutationObserver(() => {
      colors.bg.set(readColor('--bg'))
      colors.ink.set(readColor('--ink'))
      colors.light = isLight()
      redraw()
    })
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      themeWatch.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const gone = !wide && !onScreen
  const mode = reduced ? 'still' : paused ? 'hold' : 'run'
  const frameloop = !pageVisible || gone ? 'never' : mode === 'run' ? 'always' : 'demand'

  // Entering 'demand' (paused, reduced, back on screen) needs one fresh frame.
  useEffect(() => {
    if (frameloop === 'demand') invalidate.current?.()
  }, [frameloop, mode])

  const onCreated = useCallback((state) => {
    invalidate.current = state.invalidate
    state.gl.domElement.addEventListener('webglcontextlost', () => setLost(true), { once: true })
  }, [])

  return (
    <>
      <div className="stage" data-gone={gone || undefined} data-ready={ready || undefined} aria-hidden="true">
        {lost ? (
          <StaticCat />
        ) : (
          <Fallback>
            <Canvas
              frameloop={frameloop}
              dpr={[1, maxDpr]}
              flat
              gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
              camera={{ fov: POSE.fov, position: [0, 0, 6] }}
              onCreated={onCreated}
            >
              <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
              <Suspense fallback={null}>
                <Cat inputRef={inputRef} colorsRef={colorsRef} mode={mode} onReady={onReady} />
              </Suspense>
            </Canvas>
          </Fallback>
        )}
      </div>
      <div ref={sentinel} className="cat-sentinel" style={{ height: wide ? 0 : away }} aria-hidden="true" />
    </>
  )
}
