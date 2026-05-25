import { useEffect, useRef, useState } from 'react'
import { LuRotateCcw } from 'react-icons/lu'
import './stack.css'

const CHIPS = [
  { label: 'React', slug: 'react', bg: '#1FB6CB', fg: '#ffffff' },
  { label: 'TypeScript', slug: 'typescript', bg: '#2F74C0', fg: '#ffffff' },
  { label: 'JavaScript', slug: 'javascript', bg: '#f7df1e', fg: '#0a0a0a' },
  { label: 'HTML5', slug: 'html5', bg: '#e34f26', fg: '#ffffff' },
  { label: 'CSS', slug: 'css', bg: '#1572b6', fg: '#ffffff' },
  { label: 'Tailwind CSS', slug: 'tailwindcss', bg: '#2BBCF5', fg: '#ffffff' },
  { label: 'PHP', slug: 'php', bg: '#777BB4', fg: '#ffffff' },
  { label: 'Laravel', slug: 'laravel', bg: '#ff2d20', fg: '#ffffff' },
  { label: 'MySQL', slug: 'mysql', bg: '#4479A1', fg: '#ffffff' },
  { label: 'MongoDB', slug: 'mongodb', bg: '#47A248', fg: '#ffffff' },
  { label: 'Git', slug: 'git', bg: '#f05033', fg: '#ffffff' },
  { label: 'GitHub', slug: 'github', bg: '#181717', fg: '#ffffff' },
]

const CHIP_RADIUS = 14
const WALL_PAD = 16

function ChipPill({ chip, innerRef }) {
  return (
    <div
      ref={innerRef}
      className="stack-chip"
      style={{
        backgroundColor: chip.bg,
        color: chip.fg,
        borderRadius: `${CHIP_RADIUS}px`,
      }}
    >
      <span className="stack-chip__icon" aria-hidden="true">
        <img
          src={`https://cdn.simpleicons.org/${chip.slug}`}
          alt=""
          width={18}
          height={18}
          draggable={false}
        />
      </span>
      <span>{chip.label}</span>
    </div>
  )
}

export default function Stack() {
  const containerRef = useRef(null)
  const measureRef = useRef(null)
  const chipRefs = useRef([])
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    let cancelled = false
    let cleanup

    ;(async () => {
      const Matter = await import('matter-js')
      if (cancelled) return
      const { Engine, Runner, World, Bodies, Body, Mouse, MouseConstraint, Events } = Matter

      const measureChildren = Array.from(measure.children)
      const dims = measureChildren.map((el) => {
        const r = el.getBoundingClientRect()
        return { w: Math.max(80, r.width), h: Math.max(28, r.height) }
      })

      let width = container.clientWidth
      let height = container.clientHeight

      const engine = Engine.create()
      engine.gravity.y = 1
      const world = engine.world

      const wallThickness = 400
      const floor = Bodies.rectangle(width / 2, height - WALL_PAD + wallThickness / 2, width * 3, wallThickness, { isStatic: true })
      const leftWall = Bodies.rectangle(WALL_PAD - wallThickness / 2, height / 2, wallThickness, height * 4, { isStatic: true })
      const rightWall = Bodies.rectangle(width - WALL_PAD + wallThickness / 2, height / 2, wallThickness, height * 4, { isStatic: true })
      World.add(world, [floor, leftWall, rightWall])

      const states = CHIPS.map((chip, i) => {
        const dim = dims[i] ?? { w: 120, h: 36 }
        const { w, h } = dim
        const halfW = w / 2
        const minX = WALL_PAD + halfW + 4
        const maxX = width - WALL_PAD - halfW - 4
        const x = minX + Math.random() * Math.max(1, maxX - minX)
        const y = -80 - i * 60 - Math.random() * 120
        const body = Bodies.rectangle(x, y, w, h, {
          chamfer: { radius: CHIP_RADIUS },
          restitution: 0.35,
          friction: 0.5,
          frictionAir: 0.025,
          density: 0.0018,
          angle: (Math.random() - 0.5) * 0.4,
        })
        World.add(world, body)
        return { chip, body, width: w, height: h }
      })

      const mouse = Mouse.create(container)
      // remove default wheel listeners so page scroll still works
      const wt = mouse.element
      if (wt.mousewheel) {
        wt.removeEventListener('wheel', wt.mousewheel)
        wt.removeEventListener('DOMMouseScroll', wt.mousewheel)
      }
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.2, damping: 0.2, render: { visible: false } },
      })
      World.add(world, mouseConstraint)
      Events.on(mouseConstraint, 'startdrag', () => { container.style.cursor = 'grabbing' })
      Events.on(mouseConstraint, 'enddrag', () => { container.style.cursor = 'grab' })

      const runner = Runner.create()
      Runner.run(runner, engine)

      let raf = 0
      const tick = () => {
        for (let i = 0; i < states.length; i++) {
          const s = states[i]
          const el = chipRefs.current[i]
          if (!s || !el) continue
          const { x, y } = s.body.position
          el.style.transform = `translate3d(${x - s.width / 2}px, ${y - s.height / 2}px, 0) rotate(${s.body.angle}rad)`
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      const onResize = () => {
        const nw = container.clientWidth
        const nh = container.clientHeight
        if (nw === width && nh === height) return
        Body.setPosition(floor, { x: nw / 2, y: nh - WALL_PAD + wallThickness / 2 })
        Body.setPosition(leftWall, { x: WALL_PAD - wallThickness / 2, y: nh / 2 })
        Body.setPosition(rightWall, { x: nw - WALL_PAD + wallThickness / 2, y: nh / 2 })
        width = nw
        height = nh
      }
      const ro = new ResizeObserver(onResize)
      ro.observe(container)

      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        Runner.stop(runner)
        World.clear(world, false)
        Engine.clear(engine)
      }
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [resetKey])

  return (
    <div className="stack">
      <div className="stack__header">
        <h3 className="stack__title">Stack</h3>
        <button
          type="button"
          onClick={() => setResetKey((k) => k + 1)}
          aria-label="Reiniciar stack"
          className="stack__reset focus-ring"
        >
          <LuRotateCcw aria-hidden="true" />
        </button>
      </div>

      <div className="stack__arena">
        {/* invisible measuring container to get chip dims for physics bodies */}
        <div ref={measureRef} aria-hidden="true" className="stack__measure">
          {CHIPS.map((chip) => (
            <ChipPill key={`m-${chip.label}`} chip={chip} />
          ))}
        </div>

        <div ref={containerRef} className="stack__canvas" style={{ touchAction: 'none' }}>
          {CHIPS.map((chip, i) => (
            <div
              key={`${resetKey}-${chip.label}`}
              ref={(el) => { chipRefs.current[i] = el }}
              className="stack-chip-wrap"
              style={{ transform: 'translate3d(-9999px, -9999px, 0)' }}
            >
              <ChipPill chip={chip} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
