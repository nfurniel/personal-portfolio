import { LuGraduationCap, LuBriefcase, LuCodeXml, LuLayoutGrid, LuDatabase, LuSparkles, LuWorkflow, LuZap } from 'react-icons/lu'
import PolaroidStrip from '../components/polaroid/PolaroidStrip'
import Stack from '../components/stack/Stack'
import { FadeIn } from '../lib/motion-primitives'
import './about.css'
import { useI18n } from '../i18n'

// Labels and hints live in i18n (t.about.services), matched by index.
const SERVICE_ICONS = [<LuLayoutGrid />, <LuCodeXml />, <LuSparkles />, <LuWorkflow />, <LuDatabase />, <LuZap />]

export default function About() {
  const { t } = useI18n()
  return (
    <section id="about" className="about">
      <div className="container about__container">
        <FadeIn className="about__header">
          <p className="eyebrow">{t.about.eyebrow}</p>
          <h2 className="h-display">{t.about.title}</h2>
        </FadeIn>

        <FadeIn className="about__intro" delay={0.05}>
          <p>{t.about.description}</p>
          <p className="about__intro-secondary">
            {t.about.secondary}
          </p>
        </FadeIn>

        <FadeIn className="about__polaroids" delay={0.08}>
          <PolaroidStrip />
        </FadeIn>

        <div className="about__cols">
          <FadeIn className="about__panel about__panel--services" delay={0.05}>
            <div className="about__panel-head">
              <h3 className="about__panel-title">{t.about.what}</h3>
              <span className="about__panel-sub">{t.about.areas}</span>
            </div>
            <ul className="about__services">
              {t.about.services.map((s, i) => (
                <li key={i} className="service">
                  <span className="service__icon" aria-hidden="true">{SERVICE_ICONS[i]}</span>
                  <span className="service__text">
                    <span className="service__label">{s.label}</span>
                    <span className="service__hint">{s.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn className="about__panel about__panel--stack" delay={0.08}>
            <Stack resetLabel={t.about.stackReset} />
          </FadeIn>
        </div>

        <FadeIn className="about__panel" delay={0.05}>
          <div className="about__panel-head">
            <h3 className="about__panel-title">{t.about.experience}</h3>
            <span className="about__panel-sub">{t.about.experienceSub}</span>
          </div>
          <ul className="about__edu">
            {t.about.experienceItems.map((exp, i) => (
              <li key={i} className="about__edu-row">
                <span className="about__edu-logo" aria-hidden="true">
                  <LuBriefcase />
                </span>
                <div className="about__edu-text">
                  <p className="about__edu-school">{exp.company}</p>
                  <p className="about__edu-degree">{exp.role}</p>
                  <p className="about__edu-desc">{exp.description}</p>
                </div>
                <span className="about__edu-period">{exp.period}</span>
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn className="about__panel" delay={0.08}>
          <div className="about__panel-head">
            <h3 className="about__panel-title">{t.about.education}</h3>
            <span className="about__panel-sub">{t.about.educationSub}</span>
          </div>
          <ul className="about__edu">
            {t.about.educationItems.map((edu, i) => (
              <li key={i} className="about__edu-row">
                <span className="about__edu-logo" aria-hidden="true">
                  <LuGraduationCap />
                </span>
                <div className="about__edu-text">
                  <p className="about__edu-school">{edu.school}</p>
                  <p className="about__edu-degree">{edu.degree}</p>
                  <p className="about__edu-desc">{edu.description}</p>
                </div>
                <span className="about__edu-period">{edu.period}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  )
}
