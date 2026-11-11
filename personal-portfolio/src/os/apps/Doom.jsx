import { useEffect, useRef, useState } from 'react'
import { LuPlay, LuRotateCcw, LuVolume2, LuVolumeX } from 'react-icons/lu'
import { useI18n } from '../../i18n'
import { useOS } from '../context'

/*
 * doom.exe: the DOOM shareware episode in a small retro console.
 *
 * Nothing is downloaded until START (engine ~2.5 MB + WAD ~4 MB, gzipped
 * by the host). The game runs in an iframe (public/games/doom/player.html):
 * it keeps the keyboard to itself (Esc opens DOOM's menu instead of closing
 * the window), and closing the window or pressing Reset throws the whole
 * engine away, memory and sound included. Phones get a notice instead: it is
 * a keyboard game.
 *
 * A click on the screen captures the mouse (turn, fire, open doors); Esc
 * releases it and opens DOOM's menu.
 */

const PLAYER = '/games/doom/player.html'

// Hand the keyboard to the game (the iframe, then its canvas).
function focusFrame(frame) {
  frame?.focus()
  frame?.contentWindow?.document.getElementById('canvas')?.focus()
}

export default function Doom() {
  const { t } = useI18n()
  const os = useOS()
  const d = t.nos.doom
  const frameRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | loading | running | error
  const [progress, setProgress] = useState(0)
  const [muted, setMuted] = useState(false)
  const [run, setRun] = useState(0) // a new value remounts the iframe (Reset)

  // Messages from the game page.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return
      const msg = e.data
      if (!msg || typeof msg.doom !== 'string') return
      if (msg.doom === 'progress') setProgress(msg.value)
      else if (msg.doom === 'ready') {
        setProgress(1)
        setPhase('running')
        focusFrame(frameRef.current)
      } else if (msg.doom === 'error') setPhase('error')
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Keep the game's sound in step with the Mute button (also after a reset).
  useEffect(() => {
    if (phase !== 'running') return
    frameRef.current?.contentWindow?.postMessage({ doom: 'mute', on: muted }, window.location.origin)
  }, [muted, phase])

  const start = () => {
    setProgress(0)
    setPhase('loading')
    setRun((n) => n + 1)
  }

  if (os.compact) {
    return (
      <div className="app-doom">
        <div className="app-doom__screen is-idle">
          <p className="app-doom__logo">DOOM</p>
          <p className="app-doom__note">{d.mobile}</p>
        </div>
      </div>
    )
  }

  const busy = phase === 'loading' || phase === 'running'

  return (
    <div className="app-doom">
      <div className="app-doom__console">
        <div className={`app-doom__screen${busy ? '' : ' is-idle'}`} onPointerDown={phase === 'running' ? () => focusFrame(frameRef.current) : undefined}>
          {busy && (
            <iframe
              key={run}
              ref={frameRef}
              className="app-doom__frame"
              src={PLAYER}
              title={d.frame}
              allow="autoplay"
            />
          )}

          {phase === 'idle' && (
            <>
              <p className="app-doom__logo">DOOM</p>
              <p className="app-doom__note">{d.episode}</p>
              <button type="button" className="app-doom__start" onClick={start} data-autofocus>
                <LuPlay aria-hidden="true" /> {d.start}
              </button>
              <p className="app-doom__note is-dim">{d.size}</p>
            </>
          )}

          {phase === 'loading' && (
            <div className="app-doom__loading" role="status">
              <p>
                {d.loading} {Math.round(progress * 100)}%
              </p>
              <span className="app-doom__bar" aria-hidden="true">
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </span>
            </div>
          )}

          {phase === 'error' && (
            <>
              <p className="app-doom__note">{d.error}</p>
              <button type="button" className="app-doom__start" onClick={start}>
                <LuRotateCcw aria-hidden="true" /> {d.retry}
              </button>
            </>
          )}
        </div>

        <div className="app-doom__bar-row">
          <span className="app-doom__led" data-on={phase === 'running' ? '1' : ''} aria-hidden="true" />
          <span className="app-doom__label">DOOM · SHAREWARE</span>
          <button
            type="button"
            className="app-mini"
            onClick={() => setMuted((m) => !m)}
            aria-pressed={muted}
            disabled={phase !== 'running'}
          >
            {muted ? <LuVolumeX aria-hidden="true" /> : <LuVolume2 aria-hidden="true" />}
            {muted ? d.unmute : d.mute}
          </button>
          <button type="button" className="app-mini" onClick={start} disabled={phase === 'idle'}>
            <LuRotateCcw aria-hidden="true" /> {d.reset}
          </button>
        </div>
      </div>

      <p className="app-doom__credits">
        {d.credits}{' '}
        <a href="https://github.com/cloudflare/doom-wasm" target="_blank" rel="noopener noreferrer">
          {d.source}
        </a>
      </p>
    </div>
  )
}
