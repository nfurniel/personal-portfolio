import { useState, useEffect } from 'react'
import './App.css'
import Nav from './components/nav/Nav'
import PageBackdrop from './background/PageBackdrop'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
import About from './sections/About'
import Contact from './sections/Contact'
import ClickSpark from './components/ClickSpark'
import HelloPreloader from './components/hello-preloader/HelloPreloader'
import { portfolioData } from './components/PortfolioData'
import { useLenis } from './lib/useLenis'
import { I18nProvider, useI18n } from './i18n'

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

/*
 * The load event waits on every subresource, third-party ones included. If any
 * of those hang — a blocked CDN, a stalled font — it never fires at all, and a
 * preloader gated on it would trap the page behind it forever. So the wait is
 * capped: past maxMs the app reports ready regardless.
 */
function useAppReady(minMs = 700, maxMs = 4000) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const start = performance.now()
    let settleTimer = null

    const finish = () => {
      const wait = Math.max(0, minMs - (performance.now() - start))
      settleTimer = setTimeout(() => setReady(true), wait)
    }

    const capTimer = setTimeout(() => {
      window.removeEventListener('load', finish)
      setReady(true)
    }, maxMs)

    if (document.readyState === 'complete') {
      finish()
    } else {
      window.addEventListener('load', finish, { once: true })
    }

    return () => {
      window.removeEventListener('load', finish)
      clearTimeout(capTimer)
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [minMs, maxMs])
  return ready
}

export default function App() {
  return <I18nProvider><PortfolioApp /></I18nProvider>
}

function PortfolioApp() {
  const { t } = useI18n()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isMobile = useMediaQuery('(max-width: 768px)')
  const sparkColor = useThemeAwareSparkColor()
  // The greeting cycle already sets the visual floor (~2.9s); this only has to
  // report when the page has actually finished loading.
  const appReady = useAppReady(0)
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
        <p>© {new Date().getFullYear()} Nicolás Furnieles · {t.footer}</p>
      </footer>
    </div>
  )

  const withSpark = reduceMotion ? content : (
    <ClickSpark sparkColor={sparkColor} sparkSize={8} sparkRadius={18} sparkCount={10} duration={500}>
      {content}
    </ClickSpark>
  )

  if (reduceMotion) return withSpark

  // The intro is what the Speed Index is actually measuring: nothing else can
  // paint until it lifts, so every tenth of a second it holds costs score.
  // These three set the length of the whole gesture — the first greeting holds,
  // the rest cycle, then the surface waits before sweeping away. Roughly three
  // seconds of greeting plus a 1.45s sweep. Lower them to speed the intro up.
  return (
    <HelloPreloader
      loading={!appReady}
      firstWordHold={0.8}
      wordInterval={0.2}
      tailHold={0.85}
    >
      {withSpark}
    </HelloPreloader>
  )
}
