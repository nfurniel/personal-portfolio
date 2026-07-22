import { LuArrowRight } from 'react-icons/lu'
import profileImg from '../img/img-sin-fondo.webp'
import ContactButton from '../components/contact-card/ContactButton'
import PortraitMorph from '../components/portrait-morph/PortraitMorph'
import ShinyText from '../components/ShinyText'
import { FadeIn, ScaleUnblur } from '../lib/motion-primitives'
import './hero.css'
import { useI18n } from '../i18n'

export default function Hero({ email }) {
  const { t } = useI18n()
  return (
    <section id="home" className="hero">
      <div className="container hero__container">
        <div className="hero__grid">
          <FadeIn className="hero__copy">
            <p className="hero__greeting">
              {t.hero.greeting}
            </p>
            <h1 className="hero__title">
              <span>{t.hero.title[0]}</span>
              <span>{t.hero.title[1]}</span>
            </h1>
            <p className="hero__lede">
              {t.hero.lede}
            </p>

            <p className="hero__caption">
              <span className="hero__caption-dot" />
              <ShinyText
                text={t.hero.current}
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
                {t.hero.work} <LuArrowRight aria-hidden="true" />
              </a>
            </div>
          </FadeIn>

          <ScaleUnblur className="hero__media">
            <div className="hero__frame">
              <div className="hero__portrait">
                <PortraitMorph src={profileImg} alt={t.hero.alt} />
              </div>
            </div>
          </ScaleUnblur>
        </div>
      </div>
    </section>
  )
}
