import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { LuSun, LuMoon } from 'react-icons/lu'
import './nav.css'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
]

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  localStorage.setItem('theme', theme)
}

export default function Nav() {
  const [active, setActive] = useState('home')
  const [theme, setTheme] = useState(getInitialTheme)
  const itemRefs = useRef({})
  const themeBtnRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    applyTheme(theme)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      let current = 'home'
      for (const link of LINKS) {
        const el = document.getElementById(link.id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top < window.innerHeight * 0.4) current = link.id
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = itemRefs.current[active]
    if (!el) return
    const parent = el.parentElement
    const pRect = parent.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    setIndicator({ left: r.left - pRect.left, width: r.width })
  }, [active])

  const toggleTheme = (e) => {
    const next = theme === 'dark' ? 'light' : 'dark'

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const supports = typeof document.startViewTransition === 'function'

    if (reduce || !supports) {
      setTheme(next)
      applyTheme(next)
      return
    }

    // Compute click origin and farthest corner radius for the circular reveal
    const btn = themeBtnRef.current || e.currentTarget
    const rect = btn.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    document.documentElement.style.setProperty('--vt-x', `${x}px`)
    document.documentElement.style.setProperty('--vt-y', `${y}px`)
    document.documentElement.style.setProperty('--vt-r', `${endRadius}px`)
    document.documentElement.setAttribute('data-vt-direction', next === 'dark' ? 'to-dark' : 'to-light')

    const transition = document.startViewTransition(() => {
      setTheme(next)
      applyTheme(next)
    })

    transition.finished.finally(() => {
      document.documentElement.removeAttribute('data-vt-direction')
    })
  }

  return (
    <nav className="nav-wrap" aria-label="Primary">
      <div className="nav-pill" role="navigation">
        <motion.span
          className="nav-indicator"
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        />
        {LINKS.map((l) => (
          <a
            key={l.id}
            ref={(el) => (itemRefs.current[l.id] = el)}
            href={`#${l.id}`}
            className={`nav-link focus-ring ${active === l.id ? 'is-active' : ''}`}
            aria-current={active === l.id ? 'page' : undefined}
          >
            {l.label}
          </a>
        ))}
      </div>

      <button
        ref={themeBtnRef}
        type="button"
        className="nav-theme focus-ring"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        aria-pressed={theme === 'dark'}
      >
        {theme === 'dark' ? <LuSun aria-hidden="true" /> : <LuMoon aria-hidden="true" />}
      </button>
    </nav>
  )
}
