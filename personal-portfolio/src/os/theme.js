import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

/*
 * The Nicolás OS colour theme (dark by default, or light), kept outside
 * React: it lives in <html data-nos-theme>, is remembered in localStorage and
 * anything can subscribe to it (components through useNosTheme, Mini Nico and
 * the pixel cursors through onThemeChange).
 *
 * Switching with an origin element plays a pixel reveal: the new theme grows
 * out of that point in blocky steps. It uses the View Transitions API (the
 * new page is clipped by a stepped path); where that is missing, or with
 * reduced motion, the theme just changes.
 */

const KEY = 'nos-theme'
const listeners = new Set()

function read() {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

let theme = read()
if (typeof document !== 'undefined') document.documentElement.dataset.nosTheme = theme

export const getTheme = () => theme

export function onThemeChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useNosTheme() {
  return useSyncExternalStore(onThemeChange, getTheme, () => 'dark')
}

function apply(next) {
  theme = next
  document.documentElement.dataset.nosTheme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
  listeners.forEach((fn) => fn(next))
}

let busy = false

/** Change theme. `origin` (an element) is where the pixel reveal starts. */
export function setTheme(next, origin) {
  if (next === theme || busy) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!origin || reduce || !document.startViewTransition) {
    apply(next)
    return
  }
  const r = origin.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  const root = document.documentElement
  busy = true
  root.classList.add('nos-vt')
  const done = () => {
    busy = false
    root.classList.remove('nos-vt')
  }
  try {
    const vt = document.startViewTransition(() => flushSync(() => apply(next)))
    vt.ready
      .then(() => {
        root.animate(pixelFrames(x, y), {
          duration: 820,
          fill: 'forwards',
          pseudoElement: '::view-transition-new(root)',
        })
      })
      .catch(() => {})
    vt.finished.then(done, done)
  } catch {
    done()
    if (theme !== next) apply(next)
  }
}

// Cheap repeatable noise per cell, so the edge of the reveal looks dithered.
function noise(c, r) {
  const n = Math.sin(c * 127.1 + r * 311.7) * 43758.5453
  return n - Math.floor(n)
}

/*
 * Keyframes for the reveal: the screen is a grid of square cells and each
 * frame shows every cell whose (noisy) distance to the origin is under a
 * growing radius. Each frame is one clip path made of row runs.
 */
function pixelFrames(ox, oy) {
  const W = window.innerWidth
  const H = window.innerHeight
  const cell = Math.max(16, Math.min(40, Math.round(Math.max(W, H) / 42)))
  const cols = Math.ceil(W / cell)
  const rows = Math.ceil(H / cell)
  const band = cell * 4.5
  const dist = new Float32Array(cols * rows)
  let far = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = Math.hypot((c + 0.5) * cell - ox, (r + 0.5) * cell - oy) + noise(c, r) * band
      dist[r * cols + c] = d
      if (d > far) far = d
    }
  }
  const STEPS = 22
  const frames = [{ clipPath: 'path("M0 0h0v0z")', easing: 'step-end', offset: 0 }]
  for (let k = 1; k < STEPS; k++) {
    // Ease out: fast at the button, slower as it reaches the corners.
    const p = k / STEPS
    const limit = far * (1 - (1 - p) ** 1.6)
    let d = ''
    for (let r = 0; r < rows; r++) {
      let start = -1
      for (let c = 0; c <= cols; c++) {
        const on = c < cols && dist[r * cols + c] <= limit
        if (on && start < 0) start = c
        else if (!on && start >= 0) {
          d += `M${start * cell} ${r * cell}h${(c - start) * cell}v${cell}h${-(c - start) * cell}z`
          start = -1
        }
      }
    }
    frames.push({ clipPath: `path("${d || 'M0 0h0v0z'}")`, easing: 'step-end', offset: p })
  }
  frames.push({ clipPath: `path("M0 0h${cols * cell}v${rows * cell}h${-cols * cell}z")`, offset: 1 })
  return frames
}
