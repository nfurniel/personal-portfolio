import { useEffect, useRef, useState } from 'react'
import { portfolioData } from '../components/PortfolioData'
import { SUPPORTED_LANGUAGES, useI18n } from '../i18n'
import { useOS, windowKey } from './context'
import { getTheme, setTheme } from './theme'
import { DESKTOP, FOLDERS, PROJECTS } from './data'
import { APPS, appMeta } from './registry'

/*
 * terminal.exe: the Nicolás OS terminal, as a window. It keeps its dark
 * screen in both themes.
 *
 * It drives the whole system: open/close any app, folder or project, change
 * language and theme, open the offline FurniBrowser with `furni`, run snake,
 * shut down, go fullscreen; plus help, ls, cat, web, whoami, contact,
 * history, date, echo, clear. ↑/↓ walk the history, Tab completes commands
 * and names, Ctrl+L clears.
 */

const COMMANDS = [
  'help', 'ls', 'cat', 'open', 'close', 'web', 'furni', 'browser', 'whoami', 'contact', 'cv', 'snake',
  'lang', 'theme', 'fullscreen', 'history', 'date', 'echo', 'clear', 'exit',
]

const email = portfolioData.header.social.email.replace('mailto:', '')
const { linkedin, github } = portfolioData.header.social
const strip = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

function fill(template, params) {
  return Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template)
}

export default function TerminalShell() {
  const { t, language, setLanguage } = useI18n()
  const os = useOS()
  const sh = t.projects.shell
  const prompt = 'nicolas@os:~$'
  const nextId = useRef(2)
  const [entries, setEntries] = useState(() => [
    { id: 0, kind: 'out', node: <b className="nos-strong">Nicolás OS · terminal v1.1</b> },
    { id: 1, kind: 'out', node: <span className="nos-dim">{sh.welcome}</span> },
  ])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState([])
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef(null)
  const logRef = useRef(null)

  // Keep the newest output in view.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [entries])

  // Everything you can name: desktop entries, folder contents (projects, games).
  const targets = [
    ...Object.keys(APPS)
      .filter((app) => app !== 'project')
      .map((app) => ({ app, params: {}, ...appMeta(app, {}, t) })),
    ...PROJECTS.map((p) => ({ app: 'project', params: { id: p.id }, ...appMeta('project', { id: p.id }, t) })),
  ]
  const names = targets.map((x) => x.title)

  const find = (raw) => {
    const q = raw.replace(/^\.\//, '').replace(/\/$/, '').toLowerCase()
    if (!q) return null
    return targets.find((x) => {
      const title = x.title.toLowerCase()
      return (
        title === q ||
        title.replace(/\.[^.]+$/, '') === q ||
        x.name.toLowerCase() === q ||
        x.app === q ||
        x.params.id === q
      )
    })
  }

  const push = (...lines) =>
    setEntries((list) => [...list, ...lines.map((line) => ({ id: nextId.current++, ...line }))])

  const run = (raw) => {
    const line = raw.trim()
    push({ kind: 'cmd', text: raw })
    if (!line) return
    setHistory((h) => [...h, line])
    setCursor(-1)

    const [head, ...rest] = line.split(/\s+/)
    const cmd = head.toLowerCase()
    const arg = rest.join(' ')
    const out = (node) => push({ kind: 'out', node })
    const err = (text) => push({ kind: 'err', node: text })

    const openTarget = (name) => {
      const target = find(name)
      if (!target) return err(fill(sh.noFile, { cmd: 'open', file: name }))
      os.open(target.app, target.params, { focus: false })
      out(fill(sh.opened, { file: target.title }))
    }

    // Running something directly (./snake.exe, ./Veta.exe) opens it.
    if (cmd.startsWith('./')) return openTarget(cmd)

    switch (cmd) {
      case 'help':
        out(
          <span className="nos-help">
            {sh.help.map(([c, d]) => (
              <span key={c} className="nos-help__row">
                <b>{c}</b>
                <span>{d}</span>
              </span>
            ))}
          </span>,
        )
        out(<span className="nos-dim">{sh.tip}</span>)
        break
      case 'ls':
      case 'dir': {
        const folder = arg ? find(arg) : null
        if (arg && (!folder || !FOLDERS[folder.app])) return err(fill(sh.noFile, { cmd, file: arg }))
        const list = folder
          ? FOLDERS[folder.app].map((it) => appMeta(it.app, it.params, t).title)
          : DESKTOP.map((app) => appMeta(app, {}, t).title + (APPS[app].folder ? '/' : ''))
        out(
          <span className="nos-files">
            {list.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </span>,
        )
        break
      }
      case 'cat': {
        if (!arg) return err(fill(sh.usage, { cmd }))
        const target = find(arg)
        if (!target) return err(fill(sh.noFile, { cmd, file: arg }))
        if (target.app === 'project') {
          const p = PROJECTS.find((x) => x.id === target.params.id)
          const copy = t.projects.items[p.id]
          out(<b className="nos-strong"># {p.title}</b>)
          out(<span className="nos-dim">{copy.tag}</span>)
          out(copy.description)
          out(<span className="nos-dim">{sh.stack}: {p.tech.join(' · ')}</span>)
        } else if (target.app === 'readme') {
          t.nos.readme.forEach((l) => out(l))
        } else if (target.app === 'about') {
          out(t.about.description)
        } else if (FOLDERS[target.app]) {
          err(fill(sh.isDir, { file: target.title }))
        } else {
          out(<span className="nos-dim">{fill(sh.tryOpen, { file: target.title })}</span>)
        }
        break
      }
      case 'open':
        if (!arg) return err(fill(sh.usage, { cmd }))
        openTarget(arg)
        break
      case 'close': {
        if (!arg) return err(fill(sh.usage, { cmd }))
        if (arg.toLowerCase() === 'all') {
          os.closeAll()
          out(sh.closedAll)
          return
        }
        const target = find(arg)
        if (!target) return err(fill(sh.noFile, { cmd, file: arg }))
        const key = windowKey(target.app, target.params)
        if (!os.isOpen(key)) return err(fill(sh.notOpen, { file: target.title }))
        os.close(key)
        out(fill(sh.closed, { file: target.title }))
        break
      }
      case 'web': {
        if (!arg) return err(fill(sh.usage, { cmd }))
        const target = find(arg)
        const p = target?.app === 'project' && PROJECTS.find((x) => x.id === target.params.id)
        if (!p) return err(fill(sh.noFile, { cmd, file: arg }))
        window.open(p.href, '_blank', 'noopener,noreferrer')
        out(fill(sh.opening, { title: p.title }))
        break
      }
      case 'whoami':
        out(`Nicolás Furnieles — ${t.hero.title.join(' ')}`)
        break
      case 'contact':
        out(
          <span className="nos-help">
            <span className="nos-help__row">
              <b>email</b>
              <a href={`mailto:${email}`}>{email}</a>
            </span>
            <span className="nos-help__row">
              <b>linkedin</b>
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                {strip(linkedin)}
              </a>
            </span>
            <span className="nos-help__row">
              <b>github</b>
              <a href={github} target="_blank" rel="noopener noreferrer">
                {strip(github)}
              </a>
            </span>
          </span>,
        )
        break
      case 'cv':
      case 'snake':
      case 'browser':
        openTarget(cmd)
        break
      case 'furni':
        os.open('browser', { url: arg ? `furni://buscar?q=${encodeURIComponent(arg)}` : 'furni://inicio' }, { focus: false })
        out(arg ? fill(sh.searching, { q: arg }) : fill(sh.opened, { file: 'FurniBrowser' }))
        break
      case 'lang': {
        const code = arg.toLowerCase()
        if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
          setLanguage(code)
          out(sh.langDone)
        } else {
          err(sh.langUsage)
        }
        break
      }
      case 'theme': {
        const next = { dark: 'dark', light: 'light', oscuro: 'dark', claro: 'light', sombre: 'dark', clair: 'light' }[arg.toLowerCase()]
        if (!next) return err(sh.themeUsage)
        if (next !== getTheme()) setTheme(next, inputRef.current)
        out(sh.themeDone[next])
        break
      }
      case 'fullscreen':
        os.toggleFullscreen()
        break
      case 'history':
        out(
          <span className="nos-help">
            {[...history, line].map((h, i) => (
              <span key={i} className="nos-help__row">
                <b>{String(i + 1).padStart(3, ' ')}</b>
                <span>{h}</span>
              </span>
            ))}
          </span>,
        )
        break
      case 'date':
        out(
          new Intl.DateTimeFormat(language, { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(
            new Date(),
          ) + ' (Madrid)',
        )
        break
      case 'echo':
        out(arg)
        break
      case 'clear':
      case 'cls':
        setEntries([])
        break
      case 'exit':
      case 'shutdown':
      case 'logout':
        out(sh.shutdown)
        setTimeout(os.shutdown, 450)
        break
      case 'sudo':
      case 'rm':
        err(sh.sudo)
        break
      default:
        err(fill(sh.notFound, { cmd: head }))
    }
  }

  const complete = () => {
    const parts = value.split(' ')
    const token = parts[parts.length - 1]
    const pool = parts.length === 1 ? [...COMMANDS, ...names.map((f) => `./${f}`)] : [...names, 'all']
    const matches = pool.filter((p) => p.toLowerCase().startsWith(token.toLowerCase()))
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0]
      setValue(parts.join(' ') + (parts.length === 1 && COMMANDS.includes(matches[0]) ? ' ' : ''))
    } else if (matches.length > 1) {
      push({ kind: 'cmd', text: value }, { kind: 'out', node: matches.join('   ') })
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      run(value)
      setValue('')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      complete()
    } else if (e.key === 'ArrowUp') {
      if (!history.length) return
      e.preventDefault()
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(next)
      setValue(history[next])
    } else if (e.key === 'ArrowDown') {
      if (cursor === -1) return
      e.preventDefault()
      const next = cursor + 1
      if (next >= history.length) {
        setCursor(-1)
        setValue('')
      } else {
        setCursor(next)
        setValue(history[next])
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setEntries([])
    }
  }

  const focusPrompt = (e) => {
    if (e.target.closest('a, button')) return
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <div ref={logRef} className="app-term nos-screen" onClick={focusPrompt} data-lenis-prevent>
      <div role="log" aria-live="polite">
        {entries.map((entry) =>
          entry.kind === 'cmd' ? (
            <p key={entry.id}>
              <span className="nos-prompt">{prompt}</span> {entry.text}
            </p>
          ) : (
            <p key={entry.id} className={entry.kind === 'err' ? 'nos-err' : 'nos-out'}>
              {entry.node}
            </p>
          ),
        )}
      </div>

      <p className="app-term__line">
        <label className="nos-prompt" htmlFor="os-shell-input">
          {prompt}
        </label>
        <input
          id="os-shell-input"
          ref={inputRef}
          className="nos-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={sh.placeholder}
          aria-label={sh.inputLabel}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          // On a phone, focusing would pop the keyboard over the window.
          data-autofocus={os.compact ? undefined : ''}
        />
      </p>
    </div>
  )
}
