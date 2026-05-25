import { motion } from 'motion/react'
import { SiLinkedin, SiGithub, SiGmail } from 'react-icons/si'
import { LuArrowRight, LuMapPin, LuClock, LuBriefcase } from 'react-icons/lu'
import ContactButton from '../components/contact-card/ContactButton'
import ShinyText from '../components/ShinyText'
import './contact.css'

const EASE = [0.22, 1, 0.36, 1]

const QUICK_INFO = [
  { icon: <LuMapPin />, label: 'Ubicación', value: 'Madrid, España' },
  { icon: <LuClock />, label: 'Horario', value: 'GMT+1 · Respondo rápido' },
  { icon: <LuBriefcase />, label: 'Disponibilidad', value: 'Open to work · 2026' },
]

export default function Contact({ email, linkedin, github }) {
  return (
    <section id="contact" className="contact">
      <div className="container contact__container">
        <motion.article
          className="contact__card"
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8, ease: EASE }}
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
        </motion.article>
      </div>
    </section>
  )
}
