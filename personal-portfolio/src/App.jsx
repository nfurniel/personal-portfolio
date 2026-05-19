import { useState, useEffect, lazy, Suspense } from 'react'
import './App.css'
import Antigravity from './antigravity/Antigravity'
import AsciiText from './bits/AsciiText'
import LogoLoop from './logoLoop/LogoLoop'
import { portfolioData, logoLoopItems } from './components/PortfolioData'
import RotatingText from './components/rotating-text/RotatingText'
import TargetCursor from './components/target-cursor/TargetCursor'
import { SiLinkedin, SiGithub, SiGmail } from 'react-icons/si'
import { FaFileAlt } from 'react-icons/fa'
import {
  LuBookOpen,
  LuCodeXml,
  LuSmartphone,
  LuUsers,
  LuGraduationCap,
  LuBriefcase,
  LuFolderGit2,
  LuRocket
} from 'react-icons/lu'
import GlareHover from './components/glare-hover/GlareHover'
import ScrollReveal from './scroll-reveal/ScrollReveal'
import profileImg from './img/img-sin-fondo.png'
import { Reveal, StaggerGroup, StaggerItem } from './components/reveal/Reveal'
import Magnetic from './components/reveal/Magnetic'
import SpotlightCard from './components/spotlight-card/SpotlightCard'
import SplitText from './components/split-text/SplitText'

const ProfileCard = lazy(() => import('./components/profile-card/ProfileCard'))

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

function App() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)')
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const philosophyIcons = [<LuBookOpen />, <LuCodeXml />, <LuSmartphone />, <LuUsers />]
  const experienceIcons = [<LuBriefcase />, <LuFolderGit2 />, <LuRocket />]

  return (
    <>
      {!isTouch && (
        <TargetCursor
          spinDuration={3}
          hideDefaultCursor={true}
          parallaxOn={true}
          hoverDuration={0.3}
        />
      )}

      <div className="canvas-container" aria-hidden="true">
        <Antigravity
          count={isMobile ? 8 : 15}
          magnetRadius={20}
          particleSize={3}
          ringRadius={20}
          waveSpeed={0.5}
          animationSpeed={0.05}
          color="#fff"
        />
      </div>

      <div className="content-container">
        <header className="main-header">
          <div className="header-content cursor-target">
            <h1 className="text-type">
              <SplitText as="span" variant="rise" stagger={0.04} duration={0.9}>
                {portfolioData.header.name}
              </SplitText>
            </h1>
            <Reveal as="p" className="text-type" delay={0.4} y={12}>
              {portfolioData.header.title}
            </Reveal>
          </div>
        </header>

        <section className="hero-section">
          <div className="ascii-wrapper cursor-target">
            <AsciiText
              text="NICOLÁS"
              asciiFontSize={10}
              textFontSize={isMobile ? 150 : 300}
              planeBaseHeight={isMobile ? 8 : 12}
              enableWaves={!isMobile && !reduceMotion}
            />
          </div>
          <Reveal className="hero-subtitle" delay={0.2}>
            <p style={{ display: 'block', marginBottom: '1rem' }}>
              Estudiante de DAWE apasionado por crear experiencias web
            </p>
            <RotatingText
              texts={['modernas', 'funcionales', 'únicas', 'personalizables', 'intuitivas', 'minimalistas', 'premium']}
              mainClassName="rotating-box text-type"
              staggerFrom="first"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-120%", opacity: 0 }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0-5"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              rotationInterval={2500}
              animatePresenceMode="popLayout"
            />
          </Reveal>
        </section>

        <section className="skills-section">
          <h2 className="centered-title">
            <SplitText variant="fadeUp" stagger={0.03}>Tecnologías</SplitText>
          </h2>
          <div className="logo-loop-wrapper">
            <LogoLoop
              logos={logoLoopItems}
              speed={40}
              direction="left"
              gap={isMobile ? 28 : 40}
              pauseOnHover={!isTouch}
            />
          </div>
        </section>

        <main className="main-content">
          <section className="about-section cursor-target" style={{ padding: 0 }}>
            <ScrollReveal
              baseOpacity={0.3}
              enableBlur={!reduceMotion}
              baseRotation={reduceMotion ? 0 : 1}
              blurStrength={2}
            >
              <GlareHover
                width="100%"
                height="auto"
                borderRadius="16px"
                background="var(--glass-bg)"
                borderColor="var(--glass-border)"
                glareColor="#ffffff"
                glareOpacity={0.1}
                className="glass-card"
              >
                <div style={{ padding: '0' }}>
                  <h2>{portfolioData.about.title}</h2>
                  <p>{portfolioData.about.description}</p>
                </div>
              </GlareHover>
            </ScrollReveal>
          </section>

          <section className="philosophy-section">
            <h2 className="centered-title">
              <SplitText variant="fadeUp" stagger={0.03}>Mi Filosofía</SplitText>
            </h2>
            <StaggerGroup className="cards-grid" staggerChildren={0.1}>
              {portfolioData.philosophy.map((phi, index) => (
                <StaggerItem key={index}>
                  <SpotlightCard
                    className="cursor-target"
                    icon={philosophyIcons[index]}
                    index={index + 1}
                  >
                    <h3 className="spotlight-card__title">{phi.title}</h3>
                    <p className="spotlight-card__text">{phi.description}</p>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>

          <section className="experience-section">
            <h2 className="centered-title">
              <SplitText variant="fadeUp" stagger={0.03}>Experiencia y Proyectos</SplitText>
            </h2>
            <StaggerGroup className="cards-grid" staggerChildren={0.12}>
              {portfolioData.experience.map((exp, index) => (
                <StaggerItem key={index}>
                  <SpotlightCard
                    className="cursor-target"
                    icon={experienceIcons[index] || <LuBriefcase />}
                    index={index + 1}
                    footer={exp.period}
                  >
                    <span className="spotlight-card__meta">
                      <span className="spotlight-card__meta-dot" aria-hidden="true" />
                      {exp.company}
                    </span>
                    <h3 className="spotlight-card__title">{exp.title}</h3>
                    <p className="spotlight-card__text">{exp.description}</p>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>

          <section className="education-section">
            <h2 className="centered-title">
              <SplitText variant="fadeUp" stagger={0.03}>Educación</SplitText>
            </h2>
            <StaggerGroup className="education-grid" staggerChildren={0.1}>
              {portfolioData.education.map((edu, index) => (
                <StaggerItem key={index}>
                  <SpotlightCard
                    className="cursor-target"
                    icon={<LuGraduationCap />}
                    index={index + 1}
                  >
                    <span className="spotlight-card__meta">
                      <span className="spotlight-card__meta-dot" aria-hidden="true" />
                      {edu.school}
                    </span>
                    <h3 className="spotlight-card__title">{edu.degree}</h3>
                    <p className="spotlight-card__text">{edu.description}</p>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>

          <section className="contact-section">
            <h2 className="centered-title">
              <SplitText variant="fadeUp" stagger={0.03}>Contacto</SplitText>
            </h2>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0', perspective: '1000px', width: '100%' }}>
              <Suspense fallback={<div style={{ width: 280, height: 360 }} />}>
                <ProfileCard
                  name="Nicolás Furnieles"
                  title="Desarrollador Web"
                  handle="nfurniel"
                  status="Open to Work"
                  contactText="Contactar"
                  avatarUrl={profileImg}
                  showUserInfo={true}
                  enableTilt={!isTouch}
                  enableMobileTilt={false}
                  onContactClick={() => window.open(`mailto:${portfolioData.header.social.email}`, '_blank')}
                  showIcon={false}
                  showBehindGlow={true}
                  behindGlowColor="var(--accent-color)"
                />
              </Suspense>
            </div>

            <StaggerGroup className="social-links" staggerChildren={0.08}>
              <StaggerItem>
                <Magnetic strength={isTouch ? 0 : 0.35}>
                  <a href={portfolioData.header.social.linkedin} target="_blank" rel="noreferrer" className="social-icon cursor-target" aria-label="LinkedIn">
                    <SiLinkedin />
                  </a>
                </Magnetic>
              </StaggerItem>
              <StaggerItem>
                <Magnetic strength={isTouch ? 0 : 0.35}>
                  <a href={portfolioData.header.social.github} target="_blank" rel="noreferrer" className="social-icon cursor-target" aria-label="GitHub">
                    <SiGithub />
                  </a>
                </Magnetic>
              </StaggerItem>
              <StaggerItem>
                <Magnetic strength={isTouch ? 0 : 0.35}>
                  <a href={portfolioData.header.social.email} className="social-icon cursor-target" aria-label="Email">
                    <SiGmail />
                  </a>
                </Magnetic>
              </StaggerItem>
              <StaggerItem>
                <Magnetic strength={isTouch ? 0 : 0.35}>
                  <a href="/nicolas-furnieles-cv.png" target="_blank" rel="noreferrer" className="social-icon cursor-target" aria-label="CV" title="Ver CV">
                    <FaFileAlt />
                  </a>
                </Magnetic>
              </StaggerItem>
            </StaggerGroup>
          </section>
        </main>

        <footer className="main-footer">
          <p>© {new Date().getFullYear()} Nicolas Furnieles. Todos los derechos reservados.</p>
        </footer>
      </div>
    </>
  )
}

export default App
