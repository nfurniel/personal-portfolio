import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { bakeSprites } from './runner-sprites'

/*
 * The offline runner on FurniBrowser's "no connection" page, kept bare:
 * no frame, no on-screen controls, one line saying how to start. Mini Nicolás stands on a short
 * stretch of ground; Space/↑ or a tap starts the run and jumps (hold for
 * higher), ↓ ducks under pop-ups. Bugs, node_modules crates and production
 * fires on the ground; the score sits top right, the record dimmed beside
 * it; a crash shows a restart icon.
 */

const HEIGHT = 200
const GROUND = 184
const HERO_X = 24
const GRAVITY = 0.0016
const JUMP_V = 0.6
const JUMP_CUT = 0.22
const START_SPEED = 0.34
const MAX_SPEED = 0.86
const ACCEL = 0.0000042
const BEST_KEY = 'nos-runner-best'
const INK = '#ecebf5'
const DIM = '#8f8cab'

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

const rand = (a, b) => a + Math.random() * (b - a)
// Touch screens have no "duck", so pop-ups there fly low (jump) or high (pass).
const canDuck = () => !window.matchMedia?.('(pointer: coarse)').matches

function freshGame() {
  return { speed: START_SPEED, dist: 0, y: 0, vy: 0, held: false, duck: false, obstacles: [], gap: 360, flash: 0, over: false }
}

function makeObstacle(score, x) {
  if (score > 180 && Math.random() < 0.28) {
    const lifts = canDuck() ? [16, 60, 92] : [16, 92]
    return { kind: 'popup', x, lift: lifts[Math.floor(Math.random() * lifts.length)], bob: rand(0, Math.PI * 2) }
  }
  const pool = ['bug', 'bug', 'crate', 'crate2', 'crate-wide', 'fire']
  return { kind: pool[Math.floor(Math.random() * pool.length)], x, lift: 0 }
}

// Footprint of an obstacle in screen pixels (crates can stack or sit side by side).
function sizeOf(o, s) {
  const crate = s.crate
  if (o.kind === 'crate2') return { w: crate.w, h: crate.h * 2 }
  if (o.kind === 'crate-wide') return { w: crate.w * 2, h: crate.h }
  const sprite = o.kind === 'fire' ? s.fire1 : s[o.kind]
  return { w: sprite.w, h: sprite.h }
}

export default function Runner({ autoFocus = false }) {
  const { t } = useI18n()
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const sprites = useRef(null)
  const width = useRef(600)
  const game = useRef(freshGame())
  const lastOver = useRef(0)
  const best = useRef(readBest())
  const [status, setStatus] = useState('idle') // idle | playing | paused | over

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const s = sprites.current
    const g = game.current
    if (!canvas || !s) return
    const ctx = canvas.getContext('2d')
    const W = width.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, W, HEIGHT)

    // Ground: just under the hero until the first run, then the whole width.
    const started = g.dist > 0 || g.over
    const groundW = started ? W : HERO_X + s.stand.w + 30
    ctx.fillStyle = DIM
    ctx.fillRect(0, GROUND, groundW, 1)
    if (started) {
      ctx.fillStyle = 'rgba(143, 140, 171, 0.55)'
      const off = g.dist % 40
      for (let x = -off; x < W; x += 40) {
        ctx.fillRect(Math.round(x), GROUND + 5, 3, 1)
        ctx.fillRect(Math.round(x + 17), GROUND + 9, 2, 1)
        ctx.fillRect(Math.round(x + 29), GROUND + 4, 4, 1)
      }
    }

    g.obstacles.forEach((o) => {
      const { h } = sizeOf(o, s)
      const x = Math.round(o.x)
      const bob = o.kind === 'popup' ? Math.round(Math.sin(o.bob) * 2) : 0
      const top = GROUND - o.lift - h + bob
      if (o.kind === 'crate2') {
        ctx.drawImage(s.crate.canvas, x, top)
        ctx.drawImage(s.crate.canvas, x, top + s.crate.h)
      } else if (o.kind === 'crate-wide') {
        ctx.drawImage(s.crate.canvas, x, top)
        ctx.drawImage(s.crate.canvas, x + s.crate.w, top)
      } else if (o.kind === 'fire') {
        ctx.drawImage((Math.floor(g.dist / 30) % 2 ? s.fire2 : s.fire1).canvas, x, top)
      } else {
        ctx.drawImage(s[o.kind].canvas, x, top)
      }
    })

    let hero = s.stand
    if (g.over) hero = s.dead
    else if (g.y > 0) hero = s.jump
    else if (g.duck) hero = Math.floor(g.dist / 36) % 2 ? s.duck2 : s.duck1
    else if (g.dist > 0) hero = Math.floor(g.dist / 36) % 2 ? s.run2 : s.run1
    ctx.drawImage(hero.canvas, HERO_X, Math.round(GROUND - g.y - hero.h))

    // Score (blinks on every 100) and, dimmed, the record. Only once running.
    if (started) {
      ctx.font = '22px VT323, monospace'
      ctx.textAlign = 'right'
      const pts = Math.floor(g.dist / 12)
      const blink = g.flash > 0 && Math.floor(g.flash / 120) % 2 === 0
      if (!blink) {
        ctx.fillStyle = INK
        ctx.fillText(String(pts).padStart(5, '0'), W - 4, 20)
      }
      if (best.current > 0) {
        ctx.fillStyle = DIM
        ctx.fillText(String(best.current).padStart(5, '0'), W - 64, 20)
      }
      ctx.textAlign = 'left'
    }

    if (g.over) {
      const icon = s.restart
      ctx.drawImage(icon.canvas, Math.round((W - icon.w) / 2), Math.round((GROUND - icon.h) / 2))
    }
  }, [])

  // Bake sprites, size the canvas, keep it sharp on resize.
  useEffect(() => {
    sprites.current = bakeSprites()
    const canvas = canvasRef.current
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width.current = canvas.clientWidth || 600
      canvas.width = Math.round(width.current * dpr)
      canvas.height = Math.round(HEIGHT * dpr)
      draw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [draw])

  // Take keyboard focus when the page appears, unless the user is elsewhere.
  useEffect(() => {
    if (!autoFocus) return
    const active = document.activeElement
    const shell = wrapRef.current?.closest('.os-window-shell')
    if (!active || active === document.body || shell?.contains(active)) {
      wrapRef.current?.focus({ preventScroll: true })
    }
  }, [autoFocus])

  // The loop.
  useEffect(() => {
    if (status !== 'playing') return
    let raf = 0
    let last = performance.now()
    const s = sprites.current

    const frame = (now) => {
      const dt = Math.min(now - last, 34)
      last = now
      const g = game.current
      const W = width.current

      g.speed = Math.min(MAX_SPEED, g.speed + ACCEL * dt)
      const before = Math.floor(g.dist / 12)
      g.dist += g.speed * dt
      const pts = Math.floor(g.dist / 12)
      if (Math.floor(pts / 100) > Math.floor(before / 100)) g.flash = 900
      g.flash = Math.max(0, g.flash - dt)

      // Release early for a short hop; ↓ mid-air drops faster.
      if (g.y > 0 || g.vy > 0) {
        if (!g.held && g.vy > JUMP_CUT) g.vy = JUMP_CUT
        g.vy -= GRAVITY * dt * (g.duck ? 3 : 1)
        g.y += g.vy * dt
        if (g.y <= 0) {
          g.y = 0
          g.vy = 0
        }
      }

      g.obstacles.forEach((o) => {
        o.x -= g.speed * dt * (o.kind === 'popup' ? 1.08 : 1)
        if (o.kind === 'popup') o.bob += dt * 0.008
      })
      g.obstacles = g.obstacles.filter((o) => o.x + sizeOf(o, s).w > -10)

      const lastObs = g.obstacles[g.obstacles.length - 1]
      if (!lastObs || lastObs.x < W - g.gap) {
        g.obstacles.push(makeObstacle(pts, W + 10))
        g.gap = rand(g.speed * 620 + 70, g.speed * 1150 + 150)
      }

      // Collision with slightly forgiving boxes.
      const hero = g.y > 0 ? s.jump : g.duck ? s.duck1 : s.run1
      const hx = HERO_X + 5
      const hw = hero.w - 10
      const htop = GROUND - g.y - hero.h + 4
      const hbot = GROUND - g.y - 2
      const hit = g.obstacles.some((o) => {
        const { w, h } = sizeOf(o, s)
        const ox = o.x + 4
        const otop = GROUND - o.lift - h + 4
        const obot = GROUND - o.lift - 2
        return hx < ox + w - 8 && hx + hw > ox && htop < obot && hbot > otop
      })

      if (hit) {
        g.over = true
        g.flash = 0
        lastOver.current = performance.now()
        if (pts > best.current) {
          best.current = pts
          try {
            localStorage.setItem(BEST_KEY, String(pts))
          } catch {
            /* storage unavailable: the record just won't persist */
          }
        }
        draw()
        setStatus('over')
        return
      }

      draw()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [status, draw])

  const jump = () => {
    if (status === 'over' && performance.now() - lastOver.current < 450) return
    if (status === 'paused') return setStatus('playing')
    if (status !== 'playing') {
      game.current = freshGame()
      setStatus('playing')
    }
    const g = game.current
    g.held = true
    if (g.y === 0 && !g.duck) g.vy = JUMP_V
  }
  const release = () => {
    game.current.held = false
  }
  const duck = (on) => {
    if (status === 'playing') game.current.duck = on
  }

  const onKeyDown = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault()
      if (!e.repeat) jump()
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault()
      duck(true)
    }
  }
  const onKeyUp = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') release()
    if (e.code === 'ArrowDown' || e.code === 'KeyS') duck(false)
  }

  return (
    <div
      ref={wrapRef}
      className="fb-runner"
      tabIndex={0}
      role="application"
      aria-label={t.nos.runner.label}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={() => status === 'playing' && setStatus('paused')}
      onPointerDown={(e) => {
        e.preventDefault()
        wrapRef.current?.focus({ preventScroll: true })
        jump()
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <canvas ref={canvasRef} className="fb-runner__canvas" style={{ height: HEIGHT }} aria-hidden="true" />
      {status === 'idle' && <p className="fb-runner__hint">{canDuck() ? t.nos.runner.start : t.nos.runner.startTouch}</p>}
    </div>
  )
}
