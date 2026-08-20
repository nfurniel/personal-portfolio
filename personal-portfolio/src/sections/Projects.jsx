import { memo } from 'react'
import { motion as Motion } from 'motion/react'
import { LuArrowUpRight, LuGithub, LuExternalLink } from 'react-icons/lu'
import { FadeIn } from '../lib/motion-primitives'
import MetallicPaint from '../components/metallic-paint/MetallicPaint'
import './projects.css'
import { useI18n } from '../i18n'

const EASE = [0.22, 1, 0.36, 1]

const PROJECTS = [
  {
    id: 'quick-arrival',
    title: 'Quick Arrival App',
    tag: 'Proyecto fin de ciclo · 2025',
    description: 'Aplicación web que facilita la gestión de llegadas y reservas. Mi proyecto final del ciclo de DAWE.',
    accent: '#61dafb',
    accentText: '#ffffff',
    iconSrc: '/icons/react.svg',
    iconTint: '#a5e8ff',
    techs: ['React', 'JavaScript', 'Node'],
    github: 'https://github.com/nfurniel/Quick-Arrival-App',
    demo: 'https://quick-arrival-app.vercel.app',
  },
  {
    id: 'cosmos-api',
    title: 'Cosmos API',
    tag: 'Open source · 2025',
    description: 'API REST de astronomía construida con FastAPI. Endpoints sobre planetas, datos espaciales y más.',
    accent: '#3776ab',
    accentText: '#ffffff',
    iconSrc: '/icons/python.svg',
    iconTint: '#ffd966',
    techs: ['Python', 'FastAPI', 'REST'],
    github: 'https://github.com/nfurniel/cosmos-api',
    demo: 'https://cosmos-api-production.onrender.com/',
    stars: 2,
  },
  {
    id: 'veta',
    title: 'Veta',
    tag: 'Producto · 2026',
    description: 'Filtro de convocatorias públicas para empresas: analiza la BDNS, descarta lo que no encaja y explica por qué una ayuda podría interesar, enlazando siempre a la fuente oficial.',
    accent: '#3178c6',
    accentText: '#ffffff',
    iconSrc: '/icons/typescript.svg',
    iconTint: '#9cc4ff',
    techs: ['Next.js', 'TypeScript', 'React'],
    demo: 'https://veta-pi.vercel.app/',
  },
  {
    id: 'casas-madera-vip',
    title: 'Casas Madera VIP',
    tag: 'Comercial · 2026',
    description: 'Web comercial para un cliente real: restauración de casas de madera, con una UX interactiva moderna y transiciones fluidas.',
    accent: '#4f7cff',
    accentText: '#ffffff',
    iconSrc: '/icons/react.svg',
    iconTint: '#b3c8ff',
    techs: ['React', 'GSAP', 'Vite'],
    demo: 'https://casasmaderavip.es/',
  },
]

const ProjectCard = memo(function ProjectCard({ project, index }) {
  return (
    <Motion.article
      className="proj-card"
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.06 }}
    >
      <a
        className="proj-card__media"
        href={project.demo || project.github}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.title} — abrir ${project.demo ? 'demo' : 'repo'}`}
        style={{ '--accent': project.accent, '--accent-text': project.accentText }}
      >
        <div className="proj-card__media-bg" />
        <div className="proj-card__icon">
          <MetallicPaint
            imageSrc={project.iconSrc}
            tintColor={project.iconTint}
            size={420}
            scale={3.2}
            speed={0.22}
            liquid={0.6}
            brightness={1.9}
            contrast={0.55}
            chromaticSpread={1.6}
          />
        </div>
        <span className="proj-card__media-corner" aria-hidden="true">
          <LuArrowUpRight />
        </span>
      </a>

      <div className="proj-card__body">
        <div className="proj-card__meta">
          <span className="proj-card__tag">{project.tag}</span>
          {project.stars ? (
            <span className="proj-card__stars" aria-label={`${project.stars} estrellas en GitHub`}>
              ★ {project.stars}
            </span>
          ) : null}
        </div>
        <h3 className="proj-card__title">{project.title}</h3>
        <p className="proj-card__desc">{project.description}</p>

        <div className="proj-card__footer">
          <ul className="proj-card__techs">
            {project.techs.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="proj-card__actions" onClick={(e) => e.stopPropagation()}>
            {project.github && (
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="proj-card__action focus-ring" aria-label={`${project.title} en GitHub`}>
                <LuGithub aria-hidden="true" />
              </a>
            )}
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noopener noreferrer" className="proj-card__action focus-ring" aria-label={`Demo de ${project.title}`}>
                <LuExternalLink aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Motion.article>
  )
})

export default function Projects({ withHeadline = true }) {
  const { t } = useI18n()
  return (
    <section id="projects" className="projects">
      <div className="container projects__container">
        {withHeadline && (
          <FadeIn className="projects__header">
            <p className="eyebrow">{t.projects.eyebrow}</p>
            <h2 className="h-display">{t.projects.title}</h2>
            <p className="lede">
              {t.projects.lede}
            </p>
          </FadeIn>
        )}

        <div className="projects__grid">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
