import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { LuMaximize, LuMinimize, LuPlay, LuPower } from 'react-icons/lu'
import portrait from '../img/img-sin-fondo.webp'
import { useI18n } from '../i18n'
import { BANNER, PROJECTS } from './data'
import HackLoader from './HackLoader'
import Desktop from './Desktop'
import Room from './Room'
import { roomLayout } from './room-layout'
import { initCursors } from './cursors'
import './os.css'
import './cursor.css'

/*
 * The whole portfolio as "Nicolás OS". You arrive in a pixel-art room, looking
 * at a monitor showing a fake desktop with the terminal card open as a window.
 * "Start system" (or a click on the screen) starts a hacking-style boot inside
 * that window while the camera flies into it; then the desktop takes over the
 * card, with every part of the portfolio as folders, files, apps and games.
 * Powering off flies back out to the room. A title-bar button goes fullscreen (the Fullscreen API, or
 * filling the window where that is unavailable).
 *   off (room) → booting → on   (and back to off with the power button / `exit`)
 */

const FLY_MS = 1500 // the camera's flight (room.css)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const NARROW = '(max-width: 700px)'
const subscribeNarrow = (cb) => {
  const mql = window.matchMedia(NARROW)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}
const getNarrow = () => window.matchMedia(NARROW).matches

export default function NicolasOS() {
  const { t, language } = useI18n()
  const os = t.projects.os
  const compact = useSyncExternalStore(subscribeNarrow, getNarrow, () => false)
  const pageRef = useRef(null)
  const termRef = useRef(null)
  const zoomTimer = useRef(0)
  const startRef = useRef(null)
  const powerRef = useRef(null)
  const prevPhase = useRef('off')
  const [phase, setPhase] = useState('off')
  const [typed, setTyped] = useState(false)
  const [expanded, setExpanded] = useState(false) // CSS fallback for fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [view, setView] = useState({ w: 0, h: 0 })
  const [zoomed, setZoomed] = useState(false) // the camera is inside the monitor
  const [snap, setSnap] = useState(false) // place the camera without animating
  const [flying, setFlying] = useState(false) // on the way in: the room is still around the booting card

  // The room is laid out from the page size.
  useEffect(() => {
    const page = pageRef.current
    const measure = () => setView({ w: page.clientWidth, h: page.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(page)
    return () => ro.disconnect()
  }, [])
  const room = useMemo(() => roomLayout(view.w, view.h, compact), [view, compact])
  const inRoom = !!room && (phase === 'off' || flying)

  useEffect(() => () => clearTimeout(zoomTimer.current), [])

  // Pixel cursors (baked once; they follow the theme).
  useEffect(() => initCursors(), [])

  // Type the start screen in just after load.
  useEffect(() => {
    const id = setTimeout(() => setTyped(true), 250)
    return () => clearTimeout(id)
  }, [])

  // Track real fullscreen (Esc or the browser UI can leave it too).
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === termRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Focus follows the system: power button once on, start button once off.
  useEffect(() => {
    if (phase === 'on') powerRef.current?.focus({ preventScroll: true })
    if (phase === 'off' && prevPhase.current === 'on') startRef.current?.focus({ preventScroll: true })
    prevPhase.current = phase
  }, [phase])

  const fullscreenOn = isFullscreen || expanded

  const toggleFullscreen = useCallback(() => {
    const term = termRef.current
    if (document.fullscreenElement || expanded) {
      if (document.fullscreenElement) document.exitFullscreen?.()
      setExpanded(false)
      return
    }
    if (document.fullscreenEnabled && term.requestFullscreen) {
      term.requestFullscreen().catch(() => setExpanded(true))
    } else {
      setExpanded(true)
    }
  }, [expanded])

  // Start: the boot begins at once, inside the window on the monitor, while
  // the camera flies in. The card is already at its final size (scaled down),
  // so the flight ends with it exactly where it stays: no cut.
  const start = useCallback(() => {
    if (zoomTimer.current) return
    setPhase('booting')
    if (reducedMotion()) return
    setZoomed(true)
    setFlying(true)
    zoomTimer.current = setTimeout(() => {
      zoomTimer.current = 0
      setFlying(false)
    }, FLY_MS)
  }, [])

  // Booted (or skipped, perhaps mid-flight: then the flight ends there).
  const booted = useCallback(() => {
    clearTimeout(zoomTimer.current)
    zoomTimer.current = 0
    setFlying(false)
    setPhase('on')
  }, [])

  // Power off: back to the room, flying out of the monitor.
  const powerOff = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    clearTimeout(zoomTimer.current)
    zoomTimer.current = 0
    setFlying(false)
    setExpanded(false)
    if (reducedMotion()) {
      setZoomed(false)
      setPhase('off')
      return
    }
    // Appear already inside the monitor, then fly out.
    setSnap(true)
    setZoomed(true)
    setPhase('off')
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setSnap(false)
        setZoomed(false)
      }),
    )
  }, [])

  return (
    <main className="nos-page" ref={pageRef}>
      <h1 className="sr-only">Nicolás Furnieles — {t.hero.title.join(' ')}</h1>

      <div
        className={`nos-stage is-${phase}${expanded ? ' is-expanded' : ''}${inRoom ? ' is-room' : ''}${zoomed ? ' is-zoomed' : ''}${snap ? ' is-snap' : ''}`}
        style={inRoom ? room.cam : undefined}
      >
        {/* Once inside, the monitor's desktop stays behind the system. */}
        {room && !inRoom && (
          <div className="nos-room__frozen">
            <Room layout={room} compact={compact} frozen />
          </div>
        )}
        <div className="nos-cam">
          {inRoom && <Room layout={room} compact={compact} onStart={start} />}
          {/* In the room the card is a window on the monitor: a click anywhere on it starts. */}
          <div
            className="nos-term"
            ref={termRef}
            style={inRoom ? (flying ? room.boot : room.term) : undefined}
            onClick={phase === 'off' ? start : undefined}
          >
            <div className="nos-term__bar">
              <span className="nos-term__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {phase === 'on' && (
                <button ref={powerRef} type="button" className="nos-tool" onClick={powerOff} aria-label={os.exit}>
                  <LuPower aria-hidden="true" />
                  <span className="nos-tool__label">{os.exit}</span>
                </button>
              )}
              {phase !== 'off' && (
                <button
                  type="button"
                  className="nos-tool"
                  onClick={toggleFullscreen}
                  aria-pressed={fullscreenOn}
                  aria-label={fullscreenOn ? os.exitFullscreen : os.fullscreen}
                >
                  {fullscreenOn ? <LuMinimize aria-hidden="true" /> : <LuMaximize aria-hidden="true" />}
                  <span className="nos-tool__label">{fullscreenOn ? os.exitFullscreen : os.fullscreen}</span>
                </button>
              )}
              <span className="nos-term__title">nicolas@os: ~</span>
            </div>

            <div className="nos-term__body">
              {phase === 'off' && (
                <div className={`nos-intro${typed ? ' is-typed' : ''}`}>
                  <pre className="nos-banner" role="img" aria-label="Nicolás OS">
                    {BANNER}
                  </pre>
                  <div className="nos-lines">
                    <p style={{ '--i': 0 }}>
                      <span className="nos-prompt">nicolas@os:~$</span> whoami
                    </p>
                    <p style={{ '--i': 1 }} className="nos-out">
                      Nicolás Furnieles — {t.hero.title.join(' ')}
                    </p>
                    <p style={{ '--i': 2 }}>
                      <span className="nos-prompt">nicolas@os:~$</span> ls ./{os.folder}
                    </p>
                    <p style={{ '--i': 3 }} className="nos-out nos-files">
                      {PROJECTS.map((it) => (
                        <span key={it.id}>{it.file}</span>
                      ))}
                    </p>
                    <p style={{ '--i': 4 }}>
                      {/* In the room this command types itself, over and over. */}
                      <span className="nos-prompt">nicolas@os:~$</span> <span className="nos-typed">./nicolas-os --start</span>
                      <span className="nos-cursor" aria-hidden="true" />
                    </p>
                  </div>
                  <button
                    ref={startRef}
                    type="button"
                    className="nos-start"
                    style={{ '--i': 5 }}
                    onClick={start}
                  >
                    <LuPlay aria-hidden="true" />
                    {os.start}
                  </button>
                </div>
              )}

              {phase === 'booting' && <HackLoader portrait={portrait} labels={os} onDone={booted} />}

              {phase === 'on' && (
                <Desktop
                  labels={os}
                  locale={language}
                  compact={compact}
                  onShutdown={powerOff}
                  onToggleFullscreen={toggleFullscreen}
                />
              )}
            </div>

            <div className="nos-grain" aria-hidden="true" />
          </div>
        </div>
      </div>
    </main>
  )
}
