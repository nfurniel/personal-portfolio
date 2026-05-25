import { LuGraduationCap, LuCodeXml, LuLayoutGrid, LuDatabase, LuPalette, LuZap, LuGitBranch } from 'react-icons/lu'
import { portfolioData } from '../components/PortfolioData'
import PolaroidStrip from '../components/polaroid/PolaroidStrip'
import Stack from '../components/stack/Stack'
import { FadeIn } from '../lib/motion-primitives'
import './about.css'

const SERVICES = [
  { icon: <LuLayoutGrid />, label: 'Frontend Development', hint: 'React, TypeScript, accesibilidad' },
  { icon: <LuCodeXml />, label: 'Full Stack', hint: 'API REST, Laravel, Node.js' },
  { icon: <LuDatabase />, label: 'Bases de datos', hint: 'MySQL, MongoDB, modelado' },
  { icon: <LuPalette />, label: 'Diseño Responsive', hint: 'Mobile-first, fluid layouts' },
  { icon: <LuZap />, label: 'Performance', hint: 'Core Web Vitals, bundles ligeros' },
  { icon: <LuGitBranch />, label: 'Git & Workflow', hint: 'Branches, PRs, CI básico' },
]

export default function About() {
  return (
    <section id="about" className="about">
      <div className="container about__container">
        <FadeIn className="about__header">
          <p className="eyebrow">Sobre mí</p>
          <h2 className="h-display">Un poco sobre mi historia</h2>
        </FadeIn>

        <FadeIn className="about__intro" delay={0.05}>
          <p>{portfolioData.about.description}</p>
          <p className="about__intro-secondary">
            Fuera del código, me gusta cuidar los detalles: cómo se siente una transición, cómo respira una tipografía,
            cómo un botón comunica sin necesitar palabras. Creo que la calidad está en lo pequeño.
          </p>
        </FadeIn>

        <FadeIn className="about__polaroids" delay={0.08}>
          <PolaroidStrip />
        </FadeIn>

        <div className="about__cols">
          <FadeIn className="about__panel about__panel--services" delay={0.05}>
            <div className="about__panel-head">
              <h3 className="about__panel-title">Lo que hago</h3>
              <span className="about__panel-sub">6 áreas en las que trabajo</span>
            </div>
            <ul className="about__services">
              {SERVICES.map((s, i) => (
                <li key={i} className="service">
                  <span className="service__icon" aria-hidden="true">{s.icon}</span>
                  <span className="service__text">
                    <span className="service__label">{s.label}</span>
                    <span className="service__hint">{s.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn className="about__panel about__panel--stack" delay={0.08}>
            <Stack />
          </FadeIn>
        </div>

        <FadeIn className="about__panel" delay={0.05}>
          <div className="about__panel-head">
            <h3 className="about__panel-title">Educación</h3>
            <span className="about__panel-sub">Formación y aprendizaje continuo</span>
          </div>
          <ul className="about__edu">
            {portfolioData.education.map((edu, i) => (
              <li key={i} className="about__edu-row">
                <span className="about__edu-logo" aria-hidden="true">
                  <LuGraduationCap />
                </span>
                <div className="about__edu-text">
                  <p className="about__edu-school">{edu.school}</p>
                  <p className="about__edu-degree">{edu.degree}</p>
                  <p className="about__edu-desc">{edu.description}</p>
                </div>
                <span className="about__edu-period">2023 — Presente</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  )
}
