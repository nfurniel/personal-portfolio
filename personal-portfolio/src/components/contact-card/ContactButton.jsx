import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LuCopy, LuCheck } from 'react-icons/lu'
import './contact-button.css'

const EASE = [0.22, 1, 0.36, 1]

export default function ContactButton({ email = 'nicopk2018@gmail.com', variant = 'primary' }) {
  const [state, setState] = useState('idle') // idle | hover | copied

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      const t = document.createElement('textarea')
      t.value = email
      document.body.appendChild(t)
      t.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(t)
    }
    setState('copied')
    setTimeout(() => setState('idle'), 1800)
  }

  const onEnter = () => state === 'idle' && setState('hover')
  const onLeave = () => state === 'hover' && setState('idle')

  const ariaLabel = state === 'copied' ? 'Email copiado' : state === 'hover' ? `Copiar ${email}` : 'Mostrar email'

  return (
    <button
      type="button"
      className={`contact-button focus-ring ${variant === 'ghost' ? 'is-ghost' : ''}`}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onMouseLeave={onLeave}
      onBlur={onLeave}
      onClick={copy}
      aria-label={ariaLabel}
    >
      <span className="contact-button__inner">
        <AnimatePresence initial={false} mode="popLayout">
          {state === 'idle' && (
            <motion.span
              key="idle"
              className="contact-button__text"
              initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              Contactar
            </motion.span>
          )}
          {state === 'hover' && (
            <motion.span
              key="hover"
              className="contact-button__text contact-button__email"
              initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              {email}
              <LuCopy aria-hidden="true" />
            </motion.span>
          )}
          {state === 'copied' && (
            <motion.span
              key="copied"
              className="contact-button__text contact-button__copied"
              initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              Email copiado
              <LuCheck aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  )
}
