/*
 * Static data for Nicolás OS: the projects, the desktop layout and the
 * pixel banner of the start screen. Anything translatable lives in i18n
 * (t.nos / t.projects).
 */

export const PROJECTS = [
  {
    id: 'quick-arrival',
    title: 'Quick Arrival App',
    file: 'QuickArrival.app',
    icon: 'bus',
    color: '#ffcf5c',
    tech: ['React', 'JavaScript', 'Node.js'],
    href: 'https://quick-arrival-app.vercel.app',
  },
  {
    id: 'veta',
    title: 'Veta',
    file: 'Veta.exe',
    icon: 'veta',
    color: '#6ef2b0',
    tech: ['Next.js', 'TypeScript', 'RAG'],
    href: 'https://veta-pi.vercel.app/',
  },
  {
    id: 'casas-madera-vip',
    title: 'Casas Madera VIP',
    file: 'CasasMadera.html',
    icon: 'house',
    color: '#ff8a72',
    tech: ['React', 'GSAP', 'Vite'],
    href: 'https://casasmaderavip.es/',
  },
  {
    id: 'cosmos-api',
    title: 'Cosmos API',
    file: 'cosmos-api.py',
    icon: 'star',
    color: '#b79bff',
    tech: ['Python', 'FastAPI', 'REST'],
    href: 'https://cosmos-api-production.onrender.com/docs',
  },
]

// Icons on the desktop, in their default order. Each one is an app id from
// registry.js (they can then be dragged anywhere; positions are remembered).
export const DESKTOP = ['browser', 'projects', 'about', 'career', 'stack', 'contact', 'cv', 'games', 'terminal', 'settings', 'readme']

// What the folders contain.
export const FOLDERS = {
  projects: PROJECTS.map((p) => ({ app: 'project', params: { id: p.id } })),
  games: [{ app: 'snake' }],
}

// The CV in Spanish for the Spanish site, in English for English and French.
export const CV_URLS = { es: '/nicolas-furnieles-cv-es.pdf', en: '/nicolas-furnieles-cv-en.pdf' }
export const cvFor = (language) => (language === 'es' ? 'es' : 'en')

// 5-row pixel font for the "NICOLÁS OS" banner. Each pixel is printed twice
// so blocks come out roughly square in a monospace face.
const GLYPHS = {
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  C: ['.####', '#....', '#....', '#....', '.####'],
  O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  L: ['#....', '#....', '#....', '#....', '#####'],
  A: ['.###.', '#...#', '#####', '#...#', '#...#'],
  S: ['.####', '#....', '.###.', '....#', '####.'],
  ' ': ['..', '..', '..', '..', '..'],
}

function banner(text) {
  const letters = [...text].map((ch) => ({ ch, glyph: GLYPHS[ch === 'Á' ? 'A' : ch] }))
  const rows = [0, 1, 2, 3, 4].map((r) =>
    letters.map(({ glyph }) => glyph[r].replace(/#/g, '██').replace(/\./g, '  ') + '  ').join(''),
  )
  // Accent row: a tick over the Á.
  let offset = 0
  let accent = ''
  for (const { ch, glyph } of letters) {
    const width = glyph[0].length * 2 + 2
    if (ch === 'Á') accent = ' '.repeat(offset + 5) + '▄▀'
    offset += width
  }
  return [accent, ...rows].join('\n')
}

export const BANNER = banner('NICOLÁS OS')
