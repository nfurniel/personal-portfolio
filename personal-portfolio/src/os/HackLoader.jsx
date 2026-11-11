import { useEffect, useRef, useState } from 'react'
import { LuLockKeyholeOpen, LuSkipForward } from 'react-icons/lu'
import './hack-loader.css'

/*
 * Boot screen for Nicolás OS, after the heist-movie "circuit breaker" hacking
 * screens: a cascade of ASCII behind, the owner's face rebuilt in ASCII from
 * his portrait (the image-to-characters technique of Award Components p207),
 * a segmented progress bar and an "entering…" band at the end, in the OS
 * accent colours.
 */

const RAIN_CHARS = '01<>/\\{}[]#$%&*+=-:;NICOLASFURNIELES'
// Columns cycle through the OS accents (blue, violet, pink, mint), dimmed.
const RAIN_COLORS = ['rgba(110, 168, 255, 0.5)', 'rgba(183, 155, 255, 0.5)', 'rgba(255, 159, 252, 0.45)', 'rgba(110, 242, 176, 0.42)']
// Sparse → dense; bright skin gets the dense glyphs on the dark screen.
const FACE_RAMP = " .'`^\",:;Il!i~+_-?][}{1)(|tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"
const SEGMENTS = 28
const DURATION = 3600 // ms to reach 100%
const GRANTED_HOLD = 1100

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------- ASCII rain (canvas, ~30 fps) ----------
function AsciiRain() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || reduceMotion()) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const size = 16
    let w = 0
    let h = 0
    let drops = []
    let raf = 0
    let last = 0

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${size}px VT323, ui-monospace, monospace`
      drops = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -h)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const frame = (t) => {
      raf = requestAnimationFrame(frame)
      if (t - last < 33) return
      last = t
      ctx.fillStyle = 'rgba(11, 11, 18, 0.22)'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < drops.length; i++) {
        const x = i * size
        const y = drops[i]
        const ch = RAIN_CHARS[(Math.random() * RAIN_CHARS.length) | 0]
        ctx.fillStyle = Math.random() > 0.96 ? '#ffffff' : RAIN_COLORS[i % RAIN_COLORS.length]
        ctx.fillText(ch, x, y)
        drops[i] = y > h + Math.random() * 400 ? Math.random() * -60 : y + size
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="hk-rain" aria-hidden="true" />
}

// ---------- Portrait → ASCII ----------
// The portrait has a painted backdrop, so pixels close to the corner colour
// are dropped and only the face, hair and suit are turned into characters.
function useAsciiPortrait(src, cols) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    img.onload = () => {
      if (cancelled) return
      // Head and collar only.
      const crop = { x: 0.14, y: 0, w: 0.72, h: 0.8 }
      const sx = img.naturalWidth * crop.x
      const sy = img.naturalHeight * crop.y
      const sw = img.naturalWidth * crop.w
      const sh = img.naturalHeight * crop.h
      const rowsCount = Math.round(cols * (sh / sw) * 0.5) // glyphs are ~2:1
      const canvas = document.createElement('canvas')
      canvas.width = cols
      canvas.height = rowsCount
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rowsCount)
      const data = ctx.getImageData(0, 0, cols, rowsCount).data

      const at = (x, y) => {
        const i = (y * cols + x) * 4
        return [data[i], data[i + 1], data[i + 2]]
      }
      const corners = [at(0, 0), at(cols - 1, 0), at(0, (rowsCount / 2) | 0), at(cols - 1, (rowsCount / 2) | 0)]
      const bg = [0, 1, 2].map((k) => corners.reduce((s, c) => s + c[k], 0) / corners.length)

      // Normalise the foreground's luminance (5th–95th percentile) so the
      // features use the whole ramp instead of a narrow band of it.
      const cells = []
      const lums = []
      for (let y = 0; y < rowsCount; y++) {
        for (let x = 0; x < cols; x++) {
          const [r, g, b] = at(x, y)
          const isBg = Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < 46
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          cells.push(isBg ? -1 : lum)
          if (!isBg) lums.push(lum)
        }
      }
      // Sharpen (pixel vs. its 3×3 neighbourhood) so eyes, nose and mouth
      // survive the drop to a few dozen columns.
      const sharp = cells.map((lum, i) => {
        if (lum < 0) return lum
        const x = i % cols
        const y = (i / cols) | 0
        let sum = 0
        let n = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const v = cells[(y + dy) * cols + (x + dx)]
            if (x + dx >= 0 && x + dx < cols && v !== undefined && v >= 0) {
              sum += v
              n++
            }
          }
        }
        return lum + (lum - sum / n) * 1.6
      })
      sharp.forEach((v, i) => {
        cells[i] = v
      })
      lums.length = 0
      cells.forEach((v) => v >= 0 && lums.push(v))
      lums.sort((a, b) => a - b)
      const lo = lums[Math.floor(lums.length * 0.05)] ?? 0
      const hi = lums[Math.floor(lums.length * 0.95)] ?? 1
      const span = Math.max(0.05, hi - lo)

      const out = []
      for (let y = 0; y < rowsCount; y++) {
        let line = ''
        for (let x = 0; x < cols; x++) {
          const lum = cells[y * cols + x]
          if (lum < 0) {
            line += ' '
            continue
          }
          const n = Math.min(1, Math.max(0, (lum - lo) / span)) ** 0.85
          line += FACE_RAMP[1 + Math.round(n * (FACE_RAMP.length - 2))]
        }
        out.push(line)
      }
      setRows(out)
    }
    return () => {
      cancelled = true
    }
  }, [src, cols])

  return rows
}

export default function HackLoader({ portrait, labels, onDone }) {
  const [progress, setProgress] = useState(0)
  const [granted, setGranted] = useState(false)
  const [cols] = useState(() => (window.innerWidth < 700 ? 62 : 100))
  const faceRows = useAsciiPortrait(portrait, cols)
  const doneRef = useRef(onDone)
  const skipRef = useRef(null)

  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    skipRef.current?.focus({ preventScroll: true })
  }, [])

  // Uneven progress: bursts and stalls read as "work" rather than a timer.
  useEffect(() => {
    const total = reduceMotion() ? 700 : DURATION
    const start = performance.now()
    let raf = 0
    let holdTimer = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / total)
      const eased = t + Math.sin(t * Math.PI * 5) * 0.035 * (1 - t)
      const value = Math.min(100, Math.max(0, Math.floor(eased * 100)))
      setProgress(value)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setGranted(true)
        holdTimer = setTimeout(() => doneRef.current(), reduceMotion() ? 300 : GRANTED_HOLD)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(holdTimer)
    }
  }, [])

  const statusIndex = Math.min(labels.loaderSteps.length - 1, Math.floor((progress / 100) * labels.loaderSteps.length))
  const filled = Math.round((progress / 100) * SEGMENTS)
  const visibleRows = faceRows ? Math.ceil((faceRows.length * Math.min(100, progress * 1.25)) / 100) : 0

  return (
    <div
      className={`hk${granted ? ' is-granted' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') doneRef.current()
      }}
    >
      <AsciiRain />
      <div className="hk-vignette" aria-hidden="true" />

      <p className="hk-title" aria-hidden="true">
        {labels.loaderTitle}
      </p>

      <div className="hk-center">
        <pre className="hk-face" aria-hidden="true">
          {faceRows
            ? faceRows.map((row, i) => (
                <span key={i} className={i < visibleRows ? 'is-on' : ''}>
                  {row + '\n'}
                </span>
              ))
            : null}
        </pre>

        <div className="hk-progress">
          <div
            className="hk-bar"
            role="progressbar"
            aria-label={labels.progressLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span key={i} className={i < filled ? 'is-on' : ''} style={{ '--i': i }} />
            ))}
          </div>
          <div className="hk-meta">
            <span className="hk-status">{granted ? labels.granted : labels.loaderSteps[statusIndex]}</span>
            <span className="hk-pct">{String(progress).padStart(3, '0')}%</span>
          </div>
        </div>
      </div>

      <div className="hk-band" aria-hidden={!granted}>
        <p className="hk-band__text" role="status">
          {granted && (
            <>
              <LuLockKeyholeOpen aria-hidden="true" />
              <span>
                {labels.entering}
                <span className="hk-dots" aria-hidden="true" />
              </span>
            </>
          )}
        </p>
      </div>

      <button ref={skipRef} type="button" className="hk-skip" onClick={() => doneRef.current()}>
        {labels.skip} <LuSkipForward aria-hidden="true" />
      </button>
    </div>
  )
}
