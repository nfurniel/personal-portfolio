import { useState, useEffect } from 'react'
import './App.css'
import Nav from './components/nav/Nav'
import PageBackdrop from './background/PageBackdrop'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
import About from './sections/About'
import Contact from './sections/Contact'
import ClickSpark from './components/ClickSpark'
import { portfolioData } from './components/PortfolioData'
import { useLenis } from './lib/useLenis'

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    handler(mql)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}

function useThemeAwareSparkColor() {
  const [color, setColor] = useState('#0a0a0a')
  useEffect(() => {
    const update = () => {
      const t = document.documentElement.getAttribute('data-theme')
      setColor(t === 'dark' ? '#a78bfa' : '#0a0a0a')
    }
    update()
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    return () => mo.disconnect()
  }, [])
  return color
}

export default function App() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isMobile = useMediaQuery('(max-width: 768px)')
  const sparkColor = useThemeAwareSparkColor()
  useLenis({ enabled: !reduceMotion })

  const cleanEmail = portfolioData.header.social.email.replace('mailto:', '')

  const content = (
    <div className="site">
      <PageBackdrop reduceMotion={reduceMotion} isMobile={isMobile} />
      <Nav />

      <main id="main-content" className="main">
        <Hero email={cleanEmail} />
        <Projects withHeadline />
        <About />
        <Contact
          email={cleanEmail}
          linkedin={portfolioData.header.social.linkedin}
          github={portfolioData.header.social.github}
        />
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Nicolás Furnieles · Construido con React, Three.js y GSAP</p>
      </footer>
    </div>
  )

  if (reduceMotion) return content

  return (
    <ClickSpark sparkColor={sparkColor} sparkSize={8} sparkRadius={18} sparkCount={10} duration={500}>
      {content}
    </ClickSpark>
  )
}
