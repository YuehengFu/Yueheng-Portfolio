import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

// Storage can throw (private windows, blocked site data); every read and
// write goes through these, and the page works the same without them.
export function readStored(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
export function writeStored(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}

export function useMedia(query) {
  const subscribe = useCallback(
    (notify) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', notify)
      return () => mq.removeEventListener('change', notify)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')

const subscribeVisibility = (notify) => {
  document.addEventListener('visibilitychange', notify)
  return () => document.removeEventListener('visibilitychange', notify)
}
export const usePageVisible = () => useSyncExternalStore(subscribeVisibility, () => document.visibilityState !== 'hidden')

const THEME_COLOR = { dark: '#0d0d0c', light: '#f3f1ec' }
const currentTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

// index.html sets data-theme before first paint: a stored choice, else the
// system setting, else dark. This keeps React, the meta colour and storage in
// step, and follows the system setting until the visitor picks one.
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const follow = () => {
      if (readStored('theme')) return
      const next = mq.matches ? 'light' : 'dark'
      applyTheme(next)
      setTheme(next)
    }
    mq.addEventListener('change', follow)
    return () => mq.removeEventListener('change', follow)
  }, [])

  const toggle = useCallback(() => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    writeStored('theme', next)
    setTheme(next)
  }, [])

  return [theme, toggle]
}

// The footer's "pause the cat". Remembered, so a visitor who stopped the
// motion doesn't get it back on the next visit.
export function usePaused() {
  const [paused, setPaused] = useState(() => readStored('cat-paused') === '1')
  const toggle = useCallback(() => {
    setPaused((p) => {
      writeStored('cat-paused', p ? '0' : '1')
      return !p
    })
  }, [])
  return [paused, toggle]
}

let webgl
export function hasWebGL() {
  if (webgl !== undefined) return webgl
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    webgl = Boolean(gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext() // give the probe's context back
  } catch {
    webgl = false
  }
  return webgl
}
