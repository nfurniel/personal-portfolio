import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n'
import { useOS } from '../context'
import { onThemeChange } from '../theme'
import { createBuddy } from './engine'
import { COLS, ROWS } from './sprites'
import './buddy.css'

/*
 * Mini Nico: a pixel Nicolás who lives on the desktop. He wanders, reacts
 * to icons, windows and the pointer, can be poked, picked up and annoyed,
 * and works as the assistant: click him for a menu and he walks to the icon
 * and opens it. On phones he stays in the bottom-left corner (same reactions,
 * no walking). All behaviour is in engine.js; this component owns the DOM
 * and the speech bubble.
 */

const OPTIONS = ['projects', 'contact', 'games', 'browser', 'story', 'close']

export default function Buddy({ compact, draggingApp, openKeys }) {
  const { t } = useI18n()
  const os = useOS()
  const reduce = useReducedMotion()
  const b = t.nos.buddy
  const px = compact ? 3 : 4
  const layerRef = useRef(null)
  const wrapRef = useRef(null)
  const bodyRef = useRef(null)
  const canvasRef = useRef(null)
  const fxRef = useRef(null)
  const bubbleRef = useRef(null)
  const hitRef = useRef(null)
  const engine = useRef(null)
  const live = useRef({ b, files: t.nos.files, os })
  const [bubble, setBubble] = useState(null)

  // The engine reads the current language and OS API through this.
  useEffect(() => {
    live.current = { b, files: t.nos.files, os }
  }, [b, t, os])

  useEffect(() => {
    const instance = createBuddy({
      layer: layerRef.current,
      wrap: wrapRef.current,
      body: bodyRef.current,
      canvas: canvasRef.current,
      fx: fxRef.current,
      getBubble: () => bubbleRef.current,
      live,
      setBubble,
      px,
      reduce,
      fixed: compact,
    })
    engine.current = instance
    if (import.meta.env.DEV) window.__buddy = instance
    return () => {
      instance.destroy()
      engine.current = null
      setBubble(null)
    }
  }, [px, reduce, compact])

  useEffect(() => {
    engine.current?.iconDrag(draggingApp ?? null)
  }, [draggingApp])

  const keys = openKeys.join(',')
  useEffect(() => {
    engine.current?.windows(keys ? keys.split(',') : [])
  }, [keys])

  useEffect(() => onThemeChange((next) => engine.current?.theme(next)), [])

  // Opened from the keyboard: move focus into the menu.
  // (The bubble stays hidden until the engine has placed it, so wait a frame.)
  useEffect(() => {
    if (bubble?.kind !== 'menu' || !bubble.keyboard) return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => bubbleRef.current?.querySelector('button')?.focus({ preventScroll: true }))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [bubble])

  // Leaving the bubble through one of its buttons: keep focus on him.
  const act = (fn) => {
    if (bubbleRef.current?.contains(document.activeElement)) hitRef.current?.focus({ preventScroll: true })
    fn(engine.current)
  }

  return (
    <div ref={layerRef} className={`buddy-layer${compact ? " is-fixed" : ""}`}>
      <div
        ref={wrapRef}
        className="buddy"
        style={{ width: COLS * px, height: ROWS * px }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && bubble?.kind === 'menu') {
            e.stopPropagation()
            act((x) => x?.closeMenu(true))
          }
        }}
      >
        {bubble && (
          <div
            ref={bubbleRef}
            key={bubble.id}
            className={`buddy__bubble is-${bubble.kind}`}
            role={bubble.kind === 'menu' ? 'group' : undefined}
            aria-label={bubble.kind === 'menu' ? b.menuLabel : undefined}
            onPointerMove={() => engine.current?.touch()}
          >
            <p role="status">{bubble.text}</p>
            {bubble.kind === 'menu' && (
              <ul>
                {OPTIONS.map((key) => (
                  <li key={key}>
                    <button type="button" className={key === 'close' ? 'is-quiet' : ''} onClick={() => act((x) => x?.choose(key))}>
                      {b.options[key]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {bubble.kind === 'story' && (
              <div className="buddy__story">
                <span aria-hidden="true">
                  {bubble.i}/{bubble.n}
                </span>
                <button type="button" onClick={() => engine.current?.next()}>
                  {b.next} ▸
                </button>
                <button type="button" className="is-quiet" onClick={() => act((x) => x?.skip())}>
                  {b.skip}
                </button>
              </div>
            )}
          </div>
        )}

        <span ref={fxRef} className="buddy__fx" aria-hidden="true" />

        <button
          ref={hitRef}
          type="button"
          className="buddy__hit"
          aria-label={b.aria}
          aria-expanded={bubble?.kind === 'menu'}
          onPointerDown={(e) => engine.current?.pointerDown(e)}
          onClick={(e) => engine.current?.poke(e.detail === 0)}
        >
          <span className="buddy__shadow" aria-hidden="true" />
          <span ref={bodyRef} className="buddy__body">
            <canvas ref={canvasRef} width={COLS * px} height={ROWS * px} aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  )
}
