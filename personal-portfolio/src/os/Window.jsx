import { useEffect, useId, useRef, useState } from 'react'
import { motion as Motion, useMotionValue, useReducedMotion } from 'motion/react'
import { LuMaximize2, LuMinimize2, LuX } from 'react-icons/lu'
import { PixelIcon } from './icons'

/*
 * A Nicolás OS window: inverted title bar when focused, maximise/close,
 * Esc to close, grows out of the icon it was opened from. Any app renders
 * inside it as children.
 *
 * Dragging is hand-rolled (pointer events + x/y motion values) so it follows
 * the pointer 1:1, with limits worked out at the moment of the press: a
 * window may slide partly off screen, but ~120px of it and its whole title
 * bar stay reachable.
 */

export default function Window({
  title,
  icon,
  color,
  layout,
  z,
  focused,
  compact,
  labels,
  onFocus,
  onClose,
  children,
  bodyClass = '',
}) {
  const reduce = useReducedMotion()
  const titleId = useId()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [maximized, setMaximized] = useState(false)
  // Dragging waits until the window has finished growing out of its icon.
  const [settled, setSettled] = useState(false)
  const [dragging, setDragging] = useState(false)
  const closeRef = useRef(null)
  const winRef = useRef(null)
  const stopDragRef = useRef(null)

  const full = compact || maximized

  // Focus the window on open so keyboard users land inside it (on the app's
  // own [data-autofocus] element if it has one, e.g. a game), unless it was
  // opened from the terminal (the caret stays in the prompt).
  const focusOnOpen = layout.focus !== false
  useEffect(() => {
    if (!focusOnOpen) return
    const target = winRef.current?.querySelector('[data-autofocus]') ?? closeRef.current
    target?.focus({ preventScroll: true })
  }, [focusOnOpen])

  // Never leave window listeners behind if the window closes mid-drag.
  useEffect(() => () => stopDragRef.current?.(), [])

  const toggleMax = () => {
    x.set(0)
    y.set(0)
    setMaximized((v) => !v)
  }

  const startDrag = (e) => {
    if (full || !settled || e.button !== 0 || e.target.closest('button')) return
    const win = winRef.current
    const layer = win?.closest('.os-windows')
    if (!win || !layer) return
    e.preventDefault()
    const lr = layer.getBoundingClientRect()
    const wr = win.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const fromX = x.get()
    const fromY = y.get()
    const minDx = lr.left - (wr.right - 120)
    const maxDx = lr.right - 120 - wr.left
    const minDy = lr.top - wr.top
    const maxDy = lr.bottom - 40 - wr.top
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

    const move = (ev) => {
      x.set(fromX + clamp(ev.clientX - startX, minDx, maxDx))
      y.set(fromY + clamp(ev.clientY - startY, minDy, maxDy))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      stopDragRef.current = null
      document.documentElement.classList.remove('nos-dragging')
      setDragging(false)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    stopDragRef.current = stop
    // Iframes (FurniBrowser) would swallow the pointer mid-drag.
    document.documentElement.classList.add('nos-dragging')
    setDragging(true)
  }

  const pos = full ? undefined : { left: layout.left, top: layout.top, width: layout.width, height: layout.height }

  return (
    <Motion.div
      className={`os-window-shell${full ? ' is-full' : ''}`}
      style={{ ...pos, zIndex: z, transformOrigin: layout.origin, '--app-c': color }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.08 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.08 }}
      transition={reduce ? { duration: 0.15 } : { type: 'spring', duration: 0.45, bounce: 0.08 }}
      onAnimationComplete={() => setSettled(true)}
      onPointerDown={onFocus}
      onFocus={onFocus}
    >
      <Motion.div
        ref={winRef}
        className={`os-window${focused ? ' is-focused' : ''}${dragging ? ' is-dragging' : ''}`}
        role="dialog"
        aria-labelledby={titleId}
        style={{ x, y }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            onClose()
          }
        }}
      >
        <div className="os-window__bar" onPointerDown={startDrag} onDoubleClick={compact ? undefined : toggleMax}>
          <span className="os-window__icon" aria-hidden="true">
            <PixelIcon kind={icon} />
          </span>
          <h3 className="os-window__title" id={titleId}>
            {title}
          </h3>
          <div className="os-window__controls">
            {!compact && (
              <button
                type="button"
                className="os-ctrl"
                onClick={toggleMax}
                aria-label={maximized ? labels.restore : labels.maximize}
              >
                {maximized ? <LuMinimize2 aria-hidden="true" /> : <LuMaximize2 aria-hidden="true" />}
              </button>
            )}
            <button ref={closeRef} type="button" className="os-ctrl" onClick={onClose} aria-label={labels.close}>
              <LuX aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className={`os-window__body ${bodyClass}`} data-lenis-prevent>
          {children}
        </div>
      </Motion.div>
    </Motion.div>
  )
}
