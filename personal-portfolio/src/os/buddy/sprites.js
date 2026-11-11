/*
 * Pixel sprites for Mini Nico, the desktop assistant: the same little
 * Nicolás as the offline runner (messy brown hair, navy suit, blue tie),
 * here with three views (front, side, back), a walk cycle, poses and a set
 * of faces. A sprite is composed from parts (head + body + legs + overlays)
 * on a COLS × ROWS grid of palette keys and baked lazily into a canvas.
 */

export const COLS = 14
export const ROWS = 20
const OX = 1 // the 12-wide character sits one column in, leaving room for arms
const OY = 1

const PALETTE = {
  H: '#3f2719', // hair
  h: '#6b452d', // hair highlight
  S: '#e3a565', // skin
  s: '#c4874f', // skin shade / ears
  R: '#e27a5c', // skin, furious
  r: '#c25c44',
  E: '#2a1608', // eyes
  e: '#7a4a2a', // closed / heavy eyelids
  X: '#ff6b8b', // eyes when hurt or dizzy
  M: '#b0624a', // mouth
  O: '#4a1712', // open mouth
  B: '#ef8f78', // blush
  b: '#7fc4ff', // tear / sweat
  W: '#f1ede3', // shirt
  T: '#3b63c4', // tie
  N: '#2c376a', // suit
  n: '#44508f', // suit highlight
  K: '#6a6a82', // shoes
  c: '#ecebf5', // coffee cup
  C: '#8a5a36', // coffee
  G: '#14141f', // sunglasses
  g: '#7fc4ff', // their glint
}

/* ---------- Heads ---------- */

const HAIR = ['...HHhHH....', '..HHHHHHHH..', '.HHhHHHHhHH.', 'HHHHHHHHHHH.', '.HHHSHHSHHH.']

// Front faces: rows 5–10 (forehead, brows, eyes, nose, mouth, chin).
const FACE = {
  neutral: ['.HSSSSSSSSH.', '.sSHHSSHHSs.', '.sSESSSSESs.', '..SSSSsSSS..', '..SSSMMSSS..', '...SSSSSS...'],
  blink: ['.HSSSSSSSSH.', '.sSHHSSHHSs.', '.sSeSSSSeSs.', '..SSSSsSSS..', '..SSSMMSSS..', '...SSSSSS...'],
  talk: ['.HSSSSSSSSH.', '.sSHHSSHHSs.', '.sSESSSSESs.', '..SSSSsSSS..', '..SSSOOSSS..', '...SSSSSS...'],
  happy: ['.HSSSSSSSSH.', '.sSHHSSHHSs.', '.sSESSSSESs.', '..BSSSsSSB..', '..SMSSSSMS..', '...SMMMMS...'],
  ouch: ['.HSSSSSSSSH.', '.sSHHSSHHSs.', '.sSXSSSSXSs.', '..SSSSsSSS..', '..SSSOOSSS..', '...SSOOSS...'],
  angry: ['.HSHSSSSHSH.', '.sSSHSSHSSs.', '.sSSESSESSs.', '..SSSSsSSS..', '..SSMMMMSS..', '...SSSSSS...'],
  sad: ['.HSSHSSHSSH.', '.sSHSSSSHSs.', '.sSESSSSESs.', '..SbSSsSSS..', '..SSSMMSSS..', '...SMSSMS...'],
  tired: ['.HSSSSSSSbH.', '.sSHHSSHHSs.', '.sSeSSSSeSs.', '..SSSSsSSS..', '..SSSOOSSS..', '...SSSSSS...'],
  surprised: ['.HSHHSSHHSH.', '.sSSSSSSSSs.', '.sSESSSSESs.', '..SSSSsSSS..', '..SSSOOSSS..', '...SSSSSS...'],
  sleep: ['.HSSSSSSSSH.', '.sSHHSSHHSs.', '.sSeeSSeeSs.', '..SSSSsSSS..', '..SSSSMSSS..', '...SSSSSS...'],
  dizzy: ['.HSSSSSSSSH.', '.sSHHSSHHSs.', '.sSXSSSSXSs.', '..SSSSsSSS..', '..SSMSMSSS..', '...SSSSSS...'],
  cool: ['.HSSSSSSSSH.', '.GGGGGGGGGG.', '.sGgGSSGgGs.', '..SSSSsSSS..', '..SMSSSSMS..', '...SMMMMS...'],
}

// Side view, facing right (mirrored for left). Rows 0–10.
const SIDE_HEAD = [
  '...HHhHH....',
  '..HHHHHHHH..',
  '.HHhHHHHHHH.',
  '.HHHHHHHHHHH',
  '.HHHHHHSHSH.',
  '.HHHHSSSSSS.',
  '.HHHsSSSHHS.',
  '..HHsSSSESS.',
  '...HSSSSSSSs',
  '...SSSSSMMS.',
  '....SSSSSS..',
]
const SIDE_FACE = {
  blink: { 7: '..HHsSSSeSS.' },
  talk: { 9: '...SSSSSOOS.' },
  happy: { 8: '...HSSSSBSSs' },
  ouch: { 7: '..HHsSSSXSS.', 9: '...SSSSSOOS.' },
  angry: { 6: '.HHHsSSSSHH.', 9: '...SSSSMMMS.' },
  sad: { 8: '...HSSSSbSSs' },
  tired: { 7: '..HHsSSSeSS.', 9: '...SSSSSOOS.' },
  surprised: { 9: '...SSSSSOOS.' },
  sleep: { 7: '..HHsSSSeSS.' },
  dizzy: { 7: '..HHsSSSXSS.' },
  cool: { 6: '.HHGGGGGGGG.', 7: '..HHsSGGgGS.' },
}

const BACK_HEAD = [
  '...HHhHH....',
  '..HHHHHHHH..',
  '.HHhHHHHhHH.',
  'HHHHHHHHHHH.',
  '.HHHHHHHHHH.',
  '.HHHHhHHHHH.',
  '.sHHHHHHHHs.',
  '.sHHHhHHHHs.',
  '..HHHHHHHH..',
  '..SHHHHHHS..',
  '...SSSSSS...',
]

/* ---------- Bodies (5 rows) and legs (2 rows) ---------- */

const BODY = {
  stand: ['..NNWTTWNN..', '.NNNWTTWNNN.', '.NNnNTTNnNN.', '.SNNNNNNNNS.', '..NNNNNNNN..'],
  // Arms swinging: one hand up, the other down.
  swingA: ['..NNWTTWNN..', '.NNNWTTWNNN.', '.SNnNTTNnNN.', '..NNNNNNNNN.', '..NNNNNNNNS.'],
  swingB: ['..NNWTTWNN..', '.NNNWTTWNNN.', '.NNnNTTNnNS.', '.NNNNNNNNN..', '.SNNNNNNNN..'],
  wave: ['..NNWTTWNNNN', '.NNNWTTWNN..', '.NNnNTTNnN..', '.SNNNNNNNN..', '..NNNNNNNN..'],
  held: ['NNNNWTTWNNNN', '..NNWTTWNN..', '..NnNTTNnN..', '..NNNNNNNN..', '..NNNNNNNN..'],
  cup: ['..NNWTTWNN..', '.NNNWTTWNNN.', '.NNnNTTNnNN.', '.SNNNNNNNNSc', '..NNNNNNNN.c'],
  sip: ['..NNWTTWNN..', '.NNNWTTWNNN.', '.NNnNTTNnNN.', '.SNNNNNNNN..', '..NNNNNNNN..'],
}
const toBack = (rows) => rows.map((r) => r.replace(/[WT]/g, 'N'))

const SIDE_BODY = {
  stand: ['....NNNW....', '...NNNNWT...', '...NNnNNT...', '...NNSNNN...', '....NNNNN...'],
  fwd: ['....NNNW....', '...NNNNWT...', '...NNnNNT...', '...NNNNNNS..', '....NNNNN...'],
  back: ['....NNNW....', '...NNNNWT...', '...NNnNNT...', '..SNNNNNN...', '....NNNNN...'],
  reach0: ['....NNNW....', '...NNNNWT...', '...NNnNNTNS.', '...NNNNNN...', '....NNNNN...'],
  reach1: ['....NNNW....', '...NNNNWTNNS', '...NNnNNT...', '...NNNNNN...', '....NNNNN...'],
}

const LEGS = {
  stand: ['..NNN..NNN..', '..KKK..KKK..'],
  stepA: ['..KKK..NNN..', '.......KKK..'],
  stepB: ['..NNN..KKK..', '..KKK.......'],
  sit: ['.NNNNNNNNNN.', '.KKK....KKK.'],
  dangleA: ['..NNN.NNN...', '..KK...KK...'],
  dangleB: ['...NNN.NNN..', '...KK...KK..'],
}
const SIDE_LEGS = {
  stand: ['....NNN.....', '....KKKK....'],
  wide: ['...NN..NN...', '..KK...KKK..'],
  cross: ['....NNNN....', '...KK.KKK...'],
}

/* ---------- Composition ---------- */

function blank() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill('.'))
}
function put(grid, rows, top, shift = 0) {
  rows.forEach((row, r) => {
    ;[...row].forEach((key, c) => {
      const y = OY + top + r + shift
      if (key !== '.' && y >= 0 && y < ROWS) grid[y][OX + c] = key
    })
  })
}
function dot(grid, x, y, key, shift = 0) {
  const gy = OY + y + shift
  const gx = OX + x
  if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) grid[gy][gx] = key
}

/**
 * pose: stand | walk | sit | wave | reach | held | cup
 * frame: pose-specific (walk 0–3, others 0–1)
 * face: a FACE key; dir: down | up | left | right
 */
function compose({ pose, frame, face, dir }) {
  const g = blank()
  const side = dir === 'left' || dir === 'right'
  // Passing frames of the walk bob up by one pixel.
  const bob = pose === 'walk' && frame % 2 === 1 ? -1 : 0
  const sitDrop = pose === 'sit' ? 1 : 0

  if (pose === 'reach' || (side && (pose === 'stand' || pose === 'walk'))) {
    const head = SIDE_HEAD.map((row, i) => SIDE_FACE[face]?.[i] ?? row)
    let body = SIDE_BODY.stand
    let legs = SIDE_LEGS.stand
    if (pose === 'reach') body = frame ? SIDE_BODY.reach1 : SIDE_BODY.reach0
    if (pose === 'walk') {
      body = [SIDE_BODY.fwd, SIDE_BODY.stand, SIDE_BODY.back, SIDE_BODY.stand][frame]
      legs = [SIDE_LEGS.wide, SIDE_LEGS.stand, SIDE_LEGS.cross, SIDE_LEGS.stand][frame]
    }
    put(g, head, 0, bob)
    put(g, body, 11, bob)
    put(g, legs, 16)
  } else if (dir === 'up' && (pose === 'stand' || pose === 'walk' || pose === 'sit')) {
    let body = BODY.stand
    let legs = pose === 'sit' ? LEGS.sit : LEGS.stand
    if (pose === 'walk') {
      body = [BODY.swingA, BODY.stand, BODY.swingB, BODY.stand][frame]
      legs = [LEGS.stepA, LEGS.stand, LEGS.stepB, LEGS.stand][frame]
    }
    put(g, BACK_HEAD, 0, bob + sitDrop)
    put(g, toBack(body), 11, bob + sitDrop)
    put(g, legs, 16, sitDrop)
  } else {
    const head = [...HAIR, ...(FACE[face] ?? FACE.neutral)]
    let body = BODY.stand
    let legs = LEGS.stand
    if (pose === 'walk') {
      body = [BODY.swingA, BODY.stand, BODY.swingB, BODY.stand][frame]
      legs = [LEGS.stepA, LEGS.stand, LEGS.stepB, LEGS.stand][frame]
    } else if (pose === 'sit') {
      legs = LEGS.sit
    } else if (pose === 'wave') {
      body = BODY.wave
    } else if (pose === 'held') {
      body = BODY.held
      legs = frame ? LEGS.dangleB : LEGS.dangleA
    } else if (pose === 'cup') {
      body = frame ? BODY.sip : BODY.cup
      legs = LEGS.sit
    }
    const drop = sitDrop || (pose === 'cup' ? 1 : 0)
    put(g, head, 0, bob + drop)
    put(g, body, 11, bob + drop)
    put(g, legs, 16, drop)
    if (pose === 'wave') {
      // Raised arm beside the head, hand swinging out and back.
      dot(g, 11, 10, 'N')
      if (frame) {
        dot(g, 12, 9, 'N')
        dot(g, 12, 8, 'S')
      } else {
        dot(g, 11, 9, 'N')
        dot(g, 11, 8, 'S')
      }
    } else if (pose === 'held') {
      dot(g, 0, 10, 'S')
      dot(g, 11, 10, 'S')
    } else if (pose === 'cup') {
      if (frame) {
        // Sipping: arm bent up, cup at the mouth.
        ;[
          [10, 12, 'N'],
          [10, 11, 'N'],
          [10, 10, 'S'],
          [8, 9, 'c'],
          [9, 9, 'c'],
          [8, 8, 'c'],
          [9, 8, 'c'],
        ].forEach(([x, y, k]) => dot(g, x, y, k, drop))
      } else {
        dot(g, 11, 13, 'C', drop)
      }
    }
  }

  let rows = g
  if (face === 'angry') rows = rows.map((row) => row.map((k) => (k === 'S' ? 'R' : k === 's' ? 'r' : k)))
  if (dir === 'left') rows = rows.map((row) => [...row].reverse())
  return rows
}

/* ---------- Baking ---------- */

const cache = new Map()

/** A canvas with the sprite at `px` screen pixels per sprite pixel (cached). */
export function sprite(spec, px) {
  const key = `${spec.pose}:${spec.frame}:${spec.face}:${spec.dir}:${px}`
  let canvas = cache.get(key)
  if (canvas) return canvas
  canvas = document.createElement('canvas')
  canvas.width = COLS * px
  canvas.height = ROWS * px
  const ctx = canvas.getContext('2d')
  compose(spec).forEach((row, y) => {
    row.forEach((k, x) => {
      if (k === '.') return
      ctx.fillStyle = PALETTE[k]
      ctx.fillRect(x * px, y * px, px, px)
    })
  })
  cache.set(key, canvas)
  return canvas
}
