import { useState, useEffect } from 'react'
import './App.css'
import Nav from './components/nav/Nav'
import PageBackdrop from './background/PageBackdrop'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
import About from './sections/About'
import Contact from './sections/Contact'
import ClickSpark from './components/ClickSpark'
import Preloader from './components/preloader'
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

function useAppReady(minMs = 700) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const start = performance.now()
    const finish = () => {
      const elapsed = performance.now() - start
      const wait = Math.max(0, minMs - elapsed)
      setTimeout(() => setReady(true), wait)
    }
    if (document.readyState === 'complete') {
      finish()
    } else {
      window.addEventListener('load', finish, { once: true })
      return () => window.removeEventListener('load', finish)
    }
  }, [minMs])
  return ready
}

const STAIR_COLOR = '#0a0a0a'

export default function App() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isMobile = useMediaQuery('(max-width: 768px)')
  const sparkColor = useThemeAwareSparkColor()
  const appReady = useAppReady(1000)
  // `contentMounted` is flipped after the preloader's exit animation completes.
  // Mounting the heavy app earlier (Hero+PortraitMorph WebGL, 4 MetallicPaint canvases,
  // PageBackdrop, all motion-react components) blocks the main thread for 200-300ms,
  // which the user perceives as the preloader animation stuttering.
  const [contentMounted, setContentMounted] = useState(false)
  // Don't run Lenis's smooth-scroll RAF while the preloader covers the screen.
  useLenis({ enabled: !reduceMotion && contentMounted })

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

  const withSpark = reduceMotion ? content : (
    <ClickSpark sparkColor={sparkColor} sparkSize={8} sparkRadius={18} sparkCount={10} duration={500}>
      {content}
    </ClickSpark>
  )

  if (reduceMotion) return withSpark

  return (
    <>
      {/* Page background visible from the start, so the brief gap between preloader
          exit and content mount doesn't flash an empty white screen. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: STAIR_COLOR,
        }}
      />
      <Preloader
        loading={!appReady}
        variant="stairs"
        position="fixed"
        bgColor={STAIR_COLOR}
        loadingText="Nicolás Furnieles"
        stairCount={10}
        stairsRevealFrom="center"
        stairsRevealDirection="up"
        duration={1000}
        zIndex={9999}
        ariaLabel="Cargando portfolio"
        onLoadingComplete={() => setContentMounted(true)}
      >
        {contentMounted ? withSpark : null}
      </Preloader>
    </>
  )
}
