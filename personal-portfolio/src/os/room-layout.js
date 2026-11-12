/* Geometry of the room scene (see Room.jsx and NicolasOS.jsx). */

// The two pictures, in their own pixels. `screen` is the monitor's screen (a
// hole in the picture: what is on it shows through), `area` where a window
// can sit on that screen, as fractions of it: to the right of the head (which
// covers the bottom left) and above the fake taskbar. `focus` is what must
// show across the width when the picture is wider than the page.
const WIDE = {
  w: 476,
  h: 268,
  screen: { x: 170, y: 90, w: 146, h: 96 },
  area: { x0: 0.27, x1: 0.975, y0: 0.06, y1: 0.86 },
  focus: { x: 132, w: 198 },
}
// Phones get a close relative, cut from another clip (and more room above and
// below it: Room.jsx).
const TALL = {
  w: 480,
  h: 270,
  screen: { x: 175, y: 89, w: 143, h: 94 },
  area: { x0: 0.25, x1: 0.975, y0: 0.06, y1: 0.86 },
  focus: { x: 126, w: 214 },
}
export const sceneFor = (compact) => (compact ? TALL : WIDE)

export const COMPACT_FLY_MS = 1300 // phones: the camera's flight to the monitor (room.css reads it from --cam-dur)

/**
 * A zoom of z× feels even when the scale grows geometrically, not linearly.
 * This is that curve as a CSS easing (for a transition between scale 1 and
 * scale z), eased at both ends; `out` is the same flight backwards.
 */
function zoomEase(z, out) {
  const stops = []
  for (let i = 0; i <= 32; i++) {
    const p = out ? 1 - i / 32 : i / 32
    const e = p < 0.5 ? 2 * p * p : 1 - (2 - 2 * p) ** 2 / 2
    const g = (z ** e - 1) / (z - 1)
    stops.push(+(out ? 1 - g : g).toFixed(4))
  }
  return `linear(${stops.join(', ')})`
}

/**
 * Where everything goes for a viewport of vw × vh:
 *   art     size, scale and offset of the picture
 *   desk    the fake desktop filling the monitor's screen
 *   term    the terminal card while idle: a window on that desktop, laid out
 *           at a comfortable virtual size and scaled down
 *   boot    (computers) the card while the system starts: already at its
 *           final size (the one it has once the system runs), scaled down
 *           onto that window
 *   cam     the transform that undoes that, so the flight ends with the card
 *           exactly where it will stay: no cut. On a phone, the flight to
 *           the window on the monitor, in two parts (the zoom apart: room.css)
 * On a computer only:
 *   deskOn  the fake desktop as it stands at the end of the flight, kept
 *           behind the running system
 *   artOn   the picture as it stands at the end of the flight (the monitor's
 *           frame may show at the edges), kept there too
 */
export function roomLayout(vw, vh, compact) {
  if (!vw || !vh) return null
  const S = sceneFor(compact)
  const whole = Math.min(vw / S.w, vh / S.h)
  // On a computer the whole picture shows (it may lose a sliver, 5% at most,
  // to fill the window better); on a phone the desk takes the width.
  const cover = Math.max(vw / S.w, vh / S.h)
  let s = compact ? Math.max(whole, (vw * 0.98) / S.focus.w) : Math.min(cover, whole * 1.05)
  if (s > 2) s = Math.floor(s * 4) / 4 // steps of a quarter keep the pixels even
  const cx = S.focus.x + S.focus.w / 2
  const left = S.w * s > vw ? vw / 2 - cx * s : (vw - S.w * s) / 2
  const top = (vh - S.h * s) * (compact ? 0.42 : 0.5)

  const screen = { left: left + S.screen.x * s, top: top + S.screen.y * s, w: S.screen.w * s, h: S.screen.h * s }
  const deskW = compact ? 560 : 1100
  const kd = screen.w / deskW
  const art = { width: S.w, height: S.h, transform: `translate(${Math.round(left)}px, ${Math.round(top)}px) scale(${s})` }
  const desk = { left: screen.left, top: screen.top, width: deskW, height: screen.h / kd, transform: `scale(${kd})` }

  // The card's final box (os.css: .nos-term), centred in the viewport.
  const margin = compact ? 8 : 20
  const fw = compact ? vw - margin * 2 : Math.min(vw - margin * 2, 1440)
  const fh = compact ? vh - margin * 2 : Math.min(vh - margin * 2, 880)

  // The free part of the monitor's screen.
  const free = {
    left: screen.left + screen.w * S.area.x0,
    top: screen.top + screen.h * S.area.y0,
    w: screen.w * (S.area.x1 - S.area.x0),
    h: screen.h * (S.area.y1 - S.area.y0),
  }

  if (compact) {
    // Idle: a window over the whole free area. Started, the camera flies to
    // it, until it is as wide as the card will be; the system then fades in
    // from black (NicolasOS).
    const termW = 430
    const kt = free.w / termW
    const zoom = Math.min(3, fw / free.w)
    const C = { x: free.left + free.w / 2, y: free.top + free.h / 2 }
    return {
      art,
      desk,
      term: {
        inset: 'auto',
        left: free.left,
        top: free.top,
        width: termW,
        height: free.h / kt,
        transform: `scale(${kt})`,
        borderRadius: 4 / kt,
      },
      cam: {
        '--cam-origin': `${C.x}px ${C.y}px`,
        // moving (eased as usual) apart from the zoom (on its own curve: zoomEase)
        '--cam-zoom': `translate(${vw / 2 - C.x}px, ${vh / 2 - C.y}px)`,
        '--cam-scale': `scale(${zoom})`,
        '--cam-dur': `${COMPACT_FLY_MS}ms`,
        '--cam-ease': zoomEase(zoom, false),
        '--cam-ease-out': zoomEase(zoom, true),
      },
    }
  }

  // Where the card boots, in its final shape: the largest window of that
  // shape in the free area (centred, so the desktop shows on every side once
  // the camera is in). Idle, the window is there too.
  const termW = 760
  const fitW = Math.min(free.w, (free.h * fw) / fh)
  const fly = { w: fitW, h: (fitW * fh) / fw }
  fly.left = free.left + (free.w - fly.w) / 2
  fly.top = free.top + (free.h - fly.h) / 2
  const kb = fly.w / fw
  const kt = fly.w / termW

  const ox = fly.left + fly.w / 2
  const oy = fly.top + fly.h / 2

  // Where the fake desktop ends up once the camera has flown in: it stays
  // there, behind the running system, as if the camera had just come closer.
  const zoom = 1 / kb
  const tx = vw / 2 - ox
  const ty = vh / 2 - oy
  const deskOn = {
    left: ox + tx + zoom * (screen.left - ox),
    top: oy + ty + zoom * (screen.top - oy),
    width: deskW,
    height: screen.h / kd,
    transform: `scale(${kd * zoom})`,
  }

  // …and the picture around it, so the monitor's frame stays where the
  // camera left it instead of fading out.
  const artOn = {
    width: S.w,
    height: S.h,
    transform: `translate(${ox + tx + zoom * (left - ox)}px, ${oy + ty + zoom * (top - oy)}px) scale(${s * zoom})`,
  }

  return {
    deskOn,
    artOn,
    art,
    desk,
    // Rounded like the running system's card (os.css: 14px) as it will look
    // on screen once the flight starts, so the corners never change.
    term: {
      inset: 'auto',
      left: fly.left,
      top: fly.top,
      width: termW,
      height: fly.h / kt,
      transform: `scale(${kt})`,
      borderRadius: (14 * kb) / kt,
    },
    boot: { inset: 'auto', left: fly.left, top: fly.top, width: fw, height: fh, transform: `scale(${kb})` },
    cam: {
      '--cam-origin': `${ox}px ${oy}px`,
      '--cam-zoom': `translate(${tx}px, ${ty}px) scale(${zoom})`,
    },
  }
}
