import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import './project-card.css'

export default function ProjectCard({ title, tag, description, period, icon, accent }) {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 22 })
  const sy = useSpring(my, { stiffness: 220, damping: 22 })
  const rx = useTransform(sy, [-0.5, 0.5], [6, -6])
  const ry = useTransform(sx, [-0.5, 0.5], [-6, 6])

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.article
      ref={ref}
      className="project-card cursor-target"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
    >
      <div className="project-card__media" style={{ '--accent': accent || 'var(--accent-color)' }}>
        <div className="project-card__glow" />
        <div className="project-card__grid" />
        <div className="project-card__icon">{icon}</div>
        {period && <span className="project-card__period">{period}</span>}
      </div>
      <div className="project-card__body">
        {tag && <span className="project-card__tag">{tag}</span>}
        <h3 className="project-card__title">{title}</h3>
        <p className="project-card__desc">{description}</p>
      </div>
    </motion.article>
  )
}
