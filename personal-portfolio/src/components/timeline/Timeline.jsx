import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './timeline.css'

gsap.registerPlugin(ScrollTrigger)

export default function Timeline({ items = [] }) {
  const rootRef = useRef(null)
  const lineRef = useRef(null)

  useEffect(() => {
    if (!rootRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 75%',
            end: 'bottom 70%',
            scrub: 0.6,
          },
        }
      )

      const nodes = rootRef.current.querySelectorAll('.timeline-item')
      nodes.forEach((node) => {
        gsap.fromTo(
          node,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: node, start: 'top 85%' },
          }
        )
      })
    }, rootRef)

    return () => ctx.revert()
  }, [items])

  return (
    <ol className="timeline" ref={rootRef}>
      <span className="timeline-line-bg" />
      <span className="timeline-line" ref={lineRef} />
      {items.map((it, i) => (
        <li className="timeline-item cursor-target" key={i}>
          <span className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-meta">
              {it.icon && <span className="timeline-icon">{it.icon}</span>}
              <span className="timeline-period">{it.period}</span>
            </div>
            <h3 className="timeline-title">{it.title}</h3>
            <span className="timeline-place">{it.place}</span>
            <p className="timeline-desc">{it.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
