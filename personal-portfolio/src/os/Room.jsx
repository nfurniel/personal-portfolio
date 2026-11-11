import { PixelIcon } from './icons'
import { ART } from './room-layout'
import './room.css'

/*
 * The room around the computer: a lofi pixel-art bedroom (public/room/room.png,
 * 476×268, shown with hard pixels) seen from behind the desk. The monitor's
 * screen is a hole in the picture; behind it sits a fake desktop in the style
 * of an old glassy Windows (wallpaper, icons, taskbar: nothing on it works)
 * and, as a window on that desktop, the real terminal card with its start
 * button. The head of whoever is at the desk overlaps the screen. "Start"
 * flies the camera into that window (NicolasOS).
 *
 * What moves comes from a 10 s loop of the same scene, cut into strips of 60
 * frames (one under the other, stepped with background-position): the head
 * nodding, the hands typing and on the mouse, and the cat (asleep, then a
 * long stretch, then asleep again) with the steam of the mug beside it. Over
 * the picture, full-frame layers switch on and off: fairy lights and city
 * windows; and a thin rain falls on the glass.
 *
 * Phones get the head and hands only; reduced motion gets a still picture.
 *
 * Three layers: blurred backdrop and fake desktop behind the card, the
 * picture in front of it.
 */

// name → [x, y, width, height] of each strip's frame in the picture.
const SPRITES = { head: [134, 121, 72, 73], hands: [206, 212, 125, 56], cat: [344, 144, 132, 124] }
const LAYERS = ['lights-a', 'lights-b', 'city-a', 'city-b']
const LAYERS_LITE = ['lights-a', 'lights-b']
const ICONS = [
  ['PC', 'chip'],
  ['Docs', 'folder'],
  ['Web', 'globe'],
]

const fx = (name) => <i key={name} className={`nos-room__fx is-${name}`} style={{ backgroundImage: `url(/room/${name}.png)` }} />

function sprite(name) {
  const [x, y, w, h] = SPRITES[name]
  return (
    <i
      key={name}
      className={`nos-room__sprite is-${name}`}
      style={{ left: x, top: y, width: w, height: h, '--h': `${h}px`, backgroundImage: `url(/room/${name}.png)` }}
    />
  )
}

/**
 * The fake desktop on the monitor: an old glassy Windows in spirit (wallpaper,
 * icons, taskbar; nothing works). In the room it fills the monitor's screen;
 * once the system runs it stays behind it, as large as the camera left it.
 */
export function FakeDesk({ style, onClick }) {
  const now = new Date()
  const clock = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(now).split(':')
  const date = new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(now)

  return (
    <div className={`nos-room__desk${onClick ? '' : ' is-backdrop'}`} style={style} onClick={onClick} aria-hidden="true">
      <div className="nos-room__wall" />
      <ul className="nos-room__icons">
        {ICONS.map(([label, icon]) => (
          <li key={label}>
            <PixelIcon kind={icon} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <div className="nos-room__taskbar">
        <b className="nos-room__orb">N</b>
        <span className="nos-room__pin">
          <PixelIcon kind="folder" />
        </span>
        <span className="nos-room__pin is-busy">
          <PixelIcon kind="globe" />
        </span>
        <span className="nos-room__pin is-open">
          <PixelIcon kind="terminal" />
          <em>Nicolás OS</em>
        </span>
        <span className="nos-room__tray">
          {/* Something is playing: it is a lofi room, after all. */}
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

/**
 * `frozen`: the room as the camera left it after flying in (zoomed, behind the
 * running system): desktop and picture only, nothing to click.
 */
export default function Room({ layout, compact, onStart, frozen = false }) {
  return (
    <>
      {/* Behind everything: the same picture, blurred, where it doesn't reach. */}
      {!frozen && <div className="nos-room__back" aria-hidden="true" />}

      {/* What the monitor shows around the Nicolás OS window: a desktop that
          only looks like one. A click on it starts, like the window. */}
      <FakeDesk style={frozen ? layout.deskOn : layout.desk} onClick={frozen ? undefined : onStart} />

      <div className="nos-room__art" style={frozen ? layout.artOn : layout.art} aria-hidden="true">
        <img src="/room/room.png" width={ART.w} height={ART.h} alt="" draggable={false} />
        {(compact ? LAYERS_LITE : LAYERS).map(fx)}
        {!compact && <i className="nos-room__rain" />}
        {(compact ? ['head', 'hands'] : ['head', 'hands', 'cat']).map(sprite)}
      </div>
    </>
  )
}
