import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { LuLayoutGrid, LuPower, LuSmile, LuSquareDashed } from 'react-icons/lu'
import { useI18n } from '../i18n'
import { OSContext, windowKey } from './context'
import { DESKTOP } from './data'
import { APPS, appMeta } from './registry'
import { PixelIcon } from './icons'
import Window from './Window'
import Buddy from './buddy/Buddy'
import { useNosTheme } from './theme'
import './desktop.css'

const TASKBAR_H = 44
const GRID = { left: 14, top: 14, w: 112, h: 100 }
const FLOOR = { desktop: 10, compact: 72 } // room under the icons (on phones, Mini Nico's corner)

// The animated wallpaper (React Bits Pro "Glyph Tide", three.js) is only
// downloaded on desktop; phones get a still one.
const GlyphTide = lazy(() => import('../components/react-bits/glyph-tide'))
const TIDE = {
  dark: { colors: ['#5227FF', '#FF9FFC', '#6ea8ff'], backgroundColor: '#0b0b12', brightness: 0.85 },
  light: { colors: ['#6a45d6', '#c0399f', '#2f5fd0'], backgroundColor: '#efece3', brightness: 1 },
}

function useClock(locale) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20000)
    return () => clearInterval(id)
  }, [])
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(now)
}

// Lets a long file name wrap only before its extension: "trayectoria" / ".log".
function fileLabel(name) {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return name
  return (
    <>
      {name.slice(0, dot)}
      <wbr />
      {name.slice(dot)}
    </>
  )
}

// Where a new window goes (centred, cascaded) and the point it grows from.
function computeLayout(desktop, from, count, def) {
  const W = desktop.clientWidth
  const H = desktop.clientHeight - TASKBAR_H
  const width = Math.min(def.width, Math.round(W * 0.92))
  const height = def.height ? Math.min(def.height, Math.round(H * 0.9)) : undefined
  const step = count % 6
  const left = Math.max(12, Math.min(W - width - 12, Math.round((W - width) / 2) + (step - 2) * 28))
  const top = Math.max(12, Math.round(H * (def.height ? 0.03 : 0.05)) + step * 24)
  let origin = '50% 20%'
  if (from) {
    const d = desktop.getBoundingClientRect()
    const r = from.getBoundingClientRect()
    origin = `${r.left + r.width / 2 - d.left - left}px ${r.top + r.height / 2 - d.top - top}px`
  }
  return { left, top, width, height, origin }
}

/* ---------- Desktop icon grid ---------- */

function gridFor(size, compact) {
  const W = size.w
  const H = size.h - TASKBAR_H
  const cellW = compact ? Math.floor((W - 12) / 3) : GRID.w
  const cellH = compact ? 96 : GRID.h
  const left = compact ? 6 : GRID.left
  const cols = compact ? 3 : Math.max(1, Math.floor((W - left) / cellW))
  const rows = Math.max(1, Math.floor((H - GRID.top - (compact ? FLOOR.compact : FLOOR.desktop)) / cellH))
  return { cellW, cellH, left, top: GRID.top, cols, rows }
}

// Default slots: down the left in columns on desktop, rows of three on phones.
function defaultSlots(grid, compact) {
  return Object.fromEntries(
    DESKTOP.map((app, i) => [
      app,
      compact ? { c: i % 3, r: Math.floor(i / 3) } : { c: Math.floor(i / grid.rows), r: i % grid.rows },
    ]),
  )
}

const storeKey = (compact) => `nos-icons-v1${compact ? '-m' : ''}`
function readSlots(compact) {
  try {
    return JSON.parse(localStorage.getItem(storeKey(compact)) || 'null')
  } catch {
    return null
  }
}
function saveSlots(compact, slots) {
  try {
    localStorage.setItem(storeKey(compact), JSON.stringify(slots))
  } catch {
    /* storage unavailable: positions just won't persist */
  }
}

const BUDDY_KEY = 'nos-buddy'
function readBuddy() {
  try {
    return localStorage.getItem(BUDDY_KEY) !== 'off'
  } catch {
    return true
  }
}

// Nearest free cell to (c, r), ignoring the icon being placed.
function nearestFree(slots, app, c, r, grid) {
  const taken = new Set(
    Object.entries(slots)
      .filter(([k]) => k !== app)
      .map(([, s]) => `${s.c}:${s.r}`),
  )
  let best = null
  for (let cc = 0; cc < grid.cols; cc++) {
    for (let rr = 0; rr < grid.rows; rr++) {
      if (taken.has(`${cc}:${rr}`)) continue
      const d = (cc - c) ** 2 + (rr - r) ** 2
      if (!best || d < best.d) best = { c: cc, r: rr, d }
    }
  }
  return best ? { c: best.c, r: best.r } : { c, r }
}

export default function Desktop({ labels, locale, compact, onShutdown, onToggleFullscreen }) {
  const { t } = useI18n()
  const startRef = useRef(null)
  const menuRef = useRef(null)
  const suppressClick = useRef(false)
  // The desktop element, kept in state (not a ref) because layout reads it.
  const [desktopEl, setDesktopEl] = useState(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  // Windows render in the order they were opened (re-sorting them would move
  // DOM nodes mid-drag); stacking lives in `stack` and only drives z-index.
  const [open, setOpen] = useState([]) // [{ key, app, params, layout }]
  const [stack, setStack] = useState([]) // keys, back → front
  const [menuOpen, setMenuOpen] = useState(false)
  const [slots, setSlots] = useState(() => readSlots(compact))
  const [drag, setDrag] = useState(null) // { app, dx, dy }
  const [buddyOn, setBuddyOn] = useState(readBuddy)
  const time = useClock(locale)
  const theme = useNosTheme()
  const tideRef = useRef(null)
  const n = t.nos

  // Track the desktop size: the icon grid depends on it.
  useEffect(() => {
    if (!desktopEl) return
    const measure = () => setSize({ w: desktopEl.clientWidth, h: desktopEl.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(desktopEl)
    return () => ro.disconnect()
  }, [desktopEl])

  const grid = useMemo(() => (size.w ? gridFor(size, compact) : null), [size, compact])

  // Saved slots, falling back to defaults (and pulled back inside the grid).
  const placed = useMemo(() => {
    if (!grid) return null
    const base = defaultSlots(grid, compact)
    const inGrid = (s) => ({ c: Math.min(s.c, grid.cols - 1), r: Math.min(s.r, grid.rows - 1) })
    const out = {}
    // Icons the user has placed keep their cell; the rest (a new app, say)
    // take their default one, or the nearest free cell if it is taken.
    for (const app of DESKTOP) if (slots?.[app]) out[app] = inGrid(slots[app])
    for (const app of DESKTOP) {
      if (out[app]) continue
      const want = inGrid(base[app])
      out[app] = nearestFree(out, app, want.c, want.r, grid)
    }
    return out
  }, [grid, slots, compact])

  const raise = useCallback(
    (key) => setStack((keys) => (keys[keys.length - 1] === key ? keys : [...keys.filter((k) => k !== key), key])),
    [],
  )

  const os = useMemo(() => {
    const api = {
      compact,
      open(app, params = {}, { focus = true, from = null } = {}) {
        const key = windowKey(app, params)
        // A nonce lets an already-open app react (the browser opens a tab).
        const withNonce = { ...params, nonce: Date.now() }
        setOpen((list) => {
          if (list.some((w) => w.key === key)) {
            return list.map((w) => (w.key === key ? { ...w, params: withNonce } : w))
          }
          const layout = { ...computeLayout(desktopEl, from, list.length, APPS[app]), focus }
          return [...list, { key, app, params: withNonce, layout }]
        })
        raise(key)
        setMenuOpen(false)
      },
      close(key) {
        setOpen((list) => list.filter((w) => w.key !== key))
        setStack((keys) => keys.filter((k) => k !== key))
      },
      closeAll() {
        setOpen([])
        setStack([])
      },
      resetIcons() {
        setSlots(null)
        try {
          localStorage.removeItem(storeKey(compact))
        } catch {
          /* nothing to clear */
        }
      },
      shutdown: onShutdown,
      toggleFullscreen: onToggleFullscreen,
    }
    return api
  }, [compact, desktopEl, onShutdown, onToggleFullscreen, raise])

  // The terminal needs to know what is open right now.
  const ctx = useMemo(() => ({ ...os, isOpen: (key) => open.some((w) => w.key === key) }), [os, open])
  const isOpen = ctx.isOpen

  // Welcome note on boot (not on phones, where it would cover everything).
  const welcomed = useRef(false)
  useEffect(() => {
    if (!desktopEl || welcomed.current) return
    welcomed.current = true
    if (!compact) os.open('readme', {}, { focus: false })
  }, [desktopEl, compact, os])

  // The wallpaper sits behind everything, so hand it the pointer: its wake
  // follows the cursor across icons and windows too.
  useEffect(() => {
    if (!desktopEl || compact) return
    const forward = (e) => {
      const node = tideRef.current?.firstElementChild
      if (!node || !e.isTrusted) return
      node.dispatchEvent(new PointerEvent(e.type, { clientX: e.clientX, clientY: e.clientY }))
    }
    const opts = { passive: true }
    desktopEl.addEventListener('pointermove', forward, opts)
    desktopEl.addEventListener('pointerdown', forward, opts)
    desktopEl.addEventListener('pointerleave', forward, opts)
    return () => {
      desktopEl.removeEventListener('pointermove', forward)
      desktopEl.removeEventListener('pointerdown', forward)
      desktopEl.removeEventListener('pointerleave', forward)
    }
  }, [desktopEl, compact])

  // Start menu: close on outside click or Esc.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !startRef.current?.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        startRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Dragging icons: past a few pixels a press becomes a drag; on release the
  // icon snaps to the nearest free cell and the layout is saved.
  const onIconPointerDown = (e, app) => {
    if (e.button !== 0 || !grid || !placed) return
    const start = { x: e.clientX, y: e.clientY }
    let last = null
    const move = (ev) => {
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      if (!last && Math.hypot(dx, dy) < 6) return
      if (!last) document.documentElement.classList.add('nos-dragging')
      last = { dx, dy }
      setDrag({ app, dx, dy })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      document.documentElement.classList.remove('nos-dragging')
      setDrag(null)
      if (!last) return
      // Swallow the click that ends the drag (and only that one: if none
      // follows, the flag must not eat the next real click).
      suppressClick.current = true
      setTimeout(() => (suppressClick.current = false), 80)
      const from = placed[app]
      const c = Math.round((from.c * grid.cellW + last.dx) / grid.cellW)
      const r = Math.round((from.r * grid.cellH + last.dy) / grid.cellH)
      const clamped = { c: Math.max(0, Math.min(grid.cols - 1, c)), r: Math.max(0, Math.min(grid.rows - 1, r)) }
      const next = { ...placed, [app]: nearestFree(placed, app, clamped.c, clamped.r, grid) }
      setSlots(next)
      saveSlots(compact, next)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const topKey = stack[stack.length - 1]

  return (
    <OSContext.Provider value={ctx}>
      <div ref={setDesktopEl} className={`os-desktop${compact ? ' is-compact' : ''}`} role="region" aria-label={labels.desktop}>
        <div ref={tideRef} className="os-wall" aria-hidden="true">
          {!compact && (
            <Suspense fallback={null}>
              <GlyphTide
                className="os-tide"
                {...TIDE[theme]}
                fontFamily="VT323, ui-monospace, monospace"
                fontSize={12}
                speed={0.8}
                dpr={1.5}
              />
            </Suspense>
          )}
        </div>

        <ul className="os-icons">
          {placed &&
            DESKTOP.map((app) => {
              const meta = appMeta(app, {}, t)
              const s = placed[app]
              const dragging = drag?.app === app
              return (
                <li
                  key={app}
                  data-app={app}
                  className={`os-icon-slot${dragging ? ' is-dragging' : ''}`}
                  style={{
                    left: grid.left + s.c * grid.cellW,
                    top: grid.top + s.r * grid.cellH,
                    width: grid.cellW,
                    transform: dragging ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
                  }}
                >
                  <button
                    type="button"
                    className={`os-icon${isOpen(windowKey(app)) ? ' is-open' : ''}`}
                    style={{ '--app-c': meta.color }}
                    onPointerDown={(e) => onIconPointerDown(e, app)}
                    onClick={(e) => {
                      if (suppressClick.current) {
                        suppressClick.current = false
                        return
                      }
                      os.open(app, {}, { from: e.currentTarget })
                    }}
                    aria-label={`${meta.title} — ${meta.name}`}
                  >
                    <PixelIcon kind={meta.icon} className="os-icon__art" />
                    <span className="os-icon__label">
                      {fileLabel(meta.title)}
                      {APPS[app].folder ? '/' : ''}
                    </span>
                  </button>
                </li>
              )
            })}
        </ul>

        {buddyOn && placed && <Buddy compact={compact} draggingApp={drag?.app ?? null} openKeys={open.map((win) => win.key)} />}

        <div className="os-windows">
          <AnimatePresence>
            {open.map((win) => {
              const meta = appMeta(win.app, win.params, t)
              const def = APPS[win.app]
              const { Component } = def
              return (
                <Window
                  key={win.key}
                  title={win.app === 'browser' ? 'FurniBrowser' : meta.title}
                  icon={meta.icon}
                  color={meta.color}
                  layout={win.layout}
                  z={10 + Math.max(0, stack.indexOf(win.key))}
                  focused={win.key === topKey}
                  compact={compact}
                  labels={labels}
                  bodyClass={def.bodyClass}
                  onFocus={() => raise(win.key)}
                  onClose={() => os.close(win.key)}
                >
                  <Component params={win.params} />
                </Window>
              )
            })}
          </AnimatePresence>
        </div>

        {menuOpen && (
          <div ref={menuRef} className="os-start-menu" role="menu" aria-label={n.start.title}>
            <p className="os-start-menu__head">
              NICOLÁS OS <span className="nos-dim">v1.1</span>
            </p>
            <ul>
              {DESKTOP.map((app) => {
                const meta = appMeta(app, {}, t)
                return (
                  <li key={app}>
                    <button type="button" role="menuitem" style={{ '--app-c': meta.color }} onClick={() => os.open(app)}>
                      <PixelIcon kind={meta.icon} />
                      <span>{meta.name}</span>
                    </button>
                  </li>
                )
              })}
              <li className="os-start-menu__sep" role="separator" />
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    os.resetIcons()
                    setMenuOpen(false)
                  }}
                >
                  <LuLayoutGrid aria-hidden="true" />
                  <span>{n.start.arrange}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    const next = !buddyOn
                    setBuddyOn(next)
                    try {
                      localStorage.setItem(BUDDY_KEY, next ? 'on' : 'off')
                    } catch {
                      /* storage unavailable: the choice just won't persist */
                    }
                    setMenuOpen(false)
                  }}
                >
                  <LuSmile aria-hidden="true" />
                  <span>{buddyOn ? n.start.buddyHide : n.start.buddyShow}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    os.closeAll()
                    setMenuOpen(false)
                  }}
                >
                  <LuSquareDashed aria-hidden="true" />
                  <span>{labels.showDesktop}</span>
                </button>
              </li>
              <li>
                <button type="button" role="menuitem" onClick={onShutdown}>
                  <LuPower aria-hidden="true" />
                  <span>{n.start.shutdown}</span>
                </button>
              </li>
            </ul>
          </div>
        )}

        <div className="os-taskbar" style={{ height: TASKBAR_H }}>
          <button
            ref={startRef}
            type="button"
            className={`os-start${menuOpen ? ' is-on' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={n.start.open}
          >
            [NF]
          </button>
          <ul className="os-tasks" aria-label={labels.openWindows}>
            {open.map((win) => {
              const meta = appMeta(win.app, win.params, t)
              return (
                <li key={win.key}>
                  <button
                    type="button"
                    className={`os-task${win.key === topKey ? ' is-active' : ''}`}
                    style={{ '--app-c': meta.color }}
                    onClick={() => raise(win.key)}
                  >
                    {win.app === 'browser' ? 'FurniBrowser' : meta.title}
                  </button>
                </li>
              )
            })}
          </ul>
          <time className="os-clock">{time}</time>
        </div>
      </div>
    </OSContext.Provider>
  )
}
