import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { SiLinkedin, SiGithub, SiGmail } from 'react-icons/si'
import { LuArrowRight, LuMapPin, LuClock, LuBriefcase } from 'react-icons/lu'
import ContactButton from '../components/contact-card/ContactButton'
import ShinyText from '../components/ShinyText'
import BorderGlow from '../components/border-glow/BorderGlow'
import ContactFigure from '../components/contact-figure/ContactFigure'
import './contact.css'

function useThemeAwareGlow() {
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'light'
  )
  useEffect(() => {
    if (typeof document === 'undefined') return
    const update = () => setTheme(document.documentElement.getAttribute('data-theme') || 'light')
    update()
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    return () => mo.disconnect()
  }, [])
  return theme
}

const EASE = [0.22, 1, 0.36, 1]

const QUICK_INFO = [
  { icon: <LuMapPin />, label: 'Ubicación', value: 'Madrid, España' },
  { icon: <LuClock />, label: 'Horario', value: 'GMT+1 · Respondo rápido' },
  { icon: <LuBriefcase />, label: 'Disponibilidad', value: 'Open to work · 2026' },
]

export default function Contact({ email, linkedin, github }) {
  const theme = useThemeAwareGlow()
  const isDark = theme === 'dark'
  const cardBg = isDark ? '#0f0f10' : '#f8f9fc'
  const glowColor = isDark ? '240 90% 70%' : '230 80% 60%'
  const glowColors = isDark
    ? ['#a78bfa', '#7c3aed', '#22d3ee']
    : ['#3b82f6', '#a78bfa', '#06b6d4']

  return (
    <section id="contact" className="contact">
      <div className="container contact__container">
        <motion.div
          className="contact__card-wrap"
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8, ease: EASE }}
        >
        <BorderGlow
          className="contact__card"
          backgroundColor={cardBg}
          glowColor={glowColor}
          colors={glowColors}
          borderRadius={32}
          glowRadius={48}
          glowIntensity={1.1}
          coneSpread={28}
          fillOpacity={0.45}
        >
          <div className="contact__bg" aria-hidden="true">
            <div className="contact__bg-blob contact__bg-blob--a" />
            <div className="contact__bg-blob contact__bg-blob--b" />
            <div className="contact__bg-blob contact__bg-blob--c" />
            <div className="contact__bg-noise" />
          </div>

          <div className="contact__inner">
            <div className="contact__top">
              <div className="contact__copy">
                <p className="eyebrow">Contacto</p>
                <h2 className="h-display contact__title">
                  <ShinyText
                    text="Cerremos la distancia"
                    speed={4.5}
                    color="currentColor"
                    shineColor="#ffffff"
                    spread={110}
                    yoyo
                  />
                </h2>
                <p className="lede contact__lede">
                  Disponible para proyectos, colaboraciones y prácticas. Si construyes algo interesante,
                  me encantaría escuchar de qué va.
                </p>

                <div className="contact__ctas">
                  <ContactButton email={(email || '').replace('mailto:', '')} />
                  <a href="#projects" className="btn btn-ghost btn-arrow focus-ring">
                    Ver proyectos <LuArrowRight aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="contact__side">
                <ul className="contact__quick">
                  {QUICK_INFO.map((q, i) => (
                    <li key={i} className="contact__quick-row">
                      <span className="contact__quick-icon" aria-hidden="true">{q.icon}</span>
                      <span className="contact__quick-text">
                        <span className="contact__quick-label">{q.label}</span>
                        <span className="contact__quick-value">{q.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <ContactFigure />
              </div>
            </div>

            <div className="contact__footer">
              <ul className="contact__socials">
                <li>
                  <a
                    href={(email && email.startsWith('mailto:')) ? email : `mailto:${email}`}
                    aria-label="Email"
                    className="contact__social focus-ring"
                  >
                    <SiGmail aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="contact__social focus-ring">
                    <SiLinkedin aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a href={github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="contact__social focus-ring">
                    <SiGithub aria-hidden="true" />
                  </a>
                </li>
              </ul>
              <p className="contact__copyright">© {new Date().getFullYear()} Nicolás Furnieles</p>
            </div>
          </div>
        </BorderGlow>
        </motion.div>
      </div>
    </section>
  )
}
