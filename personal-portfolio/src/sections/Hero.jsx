import { LuArrowRight } from 'react-icons/lu'
import profileImg from '../img/img-sin-fondo.png'
import ContactButton from '../components/contact-card/ContactButton'
import PortraitMorph from '../components/portrait-morph/PortraitMorph'
import ShinyText from '../components/ShinyText'
import { FadeIn, ScaleUnblur } from '../lib/motion-primitives'
import './hero.css'

export default function Hero({ email }) {
  return (
    <section id="home" className="hero">
      <div className="container hero__container">
        <div className="hero__grid">
          <FadeIn className="hero__copy">
            <p className="hero__greeting">
              Hey<span aria-hidden="true">👋</span>, soy Nicolás
            </p>
            <h1 className="hero__title">
              <span>Full Stack Developer</span>
              <span>&amp; Estudiante de DAWE</span>
            </h1>
            <p className="hero__lede">
              Construyo interfaces que se sienten calmadas, cuidadas y silenciosamente rápidas.
              Front y back, con cariño por los detalles.
            </p>

            <p className="hero__caption">
              <span className="hero__caption-dot" />
              <ShinyText
                text="Actualmente: trabajando en proyectos personales y abierto a oportunidades."
                speed={6}
                color="currentColor"
                shineColor="#ffffff"
                spread={140}
                yoyo
              />
            </p>

            <div className="hero__ctas">
              <ContactButton email={email} />
              <a href="#projects" className="btn btn-ghost btn-arrow focus-ring">
                Ver mi trabajo <LuArrowRight aria-hidden="true" />
              </a>
            </div>
          </FadeIn>

          <ScaleUnblur className="hero__media">
            <div className="hero__frame">
              <div className="hero__portrait">
                <PortraitMorph src={profileImg} alt="Nicolás Furnieles" />
              </div>
            </div>
          </ScaleUnblur>
        </div>
      </div>
    </section>
  )
}
