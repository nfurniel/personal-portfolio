import { useEffect, useRef, useState } from 'react'
import { LuArrowUpRight, LuCheck, LuCopy, LuDownload } from 'react-icons/lu'
import portrait from '../../img/img-sin-fondo.webp'
import { portfolioData } from '../../components/PortfolioData'
import { SUPPORTED_LANGUAGES, useI18n } from '../../i18n'
import { useOS } from '../context'
import { CV_URLS, cvFor } from '../data'
import { setTheme, useNosTheme } from '../theme'

const email = portfolioData.header.social.email.replace('mailto:', '')
const { linkedin, github } = portfolioData.header.social
const strip = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

/* sobre_mi.txt */
export function About() {
  const { t } = useI18n()
  return (
    <div className="app-about">
      <img className="app-about__photo" src={portrait} alt={t.hero.alt} width="320" height="320" />
      <div className="app-about__text">
        <p className="app-kicker">&gt; whoami</p>
        <p className="app-title">Nicolás Furnieles</p>
        <p className="app-dim">
          {t.hero.title.join(' ')} · {t.contact.locationValue}
        </p>
        <p className="app-text">{t.about.description}</p>
        <p className="app-text app-soft">{t.about.secondary}</p>
        <p className="app-kicker">&gt; {t.about.what}</p>
        <ul className="app-list">
          {t.about.services.map((s) => (
            <li key={s.label}>
              <b>{s.label}</b>
              <span>{s.hint}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* trayectoria.log */
export function Career() {
  const { t } = useI18n()
  const block = (title, entries, orgKey, roleKey) => (
    <section className="app-log">
      <p className="app-kicker"># {title}</p>
      {entries.map((e) => (
        <article key={e[orgKey]} className="app-log__entry">
          <p className="app-dim">[{e.period}]</p>
          <p className="app-log__org">{e[orgKey]}</p>
          <p className="app-log__role">{e[roleKey]}</p>
          <p className="app-text app-soft">{e.description}</p>
        </article>
      ))}
    </section>
  )
  return (
    <div className="app-career">
      {block(t.about.experience, t.about.experienceItems, 'company', 'role')}
      {block(t.about.education, t.about.educationItems, 'school', 'degree')}
    </div>
  )
}

/* stack.json */
const LEVEL = { Avanzado: 5, Intermedio: 3 }
export function Stack() {
  const { t } = useI18n()
  return (
    <div className="app-stack">
      <p className="app-kicker">{'{'} "stack": [</p>
      <ul className="app-stack__list">
        {portfolioData.skills.map((s) => {
          const n = LEVEL[s.level] ?? 3
          return (
            <li key={s.name}>
              <span className="app-stack__icon" aria-hidden="true">
                {s.icon}
              </span>
              <span className="app-stack__name">"{s.name}"</span>
              <span className="app-stack__bar" aria-label={t.nos.stack.levels[s.level] ?? s.level}>
                {'▮'.repeat(n)}
                <span className="app-dim">{'▯'.repeat(5 - n)}</span>
              </span>
              <span className="app-dim app-stack__level">{t.nos.stack.levels[s.level] ?? s.level}</span>
            </li>
          )
        })}
      </ul>
      <p className="app-kicker">] {'}'}</p>
    </div>
  )
}

/* contacto.sh */
export function Contact() {
  const { t } = useI18n()
  const os = useOS()
  const c = t.nos.contact
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <div className="app-contact">
      <p className="app-kicker">$ ./contacto.sh</p>
      <p className="app-text">{t.contact.lede}</p>
      <dl className="app-rows">
        <div>
          <dt>email</dt>
          <dd>
            <a href={`mailto:${email}`}>{email}</a>
            <button type="button" className="app-mini" onClick={copy}>
              {copied ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}
              <span aria-live="polite">{copied ? c.copied : c.copy}</span>
            </button>
          </dd>
        </div>
        <div>
          <dt>linkedin</dt>
          <dd>
            <a href={linkedin} target="_blank" rel="noopener noreferrer">
              {strip(linkedin)}
            </a>
          </dd>
        </div>
        <div>
          <dt>github</dt>
          <dd>
            <a href={github} target="_blank" rel="noopener noreferrer">
              {strip(github)}
            </a>
          </dd>
        </div>
        <div>
          <dt>cv</dt>
          <dd>
            <button type="button" className="app-link" onClick={(e) => os.open('cv', {}, { from: e.currentTarget })}>
              CV.pdf
            </button>
          </dd>
        </div>
        <div>
          <dt>{c.location}</dt>
          <dd>{t.contact.locationValue}</dd>
        </div>
        <div>
          <dt>{c.status}</dt>
          <dd>
            <span className="app-dot" aria-hidden="true" /> {t.contact.availabilityValue}
          </dd>
        </div>
      </dl>
      <a className="app-cta" href={`mailto:${email}`}>
        {c.write} <LuArrowUpRight aria-hidden="true" />
      </a>
    </div>
  )
}

/* CV.pdf */
export function Cv() {
  const { t, language } = useI18n()
  const c = t.nos.cv
  const lang = cvFor(language)
  const url = CV_URLS[lang]
  return (
    <div className="app-cv">
      <div className="app-cv__actions">
        <a className="app-cta" href={url} download={`Nicolas-Furnieles-CV-${lang}.pdf`}>
          <LuDownload aria-hidden="true" /> {c.download}
        </a>
        <a className="app-mini" href={url} target="_blank" rel="noopener noreferrer">
          {c.open} <LuArrowUpRight aria-hidden="true" />
        </a>
      </div>
      {/* Phones can't show a PDF inline: they get the buttons above and a note. */}
      <object key={url} className="app-cv__page" data={`${url}#toolbar=0&navpanes=0&view=FitH`} type="application/pdf" aria-label={c.alt}>
        <p className="app-text app-soft">{c.fallback}</p>
      </object>
      <p className="app-text app-soft app-cv__phone">{c.fallback}</p>
    </div>
  )
}

/* ajustes.cfg */
export function Settings() {
  const { t, language, setLanguage } = useI18n()
  const s = t.nos.settings
  const theme = useNosTheme()
  return (
    <div className="app-settings">
      <section>
        <p className="app-kicker"># {s.theme}</p>
        {/* The new theme spreads in pixels out of the button that was pressed. */}
        <div className="app-seg" role="group" aria-label={s.theme}>
          {['dark', 'light'].map((mode) => (
            <button
              key={mode}
              type="button"
              className={theme === mode ? 'is-on' : ''}
              aria-pressed={theme === mode}
              onClick={(e) => setTheme(mode, e.currentTarget)}
            >
              <span aria-hidden="true">{mode === 'dark' ? '☾' : '☀'}</span> {s.themes[mode]}
            </button>
          ))}
        </div>
      </section>
      <section>
        <p className="app-kicker"># {s.language}</p>
        <div className="app-seg" role="group" aria-label={s.language}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={language === l.code ? 'is-on' : ''}
              aria-pressed={language === l.code}
              onClick={() => setLanguage(l.code)}
            >
              {l.label} · {l.name}
            </button>
          ))}
        </div>
      </section>
      <section>
        <p className="app-kicker"># {s.tips}</p>
        <ul className="app-list">
          {s.tipsList.map(([k, v]) => (
            <li key={k}>
              <b>{k}</b>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <p className="app-kicker"># {s.about}</p>
        <p className="app-text">Nicolás OS v1.1</p>
        <p className="app-text app-soft">{s.built}</p>
      </section>
    </div>
  )
}

/* LEEME.txt */
export function Readme() {
  const { t } = useI18n()
  return (
    <div className="app-readme">
      {t.nos.readme.map((line, i) => (
        <p key={i} className={i === 0 ? 'app-title' : 'app-text'}>
          {line}
        </p>
      ))}
    </div>
  )
}
