import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { LuMaximize, LuMinimize, LuPlay, LuPower } from 'react-icons/lu'
import portrait from '../img/img-sin-fondo.webp'
import { useI18n } from '../i18n'
import { BANNER, PROJECTS } from './data'
import HackLoader from './HackLoader'
import Desktop from './Desktop'
import { initCursors } from './cursors'
import './os.css'
import './cursor.css'

/*
 * The whole portfolio as "Nicolás OS". The page is a terminal card: a start
 * screen that types itself in, "Start system" runs a hacking-style boot and
 * then the desktop takes over the card, with every part of the portfolio as
 * folders, files, apps and games. A title-bar button goes fullscreen (the
 * Fullscreen API, or filling the window where that is unavailable).
 *   off → booting → on   (and back to off with the power button / `exit`)
 */

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
  const termRef = useRef(null)
  const startRef = useRef(null)
  const powerRef = useRef(null)
  const prevPhase = useRef('off')
  const [phase, setPhase] = useState('off')
  const [typed, setTyped] = useState(false)
  const [expanded, setExpanded] = useState(false) // CSS fallback for fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  const powerOff = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    setExpanded(false)
    setPhase('off')
  }, [])

  return (
    <main className="nos-page">
      <h1 className="sr-only">Nicolás Furnieles — {t.hero.title.join(' ')}</h1>

      <div className={`nos-stage is-${phase}${expanded ? ' is-expanded' : ''}`}>
        <div className="nos-term" ref={termRef}>
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
                    <span className="nos-prompt">nicolas@os:~$</span> ./nicolas-os --start
                    <span className="nos-cursor" aria-hidden="true" />
                  </p>
                </div>
                <button
                  ref={startRef}
                  type="button"
                  className="nos-start"
                  style={{ '--i': 5 }}
                  onClick={() => setPhase('booting')}
                >
                  <LuPlay aria-hidden="true" />
                  {os.start}
                </button>
              </div>
            )}

            {phase === 'booting' && <HackLoader portrait={portrait} labels={os} onDone={() => setPhase('on')} />}

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
    </main>
  )
}
