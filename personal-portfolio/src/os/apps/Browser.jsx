import { useEffect, useState } from 'react'
import { LuArrowLeft, LuArrowRight, LuHouse, LuLock, LuPlus, LuRotateCw, LuX } from 'react-icons/lu'
import { useI18n } from '../../i18n'
import { PixelIcon } from '../icons'
import Runner from './Runner'
import './browser.css'

/*
 * FurniBrowser: a browser with no connection, on purpose. Tabs, history and
 * the address bar work, but every page "connects" (a row of dots) and then
 * lands on the offline runner game. That's the joke, and the game.
 */

const HOME = 'furni://inicio'
const CONNECT_MS = 2600

const tabId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
const makeTab = (url) => ({ id: tabId(), stack: [url || HOME], i: 0 })

// What the address bar text means: an address as typed, or a search.
function resolveInput(text) {
  const v = text.trim()
  if (!v) return HOME
  if (/^[a-z]+:\/\//i.test(v)) return v
  if (/^[\w-]+(\.[\w-]+)*\.[a-z]{2,}(\/.*)?$/i.test(v)) return `https://${v}`
  return `furni://buscar?q=${encodeURIComponent(v)}`
}

const fill = (template, params) =>
  Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template)
const tabTitle = (url) => decodeURIComponent(url.replace(/^[a-z]+:\/\//i, '').replace(/\/$/, '')) || url

// "Connecting…" with the classic row of dots, cycling through fake steps.
function Connecting({ url, b }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep((n) => Math.min(n + 1, b.steps.length - 1)), 700)
    return () => clearInterval(id)
  }, [b.steps.length])
  return (
    <div className="fb-connecting" role="status">
      <div className="fb-connecting__main">
        <PixelIcon kind="globe" />
        <p>{fill(b.connecting, { url })}</p>
        <p className="fb-dim">{b.steps[step]}</p>
      </div>
      <span className="fb-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  )
}

export default function Browser({ params = {} }) {
  const { t } = useI18n()
  const b = t.nos.browser
  const [state, setState] = useState(() => {
    const first = makeTab(params.url)
    return { tabs: [first], active: first.id }
  })
  // Every load (opening, navigating, reloading, a new tab) "connects" first.
  const [loads, setLoads] = useState(0)
  const [connecting, setConnecting] = useState(true)
  const load = () => {
    setConnecting(true)
    setLoads((n) => n + 1)
  }
  useEffect(() => {
    const id = setTimeout(() => setConnecting(false), CONNECT_MS)
    return () => clearTimeout(id)
  }, [loads])

  // Re-opening the app with a new nonce (from a desktop icon or the
  // terminal) opens that address in a new tab. Derived during render, not in
  // an effect, so the new tab shows up in the same paint.
  const [seenNonce, setSeenNonce] = useState(params.nonce)
  if (params.nonce !== seenNonce) {
    setSeenNonce(params.nonce)
    setState((s) => {
      const current = s.tabs.find((x) => x.id === s.active)
      if (current && current.stack[current.i] === params.url) return s
      const tab = makeTab(params.url)
      return { tabs: [...s.tabs, tab], active: tab.id }
    })
    load()
  }

  const tab = state.tabs.find((x) => x.id === state.active) ?? state.tabs[0]
  const url = tab.stack[tab.i]

  const update = (fn) => {
    setState((s) => ({ ...s, tabs: s.tabs.map((x) => (x.id === s.active ? fn(x) : x)) }))
    load()
  }
  const go = (next) =>
    update((x) => (x.stack[x.i] === next ? x : { ...x, stack: [...x.stack.slice(0, x.i + 1), next], i: x.i + 1 }))
  const back = () => update((x) => ({ ...x, i: Math.max(0, x.i - 1) }))
  const forward = () => update((x) => ({ ...x, i: Math.min(x.stack.length - 1, x.i + 1) }))
  const newTab = () => {
    setState((s) => {
      const created = makeTab(HOME)
      return { tabs: [...s.tabs, created], active: created.id }
    })
    load()
  }
  const closeTab = (id) =>
    setState((s) => {
      const rest = s.tabs.filter((x) => x.id !== id)
      if (!rest.length) {
        const fresh = makeTab(HOME)
        return { tabs: [fresh], active: fresh.id }
      }
      const idx = s.tabs.findIndex((x) => x.id === id)
      const active = s.active === id ? rest[Math.max(0, idx - 1)].id : s.active
      return { tabs: rest, active }
    })

  return (
    <div className="fb nos-screen">
      <div className="fb-tabs" role="tablist" aria-label={b.tabs}>
        {state.tabs.map((x) => {
          const active = x.id === tab.id
          return (
            <div key={x.id} className={`fb-tab${active ? ' is-active' : ''}`}>
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className="fb-tab__main"
                onClick={() => setState((s) => ({ ...s, active: x.id }))}
              >
                <PixelIcon kind="globe" />
                <span>{tabTitle(x.stack[x.i])}</span>
              </button>
              <button type="button" className="fb-tab__close" onClick={() => closeTab(x.id)} aria-label={b.closeTab}>
                <LuX aria-hidden="true" />
              </button>
            </div>
          )
        })}
        <button type="button" className="fb-tab-new" onClick={newTab} aria-label={b.newTab}>
          <LuPlus aria-hidden="true" />
        </button>
      </div>

      <div className="fb-toolbar">
        <button type="button" onClick={back} disabled={tab.i === 0} aria-label={b.back}>
          <LuArrowLeft aria-hidden="true" />
        </button>
        <button type="button" onClick={forward} disabled={tab.i >= tab.stack.length - 1} aria-label={b.forward}>
          <LuArrowRight aria-hidden="true" />
        </button>
        <button type="button" onClick={load} aria-label={b.reload}>
          <LuRotateCw aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(HOME)} aria-label={b.home}>
          <LuHouse aria-hidden="true" />
        </button>
        <form
          className="fb-address"
          onSubmit={(e) => {
            e.preventDefault()
            go(resolveInput(new FormData(e.currentTarget).get('address') || ''))
          }}
        >
          <LuLock aria-hidden="true" />
          <input
            key={`${tab.id}:${url}`}
            name="address"
            defaultValue={url}
            aria-label={b.address}
            autoComplete="off"
            spellCheck={false}
            onFocus={(e) => e.target.select()}
          />
        </form>
      </div>

      <div className="fb-page" data-lenis-prevent>
        {connecting ? (
          <Connecting key={loads} url={url} b={b} />
        ) : (
          <div className="fb-offline">
            <Runner autoFocus />
            <p className="fb-offline__title">{b.offlineTitle}</p>
            <p className="fb-offline__try">{b.tryTitle}</p>
            <ul className="fb-offline__list">
              {b.tryList.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <p className="fb-offline__code">ERR_INTERNET_DISCONNECTED</p>
          </div>
        )}
      </div>
    </div>
  )
}
