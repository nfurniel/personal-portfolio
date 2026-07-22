import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { LuCheck, LuChevronDown } from 'react-icons/lu'
import { SUPPORTED_LANGUAGES, useI18n } from '../../i18n'
import './language-switcher.css'

const FLAGS = {
  es: (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" fill="#AA151B" />
      <rect y="8" width="32" height="16" fill="#F1BF00" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" fill="#012169" />
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#ffffff" strokeWidth="6" />
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2.4" />
      <path d="M16 0 V32 M0 16 H32" stroke="#ffffff" strokeWidth="10" />
      <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="5.6" />
    </svg>
  ),
  fr: (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" fill="#ffffff" />
      <rect width="11" height="32" fill="#0055A4" />
      <rect x="21" width="11" height="32" fill="#EF4135" />
    </svg>
  ),
}

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const changeLanguage = (code) => {
    setOpen(false)
    if (code === language) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setLanguage(code)
      return
    }

    if (typeof document.startViewTransition === 'function') {
      document.documentElement.setAttribute('data-vt-lang', '')
      const transition = document.startViewTransition(() => {
        flushSync(() => setLanguage(code))
      })
      transition.finished.finally(() => {
        document.documentElement.removeAttribute('data-vt-lang')
      })
      return
    }

    // Fallback: quick fade out, swap language, fade back in
    const root = document.documentElement
    root.classList.add('lang-switching')
    setTimeout(() => {
      setLanguage(code)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => root.classList.remove('lang-switching'))
      )
    }, 250)
  }

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language)

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button
        type="button"
        className="lang-switcher__btn focus-ring"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.nav.language}: ${current?.name}`}
      >
        <span className="lang-switcher__flag">{FLAGS[language]}</span>
        <LuChevronDown
          className={`lang-switcher__chevron ${open ? 'is-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <Motion.div
            className="lang-switcher__menu"
            role="menu"
            aria-label={t.nav.language}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {SUPPORTED_LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={language === item.code}
                className={`lang-switcher__item ${language === item.code ? 'is-active' : ''}`}
                onClick={() => changeLanguage(item.code)}
              >
                <span className="lang-switcher__flag">{FLAGS[item.code]}</span>
                <span className="lang-switcher__name">{item.name}</span>
                {language === item.code && (
                  <LuCheck className="lang-switcher__check" aria-hidden="true" />
                )}
              </button>
            ))}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
