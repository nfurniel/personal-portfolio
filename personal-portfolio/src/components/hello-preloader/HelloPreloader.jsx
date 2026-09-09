import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import './hello-preloader.css'

/*
 * Adapted from Award Components p050 "Awesome Preloader".
 *
 * Keeps the original character — a greeting cycling through languages next to a
 * dot, then the whole surface sweeping upward behind a curved edge — while
 * driving every colour from the site's theme tokens so it reads correctly in
 * both light and dark.
 *
 * The greeting is swapped through the DOM node rather than React state: the
 * cycle ticks eight times in under three seconds and none of it needs to
 * re-render the tree mounted behind the overlay.
 */
const DEFAULT_WORDS = ['Hola', 'Hello', 'Bonjour', 'Ciao', 'Olá', 'やあ', 'Hallå', 'Guten tag', 'Hallo']

const CURVE_DEPTH = 300

function buildPaths(width, height) {
  return {
    // Bulges below the viewport, so relaxing it to flat drags the curve upward.
    initial: `M0 0 L${width} 0 L${width} ${height} Q${width / 2} ${height + CURVE_DEPTH} 0 ${height} L0 0`,
    target: `M0 0 L${width} 0 L${width} ${height} Q${width / 2} ${height} 0 ${height} L0 0`,
  }
}

export default function HelloPreloader({
  loading = false,
  words = DEFAULT_WORDS,
  firstWordHold = 1,
  wordInterval = 0.15,
  tailHold = 1.5,
  children,
}) {
  const [show, setShow] = useState(true)
  const [sequenceDone, setSequenceDone] = useState(false)

  const overlayRef = useRef(null)
  const wordRef = useRef(null)
  const textRef = useRef(null)
  const fillRef = useRef(null)
  const contentRef = useRef(null)
  const dimensionRef = useRef({ width: 0, height: 0 })
  const exitStartedRef = useRef(false)

  // The app keeps hydrating behind the opaque overlay, but skipping its paint
  // while it is fully covered frees the main thread for the intro animation.
  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    content.style.visibility = 'hidden'
    return () => {
      content.style.visibility = ''
    }
  }, [])

  // Intro: draw the curve, fade the greeting in, cycle through the languages.
  useEffect(() => {
    const wordEl = wordRef.current
    const textEl = textRef.current
    if (!wordEl || !textEl) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const syncPaths = () => {
      dimensionRef.current = { width: window.innerWidth, height: window.innerHeight }
      const { initial } = buildPaths(window.innerWidth, window.innerHeight)
      fillRef.current?.setAttribute('d', initial)
    }
    syncPaths()

    textEl.textContent = words[0]

    const ctx = gsap.context(() => {
      gsap.to(wordEl, { opacity: 0.75, duration: 1, delay: 0.2 })
    }, overlayRef)

    let index = 0
    const calls = []
    const cycleWords = () => {
      if (index === words.length - 1) return
      const delay = index === 0 ? firstWordHold : wordInterval
      calls.push(
        gsap.delayedCall(delay, () => {
          index += 1
          textEl.textContent = words[index]
          cycleWords()
        }),
      )
    }
    cycleWords()

    // Measured from the last greeting instead of from a bare word count, so a
    // longer firstWordHold or wordInterval can never let the exit start while
    // the cycle is still swapping words.
    const cycleDuration = firstWordHold + Math.max(words.length - 2, 0) * wordInterval
    calls.push(gsap.delayedCall(cycleDuration + tailHold, () => setSequenceDone(true)))

    window.addEventListener('resize', syncPaths)

    return () => {
      window.removeEventListener('resize', syncPaths)
      calls.forEach((call) => call.kill())
      ctx.revert()
      document.body.style.overflow = previousOverflow
    }
  }, [words, firstWordHold, wordInterval, tailHold])

  // Exit: only once the greeting cycle finished *and* the app reports ready, so
  // the reveal never lands on a half-painted page.
  useEffect(() => {
    if (!sequenceDone || loading || exitStartedRef.current) return
    const overlay = overlayRef.current
    const wordEl = wordRef.current
    const content = contentRef.current
    if (!overlay || !wordEl) return
    exitStartedRef.current = true

    if (content) content.style.visibility = ''

    const { width, height } = dimensionRef.current
    const { initial, target } = buildPaths(width, height)

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        document.body.style.overflow = ''
        setShow(false)
      },
    })

    tl.to(wordEl, { opacity: 0, duration: 0.45 }, 0)
    tl.to(overlay, { y: '-100vh', duration: 1.1, delay: 0.35, ease: 'power4.inOut' }, 0)
    tl.fromTo(
      fillRef.current,
      { attr: { d: initial } },
      { attr: { d: target }, duration: 0.95, delay: 0.45, ease: 'power4.inOut' },
      0,
    )

    return () => tl.kill()
  }, [sequenceDone, loading])

  return (
    <>
      {show && (
        <div
          ref={overlayRef}
          className="hp-overlay"
          role="status"
          aria-label="Cargando"
        >
          {/* The greeting swaps eight times; announcing each one would spam
              assistive tech, so the container label carries the status. */}
          <p className="hp-word" ref={wordRef} aria-hidden="true">
            <span className="hp-dot" />
            <span className="hp-word__text" ref={textRef} />
          </p>

          <svg className="hp-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path className="hp-svg__fill" ref={fillRef} />
          </svg>
        </div>
      )}
      <div ref={contentRef} className="hp-content">
        {children}
      </div>
    </>
  )
}
