import { useEffect } from 'react'
import Lenis from 'lenis'

let lenisInstance = null

export function getLenis() {
  return lenisInstance
}

export function useLenis({ enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      // Lenis drives its own frame loop. This used to be pumped from
      // gsap.ticker, which only existed so ScrollTrigger could stay in sync —
      // and nothing in the site ever created a ScrollTrigger, so the plugin was
      // ~43 kB of startup JS doing nothing.
      autoRaf: true,
    })
    lenisInstance = lenis

    // Anchor link integration
    const onAnchorClick = (e) => {
      const target = e.target.closest('a[href^="#"]')
      if (!target) return
      const id = target.getAttribute('href')
      if (!id || id === '#') return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -80, duration: 1.2 })
    }
    document.addEventListener('click', onAnchorClick)

    return () => {
      document.removeEventListener('click', onAnchorClick)
      lenis.destroy()
      lenisInstance = null
    }
  }, [enabled])
}
