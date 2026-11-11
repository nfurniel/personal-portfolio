import { COLS, ROWS, sprite } from './sprites'

/*
 * Mini Nico's behaviour, outside React: one requestAnimationFrame loop
 * drives a queue of small steps (walk, wait, say, anim, fn). Behaviours are
 * just lists of steps; anything the user does interrupts the queue with a
 * new list.
 *
 * Modes:
 *   auto   wandering and idling on his own (collides with icons)
 *   cmd    a scripted sequence that shouldn't be disturbed by collisions
 *   menu   standing still with the assistant menu open
 *   held   picked up with the pointer
 *   sleep  napping until clicked or the pointer comes close
 *
 * On phones he is `fixed`: pinned to the bottom-left corner, where he does
 * everything except walk (walk steps end at once) and can't be picked up.
 *
 * Moods: `annoy` grows with pokes and decays with time (3 → rage, 6 → sulk);
 * `energy` drains while walking (low → sits down and has a coffee).
 */

const rand = (a, b) => a + Math.random() * (b - a)
const pick = (list) => list[Math.floor(Math.random() * list.length)]
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const fill = (text, params) => Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), text)

const ANIM_MS = { hop: 420, shake: 380, squash: 320, stomp: 720, fall: 520, getup: 380, wobble: 2200 }
const FX = { zzz: 'z Z', steam: '#!@', sweat: "'", stars: '* + *', alert: '!', dots: '. . .', spark: '+', code: '1 0 1', sun: '\\ | /', moon: 'z' }
// Windows he reacts to in a special way (face + effect), and every time.
const REACT = { terminal: { face: 'cool', fx: 'code' }, project: { face: 'happy', fx: 'spark' }, settings: { face: 'neutral', fx: null }, doom: { face: 'angry', fx: 'steam' } }
const MENU_APPS = ['projects', 'contact', 'games', 'browser']
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' }

export function createBuddy({ layer, wrap, body, canvas, fx, getBubble, live, setBubble, px, reduce, fixed = false }) {
  const w = COLS * px
  const h = ROWS * px
  const scale = px / 4
  const ctx2d = canvas.getContext('2d')
  const desktop = layer.closest('.os-desktop')
  const born = performance.now()
  const b = () => live.current.b
  const fileOf = (app) => live.current.files[app] ?? app

  let W = layer.clientWidth
  let H = layer.clientHeight
  let maxX = Math.max(0, W - w)
  let maxY = Math.max(0, H - h)

  const S = {
    x: 0,
    y: 0,
    dir: 'down',
    pose: 'stand',
    frame: 0,
    face: 'neutral',
    mode: 'auto',
    queue: [],
    cur: null,
    energy: 100,
    annoy: 0,
    walkDist: 0,
    bumps: 0,
    blocked: 0,
    lastClick: 0,
    suppressClick: 0,
    rageUntil: 0,
    sulking: false,
    sulkAt: 0,
    menuAt: 0,
    sleepAt: 0,
    advance: false,
    faceOver: null,
    faceOverUntil: 0,
    talkUntil: 0,
    blinkAt: born + 2000,
    blinkUntil: 0,
    bubbleUntil: 0,
    squashAt: 0,
    lastActivity: born,
    ptr: { x: -999, y: -999, t: 0 },
    pickups: [],
    watch: null,
    watchSaid: false,
    commented: new Set(),
    reactedAt: 0,
    openApps: new Set(),
    selfOpened: new Set(),
    rects: [],
    rectsAt: 0,
    drawn: '',
    hold: null,
  }

  /* ---------- Geometry ---------- */

  function rects(fresh = false) {
    const now = performance.now()
    if (!fresh && now - S.rectsAt < 100) return S.rects
    const lr = layer.getBoundingClientRect()
    S.rects = [...desktop.querySelectorAll('.os-icon-slot')].map((li) => {
      const r = (li.querySelector('.os-icon') ?? li).getBoundingClientRect()
      return { app: li.dataset.app, el: li, x: r.left - lr.left, y: r.top - lr.top, w: r.width, h: r.height }
    })
    S.rectsAt = now
    return S.rects
  }
  // His lower two thirds: what bumps into things.
  const boxAt = (x, y) => ({ x: x + px * 3, y: y + px * 8, w: w - px * 6, h: h - px * 8 })
  const hits = (a, r, pad) =>
    a.x < r.x + r.w + pad && a.x + a.w > r.x - pad && a.y < r.y + r.h + pad && a.y + a.h > r.y - pad
  const iconAt = (x, y, pad = 0) => rects().find((r) => hits(boxAt(x, y), r, pad))

  function pathClear(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1)
    const n = Math.max(1, Math.ceil(d / 12))
    for (let i = 1; i <= n; i++) {
      if (iconAt(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, 2)) return false
    }
    return true
  }
  // Open windows: he walks across them but doesn't stop on top of one.
  function onWindow(x, y) {
    const lr = layer.getBoundingClientRect()
    const box = { x: x + lr.left, y: y + lr.top, w, h }
    return [...desktop.querySelectorAll('.os-window-shell')].some((el) => {
      const r = el.getBoundingClientRect()
      return hits(box, { x: r.left, y: r.top, w: r.width, h: r.height }, 10)
    })
  }
  // A random free point he can walk to in a straight line (off the windows
  // when there's room).
  function freeSpot() {
    for (let i = 0; i < 60; i++) {
      const x = rand(0, maxX)
      const y = rand(0, maxY)
      if (Math.hypot(x - S.x, y - S.y) < 60 * scale) continue
      if (i < 40 && onWindow(x, y)) continue
      if (!iconAt(x, y, 8) && pathClear(S.x, S.y, x, y)) return { x, y }
    }
    return null
  }
  // The closest point that isn't on top of an icon (or, optionally, a window).
  function nearestFree(offWindows = false) {
    for (let radius = 24; radius <= 900; radius += 24) {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2
        const x = S.x + Math.cos(a) * radius
        const y = S.y + Math.sin(a) * radius
        if (x < 0 || y < 0 || x > maxX || y > maxY) continue
        if (!iconAt(x, y, 6) && !(offWindows && onWindow(x, y))) return { x, y }
      }
    }
    return offWindows ? nearestFree() : { x: S.x, y: S.y }
  }
  function farSpot() {
    let best = null
    for (let i = 0; i < 16; i++) {
      const x = rand(0, maxX)
      const y = rand(0, maxY)
      if (iconAt(x, y, 8)) continue
      const d = Math.hypot(x - S.x, y - S.y)
      if (!best || d > best.d) best = { x, y, d }
    }
    return best ?? nearestFree()
  }
  // Where to stand to reach an icon, and which way to face.
  function iconSpot(app) {
    const r = rects(true).find((x) => x.app === app)
    if (!r) return null
    const y = clamp(r.y + r.h / 2 - h * 0.62, 0, maxY)
    const sides = [
      { x: r.x - w + px * 2, dir: 'right' },
      { x: r.x + r.w - px * 2, dir: 'left' },
    ].filter((o) => o.x >= 0 && o.x <= maxX)
    sides.sort((a, c) => Math.abs(a.x - S.x) - Math.abs(c.x - S.x))
    const side = sides[0] ?? { x: clamp(r.x - w, 0, maxX), dir: 'right' }
    return { x: side.x, y, dir: side.dir, r }
  }
  const dirTo = (dx, dy) => (Math.abs(dx) > Math.abs(dy) * 0.8 ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')

  /* ---------- Output: bubble, fx, animations, sprite ---------- */

  let bubbleId = 0
  function showBubble(data) {
    setBubble(data ? { ...data, id: ++bubbleId } : null)
  }
  // A line he says without stopping what he's doing.
  function bgSay(text, ms = 1600) {
    const now = performance.now()
    showBubble({ kind: 'say', text })
    S.bubbleUntil = now + ms
    S.talkUntil = now + Math.min(ms * 0.6, 1300)
  }
  function setFx(kind) {
    fx.dataset.fx = kind || ''
    fx.textContent = kind ? FX[kind] : ''
  }
  function playAnim(name) {
    body.dataset.anim = ''
    void body.offsetWidth // restart the CSS animation
    body.dataset.anim = name
  }

  function faceNow(now) {
    if (now < S.faceOverUntil) return S.faceOver
    if (S.face === 'neutral') {
      if (now < S.talkUntil && Math.floor(now / 140) % 2) return 'talk'
      if (now < S.blinkUntil) return 'blink'
    }
    return S.face
  }
  function draw(now) {
    let frame = S.frame
    if (S.pose === 'walk') frame = Math.floor(S.walkDist / (px * 1.75)) % 4
    else if (S.pose === 'wave' || S.pose === 'held') frame = Math.floor(now / 220) % 2
    else if (S.pose === 'cup') frame = Math.floor(now / 900) % 2
    const directional = S.pose === 'stand' || S.pose === 'walk' || S.pose === 'reach' || (S.pose === 'sit' && S.dir === 'up')
    const spec = { pose: S.pose, frame, face: faceNow(now), dir: directional ? S.dir : 'down' }
    const key = `${spec.pose}:${spec.frame}:${spec.face}:${spec.dir}`
    if (key === S.drawn) return
    S.drawn = key
    ctx2d.clearRect(0, 0, w, h)
    ctx2d.drawImage(sprite(spec, px), 0, 0)
  }
  function placeBubble() {
    const el = getBubble()
    if (!el) return
    const bw = el.offsetWidth
    const bh = el.offsetHeight
    const left = clamp(S.x + w / 2 - bw / 2, 6, Math.max(6, W - bw - 6)) - S.x
    const above = S.y - bh - 12 >= 4
    el.style.left = `${Math.round(left)}px`
    el.style.top = `${Math.round(above ? -(bh + 12) : h + 12)}px`
    el.dataset.below = above ? '' : '1'
    el.style.setProperty('--tail', `${Math.round(clamp(w / 2 - left, 14, bw - 14))}px`)
    el.style.visibility = 'visible'
  }

  /* ---------- The step queue ---------- */

  function interrupt(steps = [], mode) {
    S.queue = steps
    S.cur = null
    S.advance = false
    S.pose = 'stand'
    S.frame = 0
    S.face = 'neutral'
    S.bubbleUntil = 0
    showBubble(null)
    setFx(null)
    body.dataset.anim = ''
    if (mode) S.mode = mode
  }

  function begin(step, now) {
    if (step.pose) S.pose = step.pose
    if (step.face) S.face = step.face
    if (step.dir) S.dir = step.dir
    if (step.frame !== undefined) S.frame = step.frame
    if ('fx' in step) setFx(step.fx)
    if (step.t === 'walk') {
      step.x = fixed ? S.x : clamp(step.x, 0, maxX)
      step.y = fixed ? S.y : clamp(step.y, 0, maxY)
      if (reduce) {
        S.x = step.x
        S.y = step.y
      } else if (Math.hypot(step.x - S.x, step.y - S.y) > 1.5) {
        S.dir = dirTo(step.x - S.x, step.y - S.y)
      }
    } else if (step.t === 'wait') {
      step.end = now + step.ms
    } else if (step.t === 'say') {
      const ms = step.ms ?? 1300 + step.text.length * 55
      if (step.bg) {
        bgSay(step.text, ms)
        step.end = now
      } else {
        showBubble(step.story ? { kind: 'story', text: step.text, ...step.story } : { kind: 'say', text: step.text })
        S.bubbleUntil = 0
        S.talkUntil = now + Math.min(ms * 0.6, 1500)
        step.end = now + ms
      }
    } else if (step.t === 'anim') {
      playAnim(step.name)
      step.end = now + (step.ms ?? ANIM_MS[step.name])
    }
  }

  // Returns true when the step is finished.
  function update(step, dt, now) {
    switch (step.t) {
      case 'walk': {
        const dx = step.x - S.x
        const dy = step.y - S.y
        const dist = Math.hypot(dx, dy)
        if (dist < 1.5) {
          S.pose = 'stand'
          return true
        }
        S.pose = 'walk'
        const move = Math.min(dist, ((step.speed ?? 46) * scale * dt) / 1000)
        S.x += (dx / dist) * move
        S.y += (dy / dist) * move
        S.walkDist += move
        S.energy -= move / (30 * scale)
        if (step.careful) {
          const r = iconAt(S.x, S.y)
          if (r) bump(r)
        }
        return false
      }
      case 'wait':
        if (step.look) lookAtPointer(now)
        if (step.watch) {
          if (!S.watch) return true
          const r = rects().find((x) => x.app === S.watch)
          if (r) {
            const dx = r.x + r.w / 2 - (S.x + w / 2)
            const dy = r.y + r.h / 2 - (S.y + h / 2)
            S.dir = dirTo(dx, dy)
            if (!S.watchSaid && Math.hypot(dx, dy) < 240) {
              S.watchSaid = true
              bgSay(pick(b().watching), 1900)
            }
          }
        }
        return now >= step.end
      case 'say': {
        if (step.bg) return true
        const done = step.hold ? S.advance || now >= step.end : now >= step.end
        if (done) {
          S.advance = false
          showBubble(null)
        }
        return done
      }
      case 'anim':
        if (now < step.end) return false
        if (!step.keep) body.dataset.anim = ''
        return true
      case 'fn':
        step.fn()
        return true
      default:
        return true
    }
  }

  function run(dt, now) {
    for (let guard = 0; guard < 8; guard++) {
      if (!S.cur) {
        if (!S.queue.length) {
          if (S.mode === 'cmd') S.mode = 'auto'
          if (S.mode !== 'auto') return
          plan(now)
        }
        S.cur = S.queue.shift() ?? null
        if (!S.cur) return
        begin(S.cur, now)
      }
      const step = S.cur
      const done = update(step, dt, now)
      if (S.cur !== step) continue // the step interrupted the queue
      if (!done) return
      S.cur = null
    }
  }

  function lookAtPointer(now) {
    if (now - S.ptr.t > 3500) {
      S.dir = 'down'
      return
    }
    const dx = S.ptr.x - (S.x + w / 2)
    const dy = S.ptr.y - (S.y + h / 2)
    const d = Math.hypot(dx, dy)
    S.dir = d > 36 && d < 340 ? dirTo(dx, dy) : 'down'
  }

  /* ---------- What he does on his own ---------- */

  function plan(now) {
    if (reduce) {
      S.queue = [{ t: 'wait', ms: 2000, pose: 'stand', look: true }]
      return
    }
    if (S.energy < 22) return rest()
    if (now - S.lastActivity > 45000) return sleep(now)

    const pause = { t: 'wait', ms: rand(700, 2300), pose: 'stand', look: true }
    // Pinned in his corner: no strolling, a longer idle and the odd coffee.
    const idle = fixed ? Math.random() : 1
    const roll = fixed ? 0.64 + Math.random() * 0.36 : Math.random()
    if (idle < 0.55) {
      S.queue = [{ ...pause, ms: rand(2500, 6000) }]
    } else if (idle < 0.62) {
      rest()
    } else if (roll < 0.5) {
      const spot = freeSpot()
      S.queue = spot ? [{ t: 'walk', x: spot.x, y: spot.y, speed: rand(40, 52), careful: true }, pause] : [pause]
    } else if (roll < 0.64) {
      const icons = rects(true).filter((r) => b().inspect[r.app])
      const target = icons.length ? iconSpot(pick(icons).app) : null
      if (target && !iconAt(target.x, target.y) && pathClear(S.x, S.y, target.x, target.y)) {
        S.queue = [
          { t: 'walk', x: target.x, y: target.y, careful: true },
          { t: 'wait', ms: 500, dir: target.dir },
          { t: 'say', text: b().inspect[target.r.app] },
          pause,
        ]
      } else {
        S.queue = [pause]
      }
    } else if (roll < 0.77) {
      S.queue = [{ t: 'say', text: pick(b().thoughts), dir: 'down' }, pause]
    } else if (roll < 0.85) {
      S.queue = [
        { t: 'say', text: pick(b().hello), bg: true, ms: 1800, pose: 'wave', dir: 'down', face: 'happy' },
        { t: 'wait', ms: 1800 },
        { t: 'wait', ms: 300, pose: 'stand', face: 'neutral' },
      ]
    } else if (roll < 0.93) {
      S.queue = [
        { t: 'wait', ms: 520, dir: 'left' },
        { t: 'wait', ms: 520, dir: 'right' },
        { t: 'wait', ms: 620, dir: 'up' },
        { t: 'wait', ms: 400, dir: 'down' },
      ]
    } else {
      S.queue = [{ t: 'anim', name: 'hop', dir: 'down', face: 'happy' }, { t: 'wait', ms: 500 }, { t: 'wait', ms: 200, face: 'neutral' }]
    }
  }

  function rest() {
    S.queue = [
      { t: 'say', text: pick(b().tired), face: 'tired', pose: 'stand', dir: 'down', fx: 'sweat' },
      { t: 'wait', ms: 2800, pose: 'sit', face: 'tired' },
      { t: 'say', text: b().coffee, bg: true, ms: 1500, pose: 'cup', face: 'neutral', fx: null },
      { t: 'wait', ms: 3600 },
      { t: 'fn', fn: () => (S.energy = 100) },
      { t: 'anim', name: 'hop', pose: 'stand', face: 'happy' },
      { t: 'say', text: pick(b().refreshed), face: 'happy' },
      { t: 'wait', ms: 150, face: 'neutral' },
    ]
  }

  function sleep(now) {
    interrupt([], 'sleep')
    S.pose = 'sit'
    S.dir = 'down'
    S.face = 'sleep'
    S.sleepAt = now
    setFx('zzz')
  }
  function wake() {
    S.lastActivity = performance.now()
    interrupt(
      [
        { t: 'anim', name: 'hop', pose: 'stand', dir: 'down', face: 'surprised', fx: 'alert' },
        { t: 'say', text: pick(b().sleepWake), face: 'surprised' },
        { t: 'wait', ms: 200, face: 'neutral', fx: null },
      ],
      'auto',
    )
  }

  /* ---------- Things that happen to him ---------- */

  // Walked into an icon that wasn't there when he set off.
  function bump(r) {
    S.bumps++
    const file = fileOf(r.app)
    const back = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[S.dir]
    for (let i = 0; i < 10 && iconAt(S.x, S.y); i++) {
      S.x = clamp(S.x + back[0] * 6, 0, maxX)
      S.y = clamp(S.y + back[1] * 6, 0, maxY)
    }
    const out = iconAt(S.x, S.y) ? nearestFree() : null
    let steps
    if (S.bumps % 2 === 1) {
      const lines = b().blocked
      steps = [
        { t: 'anim', name: 'hop', pose: 'stand', face: 'surprised', fx: 'alert' },
        { t: 'say', text: fill(lines[S.blocked++ % lines.length], { file }), face: 'surprised' },
        { t: 'wait', ms: 300, face: 'neutral', fx: null, dir: OPPOSITE[S.dir] },
      ]
    } else {
      S.energy -= 8
      steps = [
        { t: 'anim', name: 'fall', keep: true, pose: 'stand', dir: 'down', face: 'ouch', fx: 'stars' },
        { t: 'say', text: fill(pick(b().trip), { file }), face: 'dizzy', ms: 1700 },
        { t: 'anim', name: 'getup', face: 'tired', fx: null },
        { t: 'wait', ms: 500 },
        { t: 'wait', ms: 100, face: 'neutral' },
      ]
    }
    if (out) steps.push({ t: 'walk', x: out.x, y: out.y, speed: 60 })
    interrupt(steps, 'cmd')
  }

  // An icon was dragged or dropped on top of him while he stood there.
  function squashed(r, now) {
    S.squashAt = now + 3000
    const spot = nearestFree()
    interrupt(
      [
        { t: 'anim', name: 'shake', pose: 'stand', dir: 'down', face: 'ouch' },
        { t: 'say', text: fill(b().squashed, { file: fileOf(r.app) }), face: 'surprised', ms: 1500 },
        { t: 'walk', x: spot.x, y: spot.y, speed: 135 },
        { t: 'wait', ms: 200, face: 'neutral' },
      ],
      'cmd',
    )
  }

  function ouch(now) {
    S.annoy += 1
    S.faceOver = 'ouch'
    S.faceOverUntil = now + 650
    // Thresholds sit just under 3 and 6 pokes: annoyance decays as he waits.
    if (S.annoy > 5.4) return sulk(now)
    if (S.annoy > 2.6 && now > S.rageUntil) return rage(now)
    if (S.mode === 'cmd') {
      playAnim('shake')
      bgSay(pick(b().ouch), 800)
      return
    }
    interrupt([{ t: 'anim', name: 'shake', dir: 'down' }, { t: 'wait', ms: 450 }], 'auto')
    bgSay(pick(b().ouch), 850)
    S.faceOverUntil = now + 850
  }

  function rage(now) {
    S.rageUntil = now + 8000
    const far = farSpot()
    interrupt(
      [
        { t: 'anim', name: 'stomp', pose: 'stand', dir: 'down', face: 'angry', fx: 'steam' },
        { t: 'say', text: pick(b().angry), ms: 1500, face: 'angry' },
        ...(reduce ? [] : [{ t: 'walk', x: far.x, y: far.y, speed: 96 }]),
        { t: 'wait', ms: 1600, dir: 'up' },
        { t: 'wait', ms: 300, dir: 'down', face: 'neutral', fx: null },
      ],
      'cmd',
    )
  }

  function sulk(now) {
    S.sulking = true
    S.sulkAt = now
    interrupt(
      [
        { t: 'say', text: pick(b().sad), ms: 2200, pose: 'stand', dir: 'down', face: 'sad' },
        { t: 'wait', ms: 9000, pose: 'sit', dir: 'up', face: 'sad', fx: 'dots' },
        { t: 'fn', fn: forgive },
      ],
      'cmd',
    )
  }
  function forgive() {
    S.sulking = false
    S.annoy = 0
    S.rageUntil = 0
    interrupt(
      [
        { t: 'anim', name: 'hop', pose: 'stand', dir: 'down', face: 'happy' },
        { t: 'say', text: pick(b().forgive), face: 'happy' },
        { t: 'wait', ms: 200, face: 'neutral' },
      ],
      'auto',
    )
  }

  /* ---------- The assistant ---------- */

  function openMenu(now, keyboard) {
    interrupt([], 'menu')
    S.dir = 'down'
    S.menuAt = now
    S.talkUntil = now + 700
    playAnim('hop')
    showBubble({ kind: 'menu', text: pick(S.annoy >= 1 ? b().askAnnoyed : b().ask), keyboard })
  }
  function closeMenu(bye) {
    if (S.mode !== 'menu') return
    interrupt(bye ? [{ t: 'say', text: pick(b().bye), ms: 1400 }] : [], 'auto')
  }

  // Walk to an icon on the desktop, press it, and the app opens from there.
  function goOpen(app, tries = 0) {
    const open = () => {
      S.selfOpened.add(app)
      const el = rects(true).find((x) => x.app === app)?.el.querySelector('.os-icon') ?? null
      live.current.os.open(app, {}, { from: el })
    }
    const spot = iconSpot(app)
    const tail = [
      { t: 'anim', name: 'hop', pose: 'stand', dir: 'down', face: 'happy', fx: null },
      { t: 'say', text: b().done[app], face: 'happy' },
      { t: 'wait', ms: 250, face: 'neutral' },
    ]
    if (!spot || reduce) return interrupt([{ t: 'fn', fn: open }, ...tail], 'cmd')
    if (fixed) {
      // No walking on phones: he points at it from his corner.
      return interrupt(
        [
          { t: 'say', text: b().going[app], bg: true, ms: 1500 },
          { t: 'wait', ms: 420, pose: 'reach', frame: 0, dir: 'right' },
          { t: 'wait', ms: 300, frame: 1, fx: 'spark' },
          { t: 'fn', fn: open },
          { t: 'wait', ms: 200, frame: 0, fx: null },
          ...tail,
        ],
        'cmd',
      )
    }
    interrupt(
      [
        { t: 'say', text: tries ? pick(b().moved) : b().going[app], bg: true, ms: 1800, face: tries ? 'surprised' : 'neutral' },
        { t: 'walk', x: spot.x, y: spot.y, speed: 135 },
        {
          t: 'fn',
          fn: () => {
            // The icon was moved while he walked: go after it (a few times).
            const again = iconSpot(app)
            if (again && tries < 3 && Math.hypot(again.r.x - spot.r.x, again.r.y - spot.r.y) > 24) goOpen(app, tries + 1)
          },
        },
        { t: 'wait', ms: 180, pose: 'reach', frame: 0, dir: spot.dir, face: 'neutral' },
        {
          t: 'fn',
          fn: () => {
            const el = rects(true).find((x) => x.app === app)?.el
            el?.classList.add('is-poked')
            setTimeout(() => el?.classList.remove('is-poked'), 450)
          },
        },
        { t: 'wait', ms: 260, frame: 1, fx: 'spark' },
        { t: 'fn', fn: open },
        { t: 'wait', ms: 260, frame: 0, fx: null },
        ...tail,
      ],
      'cmd',
    )
  }

  function tellStory() {
    const lines = b().story
    interrupt(
      [
        ...lines.map(([face, text], i) => ({
          t: 'say',
          text,
          face,
          dir: 'down',
          hold: true,
          ms: 3200 + text.length * 75,
          story: { i: i + 1, n: lines.length },
        })),
        { t: 'say', text: b().storyEnd, face: 'happy' },
        { t: 'wait', ms: 200, face: 'neutral' },
      ],
      'cmd',
    )
  }

  /* ---------- Input ---------- */

  function poke(keyboard = false) {
    const now = performance.now()
    S.lastActivity = now
    if (now < S.suppressClick || S.mode === 'held') return
    if (S.mode === 'sleep') return wake()
    if (S.cur?.hold) {
      S.advance = true
      return
    }
    if (S.sulking) {
      if (now - S.sulkAt > 2500) forgive()
      return
    }
    const quick = now - S.lastClick < 650
    S.lastClick = now
    if (S.mode === 'menu' || S.mode === 'cmd' || quick) return ouch(now)
    openMenu(now, keyboard)
  }

  function choose(option) {
    if (S.mode !== 'menu') return
    if (option === 'story') return tellStory()
    if (MENU_APPS.includes(option)) return goOpen(option)
    closeMenu(true)
  }

  function pointerDown(e) {
    if (e.button !== 0 || S.hold || fixed) return
    const lr = layer.getBoundingClientRect()
    const hold = { sx: e.clientX, sy: e.clientY, gx: e.clientX - lr.left - S.x, gy: e.clientY - lr.top - S.y, on: false, lastX: e.clientX, sign: 0, vx: 0, turns: [] }
    S.hold = hold

    const move = (ev) => {
      const now = performance.now()
      if (!hold.on) {
        if (Math.hypot(ev.clientX - hold.sx, ev.clientY - hold.sy) < 6) return
        hold.on = true
        pickUp(now)
      }
      const r = layer.getBoundingClientRect()
      S.x = clamp(ev.clientX - r.left - hold.gx, 0, maxX)
      S.y = clamp(ev.clientY - r.top - hold.gy, 0, maxY)
      const dx = ev.clientX - hold.lastX
      hold.lastX = ev.clientX
      if (Math.abs(dx) > 2) {
        const sign = Math.sign(dx)
        if (hold.sign && sign !== hold.sign) hold.turns.push(now)
        hold.sign = sign
      }
      hold.vx = hold.vx * 0.7 + dx * 0.3
      body.style.setProperty('--tilt', `${clamp(hold.vx * 1.6, -28, 28).toFixed(1)}deg`)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      S.hold = null
      if (!hold.on) return
      const now = performance.now()
      S.suppressClick = now + 120
      drop(hold.turns.filter((t) => now - t < 1600).length, now)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    hold.stop = up
  }

  function pickUp(now) {
    interrupt([], 'held')
    S.sulking = false
    S.pose = 'held'
    S.dir = 'down'
    S.face = 'surprised'
    S.pickups = [...S.pickups.filter((t) => now - t < 60000), now]
    wrap.classList.add('is-held')
    document.documentElement.classList.add('nos-dragging')
    bgSay(pick(b().held), 1900)
  }

  function drop(shakes, now) {
    wrap.classList.remove('is-held')
    document.documentElement.classList.remove('nos-dragging')
    body.style.setProperty('--tilt', '0deg')
    S.squashAt = now + 2500
    const icon = iconAt(S.x, S.y)
    const steps = [{ t: 'anim', name: 'squash', pose: 'stand', dir: 'down', face: 'neutral' }]
    if (shakes >= 5) {
      S.annoy += 1
      steps.push(
        { t: 'say', text: pick(b().dizzy), bg: true, ms: 2100, face: 'dizzy', fx: 'stars' },
        { t: 'anim', name: 'wobble' },
        { t: 'wait', ms: 200, face: 'neutral', fx: null },
      )
    } else if (S.pickups.length >= 3) {
      S.pickups = []
      S.annoy += 1
      steps.push(
        { t: 'anim', name: 'stomp', face: 'angry', fx: 'steam' },
        { t: 'say', text: b().notIcon, face: 'angry', ms: 1500 },
        { t: 'wait', ms: 200, face: 'neutral', fx: null },
      )
    } else if (icon) {
      steps.push({ t: 'say', text: fill(b().onIcon, { file: fileOf(icon.app) }), face: 'surprised', ms: 1500 })
    } else {
      steps.push({ t: 'say', text: pick(b().drop), face: 'happy', ms: 1500 }, { t: 'wait', ms: 150, face: 'neutral' })
    }
    if (icon) {
      const spot = nearestFree()
      steps.push({ t: 'walk', x: spot.x, y: spot.y, speed: 70 }, { t: 'wait', ms: 150, face: 'neutral', dir: 'down' })
    }
    interrupt(steps, 'cmd')
  }

  // The user started (app) or stopped (null) dragging a desktop icon.
  function iconDrag(app) {
    S.watch = app
    S.watchSaid = false
    if (app && S.mode === 'auto' && !reduce) interrupt([{ t: 'wait', ms: 60000, watch: true }], 'auto')
  }

  // The set of open windows changed (keys: an app id, or project:<id>):
  // comment on the ones he didn't open himself.
  function windows(keys) {
    const now = performance.now()
    const fresh = keys.filter((key) => !S.openApps.has(key))
    S.openApps = new Set(keys)
    for (const key of fresh) {
      const app = key.split(':')[0]
      const style = REACT[app]
      const seen = S.commented.has(key)
      S.commented.add(key)
      if (S.selfOpened.delete(key) || now - born < 1500) continue
      // Ordinary windows get one comment; the special ones every time,
      // though not twice in a row.
      if (style ? now - S.reactedAt < 6000 : seen) continue
      const lines = b().opened[key] ?? b().opened[app]
      if (!lines || S.mode !== 'auto') continue
      S.reactedAt = now
      const line = Array.isArray(lines) ? pick(lines) : lines
      interrupt(
        [
          { t: 'wait', ms: 600, look: true },
          { t: 'fn', fn: () => stepAside(line, style) },
        ],
        'auto',
      )
    }
  }

  // A window just opened: get out of its way if he's on it, then comment.
  function stepAside(line, style = {}) {
    const spot = !fixed && !reduce && onWindow(S.x, S.y) ? nearestFree(true) : null
    const face = style.face ?? 'happy'
    const said = [
      ...(style.fx ? [{ t: 'anim', name: 'hop', pose: 'stand', dir: 'down', face, fx: style.fx }] : []),
      { t: 'say', text: line, face, dir: 'down' },
      { t: 'wait', ms: 150, face: 'neutral', fx: null },
    ]
    interrupt(
      spot
        ? [
            { t: 'say', text: line, bg: true, ms: 2200, face },
            { t: 'walk', x: spot.x, y: spot.y, speed: 120 },
            { t: 'wait', ms: 300, dir: 'down', face: 'neutral' },
          ]
        : said,
      'cmd',
    )
  }

  // The colour theme changed (he waits for the pixel reveal to pass).
  function theme(next) {
    if (S.mode === 'held') return
    S.lastActivity = performance.now()
    const lines = b().theme[next]
    interrupt(
      next === 'light'
        ? [
            { t: 'wait', ms: 900, pose: 'stand', dir: 'down' },
            { t: 'anim', name: 'shake', face: 'ouch', fx: 'sun' },
            { t: 'say', text: lines[0], face: 'ouch', ms: 1300 },
            { t: 'anim', name: 'hop', face: 'cool', fx: null },
            { t: 'say', text: lines[1], face: 'cool', ms: 2000 },
            { t: 'wait', ms: 200, face: 'neutral' },
          ]
        : [
            { t: 'wait', ms: 900, pose: 'stand', dir: 'down' },
            { t: 'anim', name: 'hop', face: 'happy', fx: 'moon' },
            { t: 'say', text: lines[0], face: 'happy', ms: 1700 },
            { t: 'say', text: lines[1], face: 'neutral', ms: 1700, fx: null },
            { t: 'wait', ms: 150, face: 'neutral' },
          ],
      'cmd',
    )
  }

  /* ---------- Loop ---------- */

  let raf = 0
  let last = born
  function tick(now) {
    raf = requestAnimationFrame(tick)
    // Standing still needs far fewer frames (phones).
    if (fixed && now - last < 40) return
    const dt = Math.min(50, now - last)
    last = now

    S.annoy = Math.max(0, S.annoy - dt / 12000)
    if (now > S.blinkAt) {
      S.blinkUntil = now + 130
      S.blinkAt = now + rand(2200, 5400)
    }
    if (S.bubbleUntil && now > S.bubbleUntil) {
      S.bubbleUntil = 0
      showBubble(null)
    }

    if (S.mode === 'menu') {
      if (now - S.menuAt > 14000) closeMenu(true)
    } else if (S.mode === 'sleep') {
      const near = Math.hypot(S.ptr.x - (S.x + w / 2), S.ptr.y - (S.y + h / 2)) < 80
      if (near && S.ptr.t > S.sleepAt + 1200) wake()
    } else if (S.mode !== 'held') {
      run(dt, now)
    }
    // An icon on top of him while he isn't going anywhere.
    if (!fixed && (S.mode === 'auto' || S.mode === 'sleep') && S.cur?.t !== 'walk' && now > S.squashAt) {
      const r = iconAt(S.x, S.y)
      if (r) squashed(r, now)
    }

    wrap.style.transform = `translate3d(${Math.round(S.x)}px, ${Math.round(S.y)}px, 0)`
    draw(now)
    placeBubble()
  }

  /* ---------- Setup ---------- */

  const onPointerMove = (e) => {
    const lr = layer.getBoundingClientRect()
    const now = performance.now()
    S.ptr = { x: e.clientX - lr.left, y: e.clientY - lr.top, t: now }
    S.lastActivity = now
  }
  const onActivity = () => {
    S.lastActivity = performance.now()
  }
  const onDocDown = (e) => {
    S.lastActivity = performance.now()
    if (S.mode === 'menu' && !wrap.contains(e.target)) closeMenu(false)
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('keydown', onActivity)
  document.addEventListener('pointerdown', onDocDown)

  const ro = new ResizeObserver(() => {
    W = layer.clientWidth
    H = layer.clientHeight
    maxX = Math.max(0, W - w)
    maxY = Math.max(0, H - h)
    S.x = fixed ? Math.min(8, maxX) : clamp(S.x, 0, maxX)
    S.y = fixed ? maxY - 2 : clamp(S.y, 0, maxY)
  })
  ro.observe(layer)

  S.x = clamp(W * 0.62, 0, maxX)
  S.y = clamp(H * 0.5, 0, maxY)
  if (fixed) {
    S.x = Math.min(8, maxX)
    S.y = maxY - 2
  } else if (iconAt(S.x, S.y, 6)) Object.assign(S, nearestFree())
  S.queue = [
    { t: 'wait', ms: 1300, look: true },
    { t: 'say', text: b().hello[0], bg: true, ms: 2600, pose: 'wave', dir: 'down', face: 'happy' },
    { t: 'wait', ms: 2200 },
    { t: 'wait', ms: 300, pose: 'stand', face: 'neutral' },
  ]
  raf = requestAnimationFrame(tick)

  return {
    S,
    poke,
    choose,
    pointerDown,
    iconDrag,
    windows,
    theme,
    next: () => {
      if (S.cur?.hold) S.advance = true
    },
    skip: () => interrupt([], 'auto'),
    closeMenu,
    touch: () => {
      S.menuAt = performance.now()
    },
    destroy() {
      cancelAnimationFrame(raf)
      S.hold?.stop?.()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('keydown', onActivity)
      document.removeEventListener('pointerdown', onDocDown)
      ro.disconnect()
      wrap.classList.remove('is-held')
      document.documentElement.classList.remove('nos-dragging')
    },
  }
}
