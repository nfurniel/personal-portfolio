/* Geometry of the room scene (see Room.jsx and NicolasOS.jsx). */

// Native pixels of the picture and of the monitor's screen inside it (a hole
// in the picture: what is on the screen shows through).
export const ART = { w: 476, h: 268 }
const SCREEN = { x: 170, y: 90, w: 146, h: 96 }
// What a phone must show across its width: the monitor and the head before it.
const FOCUS = { x: 132, w: 198 }
// Where a window can sit on that screen, as fractions of it: to the right of
// the head (which covers the bottom left) and above the fake taskbar.
const AREA = { x0: 0.27, x1: 0.975, y0: 0.06, y1: 0.86 }

/**
 * Where everything goes for a viewport of vw × vh:
 *   art     scale and offset of the picture
 *   desk    the fake desktop filling the monitor's screen
 *   term    the terminal card while idle: a window on that desktop, laid out
 *           at a comfortable virtual size and scaled down
 *   boot    the card during the flight in: already at its final size (the one
 *           it has once the system runs), scaled down onto the same window
 *   cam     the transform that undoes that scale, so the flight ends with the
 *           card exactly where it will stay: no cut
 *   deskOn  the fake desktop as it stands at the end of the flight, kept
 *           behind the running system
 *   artOn   the picture as it stands at the end of the flight (the monitor's
 *           frame may show at the edges), kept there too
 */
export function roomLayout(vw, vh, compact) {
  if (!vw || !vh) return null
  const whole = Math.min(vw / ART.w, vh / ART.h)
  // On a computer the whole picture shows (it may lose a sliver, 5% at most,
  // to fill the window better); on a phone the monitor takes the width.
  const cover = Math.max(vw / ART.w, vh / ART.h)
  let s = compact ? Math.max(whole, (vw * 0.98) / FOCUS.w) : Math.min(cover, whole * 1.05)
  if (s > 2) s = Math.floor(s * 4) / 4 // steps of a quarter keep the pixels even
  const cx = FOCUS.x + FOCUS.w / 2
  const left = ART.w * s > vw ? vw / 2 - cx * s : (vw - ART.w * s) / 2
  const top = (vh - ART.h * s) * (compact ? 0.42 : 0.5)

  const screen = { left: left + SCREEN.x * s, top: top + SCREEN.y * s, w: SCREEN.w * s, h: SCREEN.h * s }
  const deskW = compact ? 560 : 1100
  const kd = screen.w / deskW

  // The card's final box (os.css: .nos-term), centred in the viewport.
  const margin = compact ? 8 : 20
  const fw = compact ? vw - margin * 2 : Math.min(vw - margin * 2, 1440)
  const fh = compact ? vh - margin * 2 : Math.min(vh - margin * 2, 880)

  // The largest window of that shape in the free area of the screen.
  const area = { w: screen.w * (AREA.x1 - AREA.x0), h: screen.h * (AREA.y1 - AREA.y0) }
  const fitW = Math.min(area.w, (area.h * fw) / fh)
  const fly = { w: fitW, h: (fitW * fh) / fw }
  // Centred in that area: once the camera is in, the desktop shows on every side.
  fly.left = screen.left + screen.w * AREA.x0 + (area.w - fly.w) / 2
  fly.top = screen.top + screen.h * AREA.y0 + (area.h - fly.h) / 2
  const kb = fly.w / fw

  // Idle: on a phone the final shape would be a sliver, so the window takes
  // the whole free area instead and changes shape when the flight starts.
  const idle = compact
    ? { left: screen.left + screen.w * AREA.x0, top: screen.top + screen.h * AREA.y0, w: area.w, h: area.h }
    : fly
  const termW = compact ? 430 : 760
  const kt = idle.w / termW

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
    transform: `translate(${ox + tx + zoom * (left - ox)}px, ${oy + ty + zoom * (top - oy)}px) scale(${s * zoom})`,
  }

  return {
    deskOn,
    artOn,
    art: { transform: `translate(${Math.round(left)}px, ${Math.round(top)}px) scale(${s})` },
    desk: { left: screen.left, top: screen.top, width: deskW, height: screen.h / kd, transform: `scale(${kd})` },
    // Rounded like the running system's card (os.css: 14px) as it will look
    // on screen once the flight starts, so the corners never change.
    term: {
      inset: 'auto',
      left: idle.left,
      top: idle.top,
      width: termW,
      height: idle.h / kt,
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
