import { useEffect, useRef, useState } from 'react'
import CursorWave from '../components/cursor-wave'
import './page-backdrop.css'

const LIGHT = {
  bg: '#ffffff',
  colors: [
    '#3b82f6',
    '#7c3aed',
    '#06b6d4',
    '#22c55e',
    '#ec4899',
    '#f97316',
    '#0a0a0a',
    { stops: ['#3b82f6', '#7c3aed'] },
    { stops: ['#06b6d4', '#3b82f6'] },
    { stops: ['#7c3aed', '#ec4899'] },
  ],
}

const DARK = {
  bg: '#0a0a0a',
  colors: [
    '#a78bfa',
    '#7cff67',
    '#5227FF',
    '#22c55e',
    '#06b6d4',
    '#f97316',
    '#ffffff',
    { stops: ['#5227FF', '#a78bfa'] },
    { stops: ['#06b6d4', '#22c55e'] },
    { stops: ['#a78bfa', '#ec4899'] },
  ],
}

function readTheme() {
  if (typeof window === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') || 'light'
}

export default function PageBackdrop({ reduceMotion = false }) {
  const [theme, setTheme] = useState(readTheme)
  const wrapRef = useRef(null)

  useEffect(() => {
    const update = () => setTheme(readTheme())
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    return () => mo.disconnect()
  }, [])

  // Forward window-level pointer events to the cursor-wave root so the
  // wave reacts even when the mouse is over interactive content above.
  useEffect(() => {
    if (reduceMotion) return
    let dispatching = false
    const onMove = (e) => {
      if (dispatching) return
      const root = wrapRef.current?.querySelector('.cursor-wave-root')
      if (!root) return
      dispatching = true
      try {
        const synth = new PointerEvent('pointermove', {
          bubbles: true,
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType: 'mouse',
        })
        root.dispatchEvent(synth)
      } finally {
        dispatching = false
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduceMotion])

  if (reduceMotion) return null

  const palette = theme === 'dark' ? DARK : LIGHT

  return (
    <div className="page-backdrop" aria-hidden="true" ref={wrapRef}>
      <CursorWave
        width="100%"
        height="100%"
        backgroundColor={palette.bg}
        colors={palette.colors}
        cellSize={44}
        influenceRadiusVmin={26}
        attackTime={0.45}
        releaseTime={0.55}
        idleScale={0.08}
        minPeakScale={0.9}
        maxPeakScale={2.6}
        opacity={theme === 'dark' ? 0.7 : 0.55}
        dpr={1.5}
      />
      <div className="page-backdrop__fade" />
    </div>
  )
}
