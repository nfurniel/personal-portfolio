import { useState } from 'react'
import { motion } from 'motion/react'
import { SiLinkedin, SiGithub, SiGmail } from 'react-icons/si'
import { FaFileAlt } from 'react-icons/fa'
import { LuCopy, LuCheck } from 'react-icons/lu'
import FlowField from '../../background/FlowField'
import Magnetic from '../reveal/Magnetic'
import './contact-card.css'

export default function ContactCard({ email, linkedin, github, cv, isTouch = false }) {
  const [copied, setCopied] = useState(false)
  const cleanEmail = (email || '').replace('mailto:', '')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cleanEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.open(`mailto:${cleanEmail}`)
    }
  }

  return (
    <motion.div
      className="contact-card cursor-target"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="contact-card__shader">
        <FlowField
          bg="#0a0a0f"
          color1="#1a0b2e"
          color2="#5b21b6"
          color3="#c4b5fd"
          intensity={0.7}
        />
      </div>
      <div className="contact-card__overlay" />

      <div className="contact-card__body">
        <span className="contact-card__eyebrow">Hablemos</span>
        <h3 className="contact-card__title">
          ¿Tienes una idea?<br />
          <span className="contact-card__title-accent">Construyámosla.</span>
        </h3>
        <p className="contact-card__desc">
          Disponible para proyectos, colaboraciones y oportunidades. La distancia más corta entre tú y mí.
        </p>

        <button className="contact-card__email cursor-target" onClick={copy} aria-label="Copiar email">
          <span className="contact-card__email-text">{cleanEmail}</span>
          <span className="contact-card__email-icon">
            {copied ? <LuCheck /> : <LuCopy />}
          </span>
          <span className={`contact-card__email-toast ${copied ? 'is-visible' : ''}`}>
            Copiado
          </span>
        </button>

        <div className="contact-card__socials">
          <Magnetic strength={isTouch ? 0 : 0.35}>
            <a href={`mailto:${cleanEmail}`} className="contact-card__social cursor-target" aria-label="Email">
              <SiGmail />
            </a>
          </Magnetic>
          <Magnetic strength={isTouch ? 0 : 0.35}>
            <a href={linkedin} target="_blank" rel="noreferrer" className="contact-card__social cursor-target" aria-label="LinkedIn">
              <SiLinkedin />
            </a>
          </Magnetic>
          <Magnetic strength={isTouch ? 0 : 0.35}>
            <a href={github} target="_blank" rel="noreferrer" className="contact-card__social cursor-target" aria-label="GitHub">
              <SiGithub />
            </a>
          </Magnetic>
          <Magnetic strength={isTouch ? 0 : 0.35}>
            <a href={cv} target="_blank" rel="noreferrer" className="contact-card__social cursor-target" aria-label="CV">
              <FaFileAlt />
            </a>
          </Magnetic>
        </div>
      </div>
    </motion.div>
  )
}
