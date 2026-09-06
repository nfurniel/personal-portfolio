import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import './contact-figure.css'

/*
 * Deliberately free of three.js imports. The whole 3D scene — three,
 * @react-three/fiber, the GLTF loader and the model — is behind this lazy()
 * boundary, so none of it is fetched, parsed or executed until the contact
 * section is about to enter the viewport.
 */
const FigureScene = lazy(() => import('./FigureScene'))

export default function ContactFigure({ className = '' }) {
  const wrapRef = useRef(null)
  const [inView, setInView] = useState(false)
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  const onReady = useCallback(() => setReady(true), [])

  // Respeta prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // `inView` latches on first approach and mounts the scene for good — remounting
  // the canvas on every scroll-by would recompile shaders each time. `active`
  // keeps tracking visibility so the render loop can idle while off-screen.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    let visible = false
    let docVisible = document.visibilityState !== 'hidden'
    const sync = () => setActive(visible && docVisible)

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) setInView(true)
        sync()
      },
      { rootMargin: '300px' }
    )
    io.observe(el)

    const onVis = () => {
      docVisible = document.visibilityState !== 'hidden'
      sync()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className={`contact-figure ${className}`.trim()}
      aria-hidden="true"
    >
      {!ready && <div className="contact-figure__loader" />}

      {inView && (
        <Suspense fallback={null}>
          <FigureScene active={active} reduceMotion={reduceMotion} onReady={onReady} />
        </Suspense>
      )}
    </div>
  )
}
