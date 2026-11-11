/*
 * Pixel sprites for the offline runner: mini Nicolás (dark messy hair,
 * navy suit, white shirt, blue tie) and the obstacles of a developer's day.
 * Each sprite is a grid of palette keys ('.' = transparent), baked once into
 * an offscreen canvas at PX screen pixels per sprite pixel.
 */

export const PX = 4

const PALETTE = {
  H: '#3f2719', // hair
  h: '#6b452d', // hair highlight
  S: '#e3a565', // skin
  s: '#c4874f', // skin shade / ears
  E: '#2a1608', // eyes
  X: '#ff6b8b', // eyes when caught
  M: '#b0624a', // mouth
  W: '#f1ede3', // shirt
  T: '#3b63c4', // tie
  N: '#27305a', // suit
  n: '#3a4680', // suit highlight
  K: '#55556a', // shoes
  // bug
  G: '#ff6b8b',
  g: '#b84a66',
  A: '#ff9ffc',
  L: '#8f8cab',
  w: '#ffffff',
  // crate (node_modules)
  C: '#ffb547',
  c: '#a8701f',
  // fire
  F: '#ff6b8b',
  f: '#ffb547',
  y: '#fff1b8',
  // pop-up window
  P: '#6ea8ff',
  p: '#ecebf5',
  x: '#ff6b8b',
  d: '#8f8cab',
  // restart icon
  R: '#ecebf5',
}

const HEAD = [
  '...HHhHH....',
  '..HHHHHHHH..',
  '.HHhHHHHhHH.',
  'HHHHHHHHHHH.',
  '.HHHSHHSHHH.',
  '.HSSSSSSSSH.',
  '.sSHHSSHHSs.',
  '.sSESSSSESs.',
  '..SSSSsSSS..',
  '..SSSMMSSS..',
  '...SSSSSS...',
]
const DEAD_HEAD = HEAD.map((row, i) => (i === 7 ? '.sSXSSSSXSs.' : row))

const BODY = ['..NNWTTWNN..', '.NNNWTTWNNN.', '.NNnNTTNnNN.', '.SNNNNNNNNS.', '..NNNNNNNN..']

const LEGS = {
  stand: ['..NNN..NNN..', '..KKK..KKK..'],
  run1: ['...NNN.NN...', '...KKK..KK..'],
  run2: ['..NN..NNN...', '.KK....KKK..'],
  jump: ['..NNN.NNN...', '..KK...KK...'],
}

const DUCK_BODY = ['..NNWTTWNN..', '.SNNNNNNNNS.']

export const SPRITES = {
  stand: [...HEAD, ...BODY, ...LEGS.stand],
  run1: [...HEAD, ...BODY, ...LEGS.run1],
  run2: [...HEAD, ...BODY, ...LEGS.run2],
  jump: [...HEAD, ...BODY, ...LEGS.jump],
  dead: [...DEAD_HEAD, ...BODY, ...LEGS.stand],
  duck1: [...HEAD, ...DUCK_BODY, '..KK....KK..'],
  duck2: [...HEAD, ...DUCK_BODY, '...KK..KK...'],

  bug: [
    '...A....A...',
    '....A..A....',
    '...GGGGGG...',
    '..GwGGGGwG..',
    'LGGGGggGGGGL',
    '.GGGGggGGGG.',
    'LGGGGggGGGGL',
    '..GGGggGGG..',
    '.L..L..L..L.',
  ],

  crate: ['cccccccc', 'ccCCCCcc', 'cCcCCcCc', 'cCCccCCc', 'cCCccCCc', 'cCcCCcCc', 'ccCCCCcc', 'cccccccc'],

  fire1: [
    '...F....',
    '...FF...',
    '..FFF.F.',
    '..FfFFF.',
    '.FFffFF.',
    '.FfffFFF',
    'FFfyyfFF',
    'FfyyyyfF',
    'FfyyyyfF',
    '.Ffyyff.',
    '..FFFF..',
  ],

  popup: [
    'PPPPPPPPPPPxxP',
    'PPPPPPPPPPPxxP',
    'pppppppppppppp',
    'pddddddddppppp',
    'pppppppppppppp',
    'pddddddppppppp',
    'pppppppppppppp',
    'pppppppPPPPPpp',
    'pppppppPPPPPpp',
    'pppppppppppppp',
  ],
}
SPRITES.restart = [
  '....RRRR.R.',
  '..RR....RR.',
  '.R.....RRR.',
  '.R.........',
  'R..........',
  'R.........R',
  'R.........R',
  '.R.......R.',
  '.R.......R.',
  '..RR...RR..',
  '....RRR....',
]
SPRITES.fire2 = SPRITES.fire1.map((row) => [...row].reverse().join(''))

// Bake every sprite into a canvas: { canvas, w, h } in screen pixels.
export function bakeSprites() {
  const out = {}
  for (const [name, grid] of Object.entries(SPRITES)) {
    const cols = grid[0].length
    const canvas = document.createElement('canvas')
    canvas.width = cols * PX
    canvas.height = grid.length * PX
    const ctx = canvas.getContext('2d')
    grid.forEach((row, y) => {
      ;[...row].forEach((key, x) => {
        if (key === '.') return
        ctx.fillStyle = PALETTE[key]
        ctx.fillRect(x * PX, y * PX, PX, PX)
      })
    })
    out[name] = { canvas, w: canvas.width, h: canvas.height }
  }
  return out
}
