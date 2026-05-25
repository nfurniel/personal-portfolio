import { motion, useReducedMotion } from 'motion/react'

const EASE = [0.22, 1, 0.36, 1]

export function FadeIn({ children, delay = 0, duration = 0.8, className, style, y = 12, as = 'div' }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div
  if (reduce) {
    const Tag = as
    return <Tag className={className} style={style}>{children}</Tag>
  }
  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  )
}

export function ScaleUnblur({ children, delay = 0, duration = 1, className, style, as = 'div' }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div
  if (reduce) {
    const Tag = as
    return <Tag className={className} style={style}>{children}</Tag>
  }
  return (
    <MotionTag
      className={className}
      style={{ transformOrigin: 'center', ...style }}
      initial={{ opacity: 0, scale: 0.7, filter: 'blur(20px)' }}
      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  )
}
