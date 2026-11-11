import { useCallback, useEffect, useRef, useState } from 'react'
import { LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp } from 'react-icons/lu'
import { useI18n } from '../../i18n'

/*
 * snake.exe: the classic, in the OS colours (mint snake, pink food). Arrows/WASD (or the
 * on-screen pad / a swipe on touch) steer, Space starts and pauses. Walls
 * and your own tail end the run; it speeds up as you eat. The best score is
 * kept in this browser.
 */

const COLS = 18
const ROWS = 18
const SNAKE = '#6ef2b0'
const FOOD = '#ff9ffc'
const BG = '#0b0b12'
const BEST_KEY = 'nos-snake-best'
const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

function freshGame() {
  const snake = [
    { x: 7, y: 9 },
    { x: 6, y: 9 },
    { x: 5, y: 9 },
  ]
  return { snake, dir: DIRS.right, queue: [], food: placeFood(snake) }
}

function placeFood(snake) {
  for (;;) {
    const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p
  }
}

export default function Snake() {
  const { t } = useI18n()
  const s = t.nos.snake
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const game = useRef(freshGame())
  const swipe = useRef(null)
  const [status, setStatus] = useState('ready') // ready | playing | paused | over
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = canvas.clientWidth
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
    }
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const cell = size / COLS
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, size, size)

    // Dotted grid.
    ctx.fillStyle = 'rgba(236, 235, 245, 0.08)'
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) ctx.fillRect(x * cell + cell / 2 - 1, y * cell + cell / 2 - 1, 2, 2)
    }

    const { snake, food } = game.current
    // Food: a hollow square.
    ctx.strokeStyle = FOOD
    ctx.lineWidth = Math.max(1.5, cell * 0.12)
    ctx.strokeRect(food.x * cell + cell * 0.22, food.y * cell + cell * 0.22, cell * 0.56, cell * 0.56)
    // Snake: solid blocks, the tail fading slightly.
    snake.forEach((part, i) => {
      ctx.globalAlpha = i === 0 ? 1 : Math.max(0.45, 1 - i * 0.03)
      ctx.fillStyle = SNAKE
      const pad = i === 0 ? cell * 0.06 : cell * 0.12
      ctx.fillRect(part.x * cell + pad, part.y * cell + pad, cell - pad * 2, cell - pad * 2)
    })
    ctx.globalAlpha = 1
  }, [])

  // Redraw on resize (the window can be maximised or the OS go fullscreen).
  useEffect(() => {
    const canvas = canvasRef.current
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [draw])

  const turn = useCallback((name) => {
    const g = game.current
    const next = DIRS[name]
    const last = g.queue[g.queue.length - 1] ?? g.dir
    // No reversing into yourself, no stacking the same turn.
    if (next.x === -last.x && next.y === -last.y) return
    if (next.x === last.x && next.y === last.y) return
    if (g.queue.length < 3) g.queue.push(next)
  }, [])

  // The game loop: a self-scheduling timeout so speed can change as you eat.
  useEffect(() => {
    if (status !== 'playing') return
    let timer = 0
    const tick = () => {
      const g = game.current
      if (g.queue.length) g.dir = g.queue.shift()
      const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y }
      const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS
      const hitSelf = g.snake.some((p) => p.x === head.x && p.y === head.y)
      if (hitWall || hitSelf) {
        setStatus('over')
        draw()
        return
      }
      g.snake.unshift(head)
      if (head.x === g.food.x && head.y === g.food.y) {
        g.food = placeFood(g.snake)
        setScore((n) => {
          const next = n + 1
          setBest((b) => {
            if (next <= b) return b
            try {
              localStorage.setItem(BEST_KEY, String(next))
            } catch {
              /* storage unavailable: the record just won't persist */
            }
            return next
          })
          return next
        })
      } else {
        g.snake.pop()
      }
      draw()
      timer = setTimeout(tick, Math.max(65, 140 - (g.snake.length - 3) * 4))
    }
    timer = setTimeout(tick, 140)
    return () => clearTimeout(timer)
  }, [status, draw])

  const startOrPause = useCallback(() => {
    if (status === 'playing') {
      setStatus('paused')
    } else if (status === 'paused') {
      setStatus('playing')
    } else {
      game.current = freshGame()
      setScore(0)
      draw()
      setStatus('playing')
    }
    wrapRef.current?.focus({ preventScroll: true })
  }, [status, draw])

  const onKeyDown = (e) => {
    const dir = KEYS[e.code]
    if (dir) {
      e.preventDefault()
      if (status === 'ready' || status === 'over') startOrPause()
      turn(dir)
    } else if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      startOrPause()
    }
  }

  const onPointerDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e) => {
    const from = swipe.current
    swipe.current = null
    if (!from) return
    const dx = e.clientX - from.x
    const dy = e.clientY - from.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (status !== 'playing') return
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
  }

  const overlay = {
    ready: s.ready,
    paused: s.paused,
    over: s.over,
  }[status]

  return (
    <div
      ref={wrapRef}
      className="app-snake"
      tabIndex={0}
      data-autofocus
      onKeyDown={onKeyDown}
      onBlur={() => status === 'playing' && setStatus('paused')}
      aria-label={s.label}
    >
      <div className="app-snake__hud">
        <span>
          {s.score}: <b>{String(score).padStart(3, '0')}</b>
        </span>
        <span>
          {s.best}: <b>{String(best).padStart(3, '0')}</b>
        </span>
      </div>

      <div className="app-snake__board nos-screen" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <canvas ref={canvasRef} className="app-snake__canvas" aria-hidden="true" />
        {overlay && (
          <div className="app-snake__overlay">
            <p className="app-snake__msg">{overlay}</p>
            {status === 'over' && (
              <p className="app-dim">
                {s.score}: {score}
              </p>
            )}
            <button type="button" className="app-cta" onClick={startOrPause}>
              {status === 'paused' ? s.resume : status === 'over' ? s.again : s.play}
            </button>
          </div>
        )}
      </div>

      <div className="app-snake__pad" aria-hidden={status !== 'playing'}>
        <button type="button" onClick={() => turn('up')} aria-label={s.up} tabIndex={-1}>
          <LuArrowUp aria-hidden="true" />
        </button>
        <button type="button" onClick={() => turn('left')} aria-label={s.left} tabIndex={-1}>
          <LuArrowLeft aria-hidden="true" />
        </button>
        <button type="button" onClick={() => turn('down')} aria-label={s.down} tabIndex={-1}>
          <LuArrowDown aria-hidden="true" />
        </button>
        <button type="button" onClick={() => turn('right')} aria-label={s.right} tabIndex={-1}>
          <LuArrowRight aria-hidden="true" />
        </button>
      </div>

      <p className="app-dim app-snake__help">{s.controls}</p>
    </div>
  )
}
