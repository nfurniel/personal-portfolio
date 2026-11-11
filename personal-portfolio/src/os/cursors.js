import { getTheme, onThemeChange } from './theme'

/*
 * Pixel cursors in the style of the old Windows ones: arrow, hand, closed
 * hand and text beam. Each is a small grid ('#' outline, 'o' fill) baked to
 * a PNG at 2× and exposed as CSS variables (--cur-arrow, --cur-hand,
 * --cur-grab, --cur-text) that cursor.css applies. They are redrawn when the
 * theme changes: white on dark, ink on light.
 */

const SCALE = 2

const SHAPES = {
  arrow: {
    spot: [0, 0],
    fallback: 'default',
    rows: [
      '#',
      '##',
      '#o#',
      '#oo#',
      '#ooo#',
      '#oooo#',
      '#ooooo#',
      '#oooooo#',
      '#ooooooo#',
      '#oooooooo#',
      '#ooooo#####',
      '#oo#oo#',
      '#o#.#oo#',
      '##..#oo#',
      '#....#oo#',
      '......##',
    ],
  },
  hand: {
    spot: [5, 0],
    fallback: 'pointer',
    rows: [
      '.....##',
      '....#oo#',
      '....#oo#',
      '....#oo#',
      '....#oo###',
      '....#oo#oo###',
      '.##.#oo#oo#oo##',
      '#oo##oo#oo#oo#o#',
      '#ooo#oooooooooo#',
      '.#oo#oooooooooo#',
      '..#oooooooooooo#',
      '..#ooooooooooo#',
      '...#oooooooooo#',
      '...#ooooooooo#',
      '....#oooooooo#',
      '....##########',
    ],
  },
  grab: {
    spot: [7, 4],
    fallback: 'grabbing',
    rows: [
      '................',
      '................',
      '....#########',
      '...#oo#oo#oo###',
      '.###oo#oo#oo#oo#',
      '#oo#oooooooooo#',
      '#ooooooooooooo#',
      '.#oooooooooooo#',
      '..#ooooooooooo#',
      '..#oooooooooo#',
      '...#ooooooooo#',
      '...###########',
    ],
  },
  text: {
    spot: [3, 8],
    fallback: 'text',
    rows: [
      '#######',
      '#oo#oo#',
      '###o###',
      '..#o#',
      '..#o#',
      '..#o#',
      '..#o#',
      '..#o#',
      '..#o#',
      '..#o#',
      '..#o#',
      '..#o#',
      '..#o#',
      '###o###',
      '#oo#oo#',
      '#######',
    ],
  },
}

const COLORS = {
  dark: { fill: '#ffffff', line: '#0b0b12' },
  light: { fill: '#1b1830', line: '#ffffff' },
}

function bake({ rows }, { fill, line }) {
  const w = Math.max(...rows.map((r) => r.length))
  const canvas = document.createElement('canvas')
  canvas.width = w * SCALE
  canvas.height = rows.length * SCALE
  const ctx = canvas.getContext('2d')
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const k = row[x]
      if (k !== '#' && k !== 'o') continue
      ctx.fillStyle = k === '#' ? line : fill
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE)
    }
  })
  return canvas.toDataURL('image/png')
}

function paint(theme) {
  const style = document.documentElement.style
  for (const [name, shape] of Object.entries(SHAPES)) {
    const [x, y] = shape.spot
    style.setProperty(`--cur-${name}`, `url(${bake(shape, COLORS[theme])}) ${x * SCALE} ${y * SCALE}, ${shape.fallback}`)
  }
}

let started = false
/** Bake the cursors once and keep them in step with the theme. */
export function initCursors() {
  if (started || typeof document === 'undefined') return
  // Nothing to do on touch-only devices.
  if (!window.matchMedia('(any-pointer: fine)').matches) return
  started = true
  try {
    paint(getTheme())
    onThemeChange(paint)
  } catch {
    /* no canvas: the browser's own cursors stay */
  }
}
