import { useEffect, useRef, useState } from 'react'
import { PixelIcon } from './icons'
import { sceneFor } from './room-layout'
import { visibleInterval } from './visible-interval'
import './room.css'

/*
 * The room around the computer: a lofi pixel-art bedroom (public/room/room.png,
 * 476×268, shown with hard pixels) seen from behind the desk. The monitor's
 * screen is a hole in the picture; behind it sits a fake desktop in the style
 * of an old glassy Windows (wallpaper, icons, a music player, taskbar: nothing
 * on it works) and, as a window on that desktop, the real terminal card with
 * its start button. The head of whoever is at the desk overlaps the screen.
 * "Start" flies the camera into that window (NicolasOS).
 *
 * What moves comes from a 10 s clip of the same scene, cut into strips of
 * frames (one under the other, stepped with background-position):
 *   head, hands   nodding and typing, looped
 *   steam         over the mug, cross-faded into a seamless loop
 *   cat           asleep (breathing); every 10–15 s it either has a long
 *                 stretch or wakes to lick its paws, then sleeps again
 * Over the picture, full-frame layers switch on and off (fairy lights, city
 * windows) and a thin rain falls on the glass.
 *
 * Phones get a close relative of the picture, cut from another clip, and more
 * of the room above and below it (`Beyond`); whoever sits there types and
 * nods along (a strip of frames stepped from here, `Guy`).
 *
 * Reduced motion gets a still picture.
 *
 * Three layers: blurred backdrop and fake desktop behind the card, the
 * picture in front of it.
 */

// name → [x, y, width, height, frames, seconds] of each looping strip.
const STRIPS = {
  head: [134, 121, 72, 73, 60, 10],
  hands: [206, 212, 125, 56, 60, 10],
  steam: [344, 144, 40, 78, 50, 8.33],
}
const LAYERS = ['lights-a', 'lights-b', 'city-a', 'city-b']
const LAYERS_PHONE = ['m-lights-a', 'm-lights-b']
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const fx = (name) => (
  <i key={name} className={`nos-room__fx is-${name}`} style={{ backgroundImage: `url(/room/${name}.png)` }} />
)

function strip(name) {
  const [x, y, w, h, n, seconds] = STRIPS[name]
  return (
    <i
      key={name}
      className={`nos-room__sprite is-${name}`}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        '--h': `${h}px`,
        '--n': n,
        '--dur': `${seconds}s`,
        backgroundImage: `url(/room/${name}.png)`,
      }}
    />
  )
}

/* ---------- The cat ---------- */

// Frames of cat.png: 0–22 asleep, 23–59 waking, stretching and curling up
// again; 60 and 61 are 25 and 26 with the tongue out.
const CAT = { box: [344, 144, 132, 124], fps: 6 }
const range = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => (b >= a ? a + i : a - i))
const SLEEP = [...range(0, 22), ...range(21, 1)] // breathing, there and back
const ACTIONS = {
  stretch: range(23, 59),
  // wake, lower the head to the paws and lick a few times, settle back
  lick: [
    ...range(23, 27),
    27,
    26,
    60,
    61,
    60,
    26,
    60,
    61,
    60,
    26,
    27,
    26,
    60,
    61,
    60,
    61,
    60,
    26,
    27,
    27,
    ...range(27, 23),
  ],
}

function Cat({ frozen }) {
  const ref = useRef(null)
  useEffect(() => {
    if (frozen || reducedMotion()) return
    const el = ref.current
    const h = CAT.box[3]
    let seq = SLEEP
    let i = 0
    let next = performance.now() + 4000 + Math.random() * 4000 // the first one comes soon
    let last = 'lick'
    return visibleInterval(() => {
      i += 1
      if (seq === SLEEP) {
        // Only from the top of a breath (frame 22), where the clip continues.
        if (SLEEP[i % SLEEP.length] === 22 && performance.now() > next) {
          // Mostly take turns; now and then the same one twice.
          const other = last === 'lick' ? 'stretch' : 'lick'
          last = Math.random() < 0.75 ? other : last
          seq = ACTIONS[last]
          i = 0
        }
      } else if (i >= seq.length) {
        // The lick rewinds to frame 23, the stretch ends curled up: carry on
        // from the matching point of the sleep cycle.
        i = seq === ACTIONS.lick ? 23 : 0
        seq = SLEEP
        next = performance.now() + 10000 + Math.random() * 5000
      }
      el.style.backgroundPositionY = `${-h * seq[i % seq.length]}px`
    }, 1000 / CAT.fps)
  }, [frozen])

  const [x, y, w, h] = CAT.box
  return (
    <i
      ref={ref}
      className="nos-room__sprite is-cat"
      style={{ left: x, top: y, width: w, height: h, backgroundImage: 'url(/room/cat.png)' }}
    />
  )
}

/* ---------- The person, on phones ---------- */

// Frames of m-guy.png (the part of m-room.png where things move): 12 of
// typing, then the same 12 with the head a pixel lower (a nod).
const GUY = { box: [126, 112, 230, 158], typing: 12, fps: 6.6 }

/** Typing, there and back, nodding along to something. */
function Guy({ frozen }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const h = GUY.box[3]
    let i = 0
    let dir = 1
    let tick = 2
    const draw = () => {
      const nod = tick % 5 < 2 // a beat every 0.75 s
      el.style.backgroundPositionY = `${-h * (i + (nod ? GUY.typing : 0))}px`
    }
    draw()
    if (frozen || reducedMotion()) return
    return visibleInterval(() => {
      tick += 1
      if (i + dir >= GUY.typing || i + dir < 0) dir = -dir
      i += dir
      draw()
    }, 1000 / GUY.fps)
  }, [frozen])

  const [x, y, w, h] = GUY.box
  return (
    <i
      ref={ref}
      className="nos-room__sprite is-guy"
      style={{ left: x, top: y, width: w, height: h, backgroundImage: 'url(/room/m-guy.png)' }}
    />
  )
}

/* ---------- More room, on phones ----------
   A phone is tall: the picture goes on above (wall, a shelf, a neon sign, the
   ceiling) and below (the rest of the chair and of whoever sits on it, a bin, an old tower, the floor), drawn
   to match, with a few things of its own that move. Positions are in the
   picture's pixels; above it they are negative. */
const at = (x, y, w, h, name) => ({ left: x, top: y, width: w, height: h, backgroundImage: `url(/room/${name}.png)` })

function Beyond() {
  return (
    <>
      <img
        className="nos-room__ext"
        src="/room/m-top.png"
        width="480"
        height="128"
        alt=""
        draggable={false}
        style={{ top: -128 }}
      />
      <img
        className="nos-room__ext"
        src="/room/m-bottom.png"
        width="480"
        height="176"
        alt=""
        draggable={false}
        style={{ top: 270 }}
      />
      {/* the neon sign, lit (it flickers), and the glow-in-the-dark stars */}
      <i className="nos-room__glow is-neon" style={at(196, -96, 60, 36, 'm-neon')} />
      <i className="nos-room__glow is-stars" style={at(104, -128, 256, 20, 'm-stars')} />
      {/* the plant's vines sway; the speaker's light blinks */}
      <i
        className="nos-room__sprite"
        style={{ ...at(266, -38, 34, 37, 'm-vines'), '--h': '37px', '--n': 4, '--dur': '5.6s' }}
      />
      <i className="nos-room__led" style={{ left: 263, top: -42, color: '#6ef2b0', animationDuration: '3.1s' }} />
      {/* the old tower under the desk: the light under its power button blinks */}
      <i className="nos-room__led" style={{ left: 323, top: 326, width: 2, color: '#ffc08a' }} />
    </>
  )
}

/* ---------- The fake desktop on the monitor ---------- */

const ICONS = [
  ['PC', 'pc', '#bfe9ff'],
  ['Docs', 'folder', '#ffd75e'],
  ['Web', 'globe', '#7ff0b0'],
]

// What is "playing". Made-up tracks; the cover is two colours.
const TRACKS = [
  ['Lluvia en Madrid', 'nico.lofi', '#ff9ffc', '#5227ff'],
  ['Café a las 3 AM', 'nico.lofi', '#ffcf5c', '#c2410c'],
  ['Deploy en viernes', 'the commits', '#6ef2b0', '#0f766e'],
  ['404 Sleep Not Found', 'bug hunters', '#6ea8ff', '#1e3a8a'],
  ['Git Push & Chill', 'nico.lofi', '#fda4af', '#9d174d'],
]
const TRACK_MS = 20000

/** A small music player that changes song every 20 s; now and then it is
 *  closed for a moment and opened again. All pretend. */
function Player() {
  const [n, setN] = useState(0)
  const [open, setOpen] = useState(true)
  useEffect(() => {
    if (reducedMotion()) return
    let reopen = 0
    let count = 0
    const id = setInterval(() => {
      count += 1
      setN(count)
      if (count % 3 === 0) {
        setOpen(false)
        reopen = setTimeout(() => setOpen(true), 3200)
      }
    }, TRACK_MS)
    return () => {
      clearInterval(id)
      clearTimeout(reopen)
    }
  }, [])
  const [title, artist, a, b] = TRACKS[n % TRACKS.length]

  return (
    <div className={`nos-room__player${open ? '' : ' is-closed'}`}>
      <p className="nos-room__player-bar">
        <PixelIcon kind="note" />
        <span>lofi.fm</span>
        <i>×</i>
      </p>
      {/* key: the cover slides in and the progress bar restarts with each song */}
      <div key={n} className="nos-room__player-body">
        <span className="nos-room__cover" style={{ '--a': a, '--b': b }} />
        <b>{title}</b>
        <span>{artist}</span>
        <span className="nos-room__progress">
          <i />
        </span>
      </div>
      <p className="nos-room__controls">
        <i className="is-prev" />
        <i className="is-pause" />
        <i className="is-next" />
      </p>
    </div>
  )
}

/**
 * The fake desktop: wallpaper, icons, a music player and a glassy taskbar. In
 * the room it fills the monitor's screen; once the system runs it stays
 * behind it, as large as the camera left it.
 */
function FakeDesk({ style, onClick }) {
  const now = new Date()
  const clock = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(now).split(':')
  const date = new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(now)

  return (
    <div
      className={`nos-room__desk${onClick ? '' : ' is-backdrop'}`}
      style={style}
      onClick={onClick}
      aria-hidden="true"
    >
      <div className="nos-room__wall" />
      <ul className="nos-room__icons">
        {ICONS.map(([label, icon, color]) => (
          <li key={label} style={{ color }}>
            <PixelIcon kind={icon} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <Player />
      <div className="nos-room__taskbar">
        <b className="nos-room__orb">N</b>
        <span className="nos-room__pin" style={{ color: '#ffd75e' }}>
          <PixelIcon kind="folder" />
        </span>
        <span className="nos-room__pin is-busy" style={{ color: '#7ff0b0' }}>
          <PixelIcon kind="globe" />
        </span>
        <span className="nos-room__pin" style={{ color: '#9df7c3' }}>
          <PixelIcon kind="note" />
        </span>
        <span className="nos-room__pin is-open">
          <PixelIcon kind="terminal" />
          <em>Nicolás OS</em>
        </span>
        <span className="nos-room__tray">
          <span className="nos-room__eq">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="nos-room__clock">
            <span>
              {clock[0]}
              <i>:</i>
              {clock[1]}
            </span>
            <span>{date}</span>
          </span>
        </span>
      </div>
    </div>
  )
}

/* ---------- The room ---------- */

/**
 * `frozen`: the room as the camera left it after flying in (behind the
 * running system): nothing to click. On a computer the desktop and the
 * picture come zoomed (layout.deskOn, artOn); on a phone the caller zooms the
 * whole room instead.
 */
export default function Room({ layout, compact, onStart, frozen = false }) {
  const scene = sceneFor(compact)
  const zoomed = frozen && !compact
  return (
    <>
      {/* Behind everything: the same picture, blurred, where it doesn't reach. */}
      {!frozen && <div className="nos-room__back" aria-hidden="true" />}

      {/* What the monitor shows around the Nicolás OS window: a desktop that
          only looks like one. A click on it starts, like the window. */}
      <FakeDesk style={zoomed ? layout.deskOn : layout.desk} onClick={frozen ? undefined : onStart} />

      <div
        className={`nos-room__art${frozen ? ' is-frozen' : ''}`}
        style={zoomed ? layout.artOn : layout.art}
        aria-hidden="true"
      >
        <img
          src={compact ? '/room/m-room.png' : '/room/room.png'}
          width={scene.w}
          height={scene.h}
          alt=""
          draggable={false}
        />
        {(compact ? LAYERS_PHONE : LAYERS).map(fx)}
        {compact ? (
          <>
            <Guy frozen={frozen} />
            <Beyond />
          </>
        ) : (
          <>
            <i className="nos-room__rain" />
            {strip('head')}
            {strip('hands')}
            <Cat frozen={frozen} />
            {strip('steam')}
          </>
        )}
      </div>
    </>
  )
}
