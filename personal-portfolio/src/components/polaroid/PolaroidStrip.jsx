import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { LuCode, LuCoffee, LuMapPin, LuGraduationCap, LuMusic } from 'react-icons/lu'
import './polaroid.css'

const EASE = [0.22, 1, 0.36, 1]

const POLAROIDS = [
  {
    label: 'Madrid',
    caption: 'home base',
    rotate: -8,
    bg: 'linear-gradient(135deg, #ffb199 0%, #ff5e62 100%)',
    icon: <LuMapPin />,
  },
  {
    label: 'UTAD',
    caption: 'DAWE · 2025',
    rotate: 4,
    bg: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    icon: <LuGraduationCap />,
  },
  {
    label: 'Code',
    caption: '2 cafés/día',
    rotate: -3,
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 100%)',
    icon: <LuCode />,
  },
  {
    label: 'Coffee',
    caption: 'fuel ✦',
    rotate: 7,
    bg: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
    icon: <LuCoffee />,
  },
  {
    label: 'Music',
    caption: 'always on',
    rotate: -5,
    bg: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
    icon: <LuMusic />,
  },
]

function Polaroid({ item, index }) {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 18 })
  const sy = useSpring(my, { stiffness: 220, damping: 18 })
  const tx = useTransform(sx, (v) => `${v}px`)
  const ty = useTransform(sy, (v) => `${v}px`)

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = (e.clientX - cx) / r.width
    const dy = (e.clientY - cy) / r.height
    mx.set(Math.max(-18, Math.min(18, dx * 30)))
    my.set(Math.max(-18, Math.min(18, dy * 30)))
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className="polaroid"
      style={{ rotate: item.rotate, x: tx, y: ty }}
      initial={{ opacity: 0, y: -40, filter: 'blur(12px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE, delay: index * 0.08 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="polaroid__inner">
        <div className="polaroid__photo" style={{ background: item.bg }}>
          <span className="polaroid__icon" aria-hidden="true">{item.icon}</span>
          <span className="polaroid__label">{item.label}</span>
        </div>
        <span className="polaroid__caption">{item.caption}</span>
      </div>
    </motion.div>
  )
}

export default function PolaroidStrip() {
  return (
    <div className="polaroid-strip">
      {POLAROIDS.map((item, i) => (
        <Polaroid key={i} item={item} index={i} />
      ))}
    </div>
  )
}
