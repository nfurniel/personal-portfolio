import { LuArrowUpRight } from 'react-icons/lu'
import { useI18n } from '../../i18n'
import { PROJECTS } from '../data'
import { PixelIcon } from '../icons'

/*
 * A project file (QuickArrival.app, Veta.exe…): its own window, read like a
 * short case file instead of a wall of text. Header, a four-cell data sheet,
 * "how I built it" as numbered steps, the stack with what each piece does,
 * and a link that opens the real site in a new browser tab.
 *
 * The copy lives in i18n: the tag and description in t.projects.items, the
 * rest in t.nos.project.items (one entry per project id).
 */

const host = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

export default function Project({ params }) {
  const { t } = useI18n()
  const p = PROJECTS.find((x) => x.id === params.id)
  if (!p) return null
  const l = t.nos.project.labels
  const copy = t.projects.items[p.id]
  const info = t.nos.project.items[p.id]
  const sheet = [
    [l.type, info.type],
    [l.year, info.year],
    [l.role, info.role],
    [l.status, info.status],
  ]

  return (
    <article className="app-proj">
      <header className="app-proj__head">
        <span className="app-proj__icon" aria-hidden="true">
          <PixelIcon kind={p.icon} />
        </span>
        <div>
          <p className="app-kicker">&gt; cat {p.file}</p>
          <h4 className="app-title">{p.title}</h4>
          <p className="app-dim">{copy.tag}</p>
        </div>
      </header>

      <p className="app-text app-proj__lede">{copy.description}</p>

      <dl className="app-proj__sheet">
        {sheet.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <p className="app-kicker"># {l.how}</p>
        <ol className="app-proj__steps">
          {info.steps.map(([title, text], i) => (
            <li key={title}>
              <span className="app-proj__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="app-proj__step">{title}</p>
                <p className="app-text app-soft">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <p className="app-kicker"># {l.stack}</p>
        <ul className="app-list app-proj__tech">
          {info.tech.map(([name, use]) => (
            <li key={name}>
              <b>{name}</b>
              <span>{use}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="app-proj__foot">
        <a className="app-cta" href={p.href} target="_blank" rel="noopener noreferrer">
          {l.open} <LuArrowUpRight aria-hidden="true" />
        </a>
        <span className="app-dim">
          {host(p.href)} · {l.external}
        </span>
      </footer>
    </article>
  )
}
