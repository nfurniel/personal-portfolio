import { useState, useEffect } from 'react'
import './App.css'
import Antigravity from './antigravity/Antigravity'
import AsciiText from './bits/AsciiText'
import LogoLoop from './logoLoop/LogoLoop'
import { portfolioData, logoLoopItems } from './components/PortfolioData'
import TargetCursor from './components/target-cursor/TargetCursor'
import { SiLinkedin, SiGithub } from 'react-icons/si'

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
          ringRadius={12}
          waveSpeed={0.5}
          animationSpeed={0.05}
          color="#fff"
        />
      </div>

      <div className="content-container">

        <header className="main-header">
          <div className="header-content cursor-target">
            <h1>{portfolioData.header.name}</h1>
            <p>{portfolioData.header.title}</p>
          </div>
        </header>

        <section className="hero-section">
          <div className="ascii-wrapper cursor-target">
            <AsciiText
              text="NICOLAS"
              asciiFontSize={10}
              textFontSize={isMobile ? 150 : 300}
              planeBaseHeight={isMobile ? 8 : 12}
              enableWaves={true}
            />
          </div>
          <p className="hero-subtitle">{portfolioData.header.subtitle}</p>
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
          <section className="about-section glass-card cursor-target">
            <h2>{portfolioData.about.title}</h2>
            <p>{portfolioData.about.description}</p>
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
            <div className="social-links">
              <a href={portfolioData.header.social.linkedin} target="_blank" rel="noreferrer" className="social-icon cursor-target" aria-label="LinkedIn">
                <SiLinkedin />
              </a>
              <a href={portfolioData.header.social.github} target="_blank" rel="noreferrer" className="social-icon cursor-target" aria-label="GitHub">
                <SiGithub />
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
