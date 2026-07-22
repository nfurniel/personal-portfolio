import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createTimeline, animate, stagger, svg, utils } from 'animejs'
import { NAME_GLYPHS, NAME_VIEWBOX, NAME_CENTER_X } from './name-paths'
import './name-preloader.css'

/*
 * Glyph outlines are pre-baked from Geist 700 (the site's sans) by
 * scripts/generate-name-paths.mjs — no font parsing at runtime.
 *
 * Each glyph lives in its own stacked <svg> so the exit animation moves
 * HTML elements (composited transforms) instead of repainting one big SVG.
 */
const [, , VB_W, VB_H] = NAME_VIEWBOX.split(' ').map(Number)

export default function NamePreloader({
  loading,
  name = 'Nicolás Furnieles',
  bgColor = '#0a0a0a',
  strokeColor = '#f5f5f5',
  minHoldMs = 200,
  children,
}) {
  const [show, setShow] = useState(true)
  const [drawDone, setDrawDone] = useState(false)
  const overlayRef = useRef(null)
  const figureRef = useRef(null)
  const contentRef = useRef(null)
  const pulseRef = useRef(null)
  const exitStartedRef = useRef(false)

  // The page keeps loading behind the opaque overlay, but skipping its paint
  // while hidden frees the main thread for the draw animation.
  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    content.style.visibility = 'hidden'
    return () => {
      content.style.visibility = ''
    }
  }, [])

  // Entry: trace each glyph outline, then let the fill settle in.
  // Deferred two frames so it never competes with the app's first paint.
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    let tl
    let raf2
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const letters = overlay.querySelectorAll('.np-letter')
        tl = createTimeline({
          delay: 150,
          onComplete: () => {
            setDrawDone(true)
            pulseRef.current = animate(figureRef.current, {
              opacity: [1, 0.82],
              duration: 1100,
              ease: 'inOutSine',
              loop: true,
              alternate: true,
            })
          },
        })
        tl.add(svg.createDrawable(letters), {
          draw: ['0 0', '0 1'],
          duration: 560,
          delay: stagger(50),
          ease: 'inOutSine',
        })
        tl.add(letters, { fillOpacity: [0, 1], duration: 440, ease: 'outQuad' }, '-=280')
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
      tl?.cancel()
      pulseRef.current?.cancel()
    }
  }, [])

  // Exit: letters track apart while the name zooms softly through the viewer,
  // the overlay dissolves and the page settles from a slight over-scale.
  useEffect(() => {
    if (loading || !drawDone || exitStartedRef.current) return
    const overlay = overlayRef.current
    const figure = figureRef.current
    const content = contentRef.current
    if (!overlay || !figure) return
    exitStartedRef.current = true

    if (content) content.style.visibility = ''
    figure.classList.add('np-figure--exit')
    pulseRef.current?.cancel()
    utils.set(figure, { opacity: 1 })

    const glyphSvgs = overlay.querySelectorAll('.np-glyph')
    const tl = createTimeline({
      delay: minHoldMs,
      onComplete: () => setShow(false),
    })

    tl.add(
      glyphSvgs,
      {
        translateX: (el, i) => (NAME_GLYPHS[i].cx - NAME_CENTER_X) * 0.22,
        duration: 900,
        ease: 'inOutQuint',
      },
      0,
    )
    tl.add(figure, { scale: [1, 2.6], duration: 900, ease: 'inQuart' }, 0)
    tl.add(figure, { opacity: [1, 0], duration: 460, ease: 'outQuad' }, 320)
    tl.add(overlay, { opacity: [1, 0], duration: 520, ease: 'outCubic' }, 280)
    if (content) {
      tl.add(
        content,
        {
          scale: [1.035, 1],
          duration: 900,
          ease: 'outCubic',
          onComplete: () => {
            content.style.transform = ''
          },
        },
        180,
      )
    }

    return () => tl.cancel()
  }, [loading, drawDone, minHoldMs])

  return (
    <>
      {show && (
        <div
          ref={overlayRef}
          className="np-overlay"
          style={{ backgroundColor: bgColor }}
          role="status"
          aria-label={`Cargando portfolio de ${name}`}
          aria-live="polite"
        >
          <div
            ref={figureRef}
            className="np-figure"
            style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
          >
            {NAME_GLYPHS.map((g, i) => (
              <svg
                key={i}
                className="np-glyph"
                viewBox={NAME_VIEWBOX}
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  className="np-letter"
                  d={g.d}
                  style={{ stroke: strokeColor, fill: strokeColor }}
                />
              </svg>
            ))}
          </div>
        </div>
      )}
      <div ref={contentRef} className="np-content">
        {children}
      </div>
    </>
  )
}
