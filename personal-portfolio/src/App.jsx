import { useState, useEffect } from 'react'
import './App.css'
import Antigravity from './antigravity/Antigravity'
import AsciiText from './bits/AsciiText'
import LogoLoop from './logoLoop/LogoLoop'
import { portfolioData, logoLoopItems } from './components/PortfolioData'
import Particles from './components/particles/Particles'
import RotatingText from './components/rotating-text/RotatingText'
import TargetCursor from './components/target-cursor/TargetCursor'
import { SiLinkedin, SiGithub, SiGmail } from 'react-icons/si'
import GlareHover from './components/glare-hover/GlareHover'
import ScrollReveal from './scroll-reveal/ScrollReveal'
import ProfileCard from './components/profile-card/ProfileCard'
import profileImg from './img/img-sin-fondo.png'

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <TargetCursor
        spinDuration={3}
        hideDefaultCursor={true}
        parallaxOn={true}
        hoverDuration={0.3}
      />

      <div className="canvas-container">
        <Antigravity
          count={15}
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
            <h1 className="text-type">{portfolioData.header.name}</h1>
            <p className="text-type">{portfolioData.header.title}</p>
          </div>
        </header>

        <section className="hero-section">
          <div className="ascii-wrapper cursor-target">
            <AsciiText
              text="NICOLÁS"
              asciiFontSize={10}
              textFontSize={isMobile ? 150 : 300}
              planeBaseHeight={isMobile ? 8 : 12}
              enableWaves={true}
            />
          </div>
          <div className="hero-subtitle">
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
          </div>
        </section>




        <section className="skills-section">
          <h2 className="centered-title">Tecnologías</h2>
          <div className="logo-loop-wrapper">
            <LogoLoop
              logos={logoLoopItems}
              speed={40}
              direction="left"
              gap={40}
              pauseOnHover={true}
            />
          </div>
        </section>

        <main className="main-content">
          <section className="about-section cursor-target" style={{ padding: 0 }}>
            <ScrollReveal
              baseOpacity={0.3}
              enableBlur
              baseRotation={1}
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
            <h2 className="centered-title">Mi Filosofía</h2>
            <div className="cards-grid">
              {portfolioData.philosophy.map((phi, index) => (
                <div key={index} className="info-card glass-card cursor-target" style={{ position: 'relative', overflow: 'hidden' }}>
                  <Particles
                    particleCount={150}
                    particleSpread={10}
                    speed={0.2}
                    particleColors={['#ffffff']}
                    moveParticlesOnHover={false}
                    particleHoverFactor={1}
                    alphaParticles={false}
                    particleBaseSize={60}
                    sizeRandomness={1}
                    cameraDistance={30}
                    disableRotation={false}
                  />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3>{phi.title}</h3>
                    <p>{phi.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="experience-section">
            <h2 className="centered-title">Experiencia y Proyectos</h2>
            <div className="cards-grid">
              {portfolioData.experience.map((exp, index) => (
                <div key={index} className="info-card glass-card cursor-target">
                  <h3>{exp.title}</h3>
                  <span className="subtitle">{exp.company} | {exp.period}</span>
                  <p>{exp.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="education-section">
            <h2 className="centered-title">Educación</h2>
            <div className="cards-grid">
              {portfolioData.education.map((edu, index) => (
                <div key={index} className="info-card glass-card cursor-target">
                  <h3>{edu.degree}</h3>
                  <span className="subtitle">{edu.school}</span>
                  <p>{edu.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="contact-section">
            <h2 className="centered-title">Contacto</h2>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0', perspective: '1000px' }}>
              <ProfileCard
                name="Nicolás Furnieles"
                title="Desarrollador Web"
                handle="nfurniel"
                status="Open to Work"
                contactText="Contactar"
                avatarUrl={profileImg}
                showUserInfo={true}
                enableTilt={true}
                enableMobileTilt={true}
                onContactClick={() => window.open(`mailto:${portfolioData.header.social.email}`, '_blank')}
                showIcon={false}
                showBehindGlow={true}
                behindGlowColor="var(--accent-color)"
              />
            </div>

            <div className="social-links">
              <a href={portfolioData.header.social.linkedin} target="_blank" rel="noreferrer" className="social-icon cursor-target" aria-label="LinkedIn">
                <SiLinkedin />
              </a>
              <a href={portfolioData.header.social.github} target="_blank" rel="noreferrer" className="social-icon cursor-target" aria-label="GitHub">
                <SiGithub />
              </a>
              <a href={portfolioData.header.social.email} className="social-icon cursor-target" aria-label="Email">
                <SiGmail />
              </a>
              <a href="/nicolas-furnieles-cv.png" target="_blank" rel="noreferrer" className="social-icon cursor-target" aria-label="CV" title="Ver CV">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                </svg>
              </a>
            </div>
          </section>
        </main>



        <footer className="main-footer">
          <p>© {new Date().getFullYear()} Nicolas Furnieles. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

export default App
