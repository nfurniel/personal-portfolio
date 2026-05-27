import { useEffect, useRef, useState } from 'react'
import { Renderer, Program, Mesh, Triangle, Transform, Texture } from 'ogl'

const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main(){
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

uniform sampler2D uTex;
uniform float uProgress;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform vec2 uOrigin;
uniform vec2 uDirection;

varying vec2 vUv;

vec2 coverUv(vec2 uv){
  vec2 ratio = vec2(
    min((uResolution.x / uResolution.y) / (uImageSize.x / uImageSize.y), 1.0),
    min((uResolution.y / uResolution.x) / (uImageSize.y / uImageSize.x), 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for(int i = 0; i < 5; i++){
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = vUv;
  float p = uProgress;
  float bell = 4.0 * p * (1.0 - p);

  vec2 dir = normalize(uDirection + vec2(0.0001));
  float along = dot(uv - uOrigin, dir);
  float distGradient = (along + 1.4) / 2.8;

  float warpLow = fbm(uv * 1.8 + uTime * 0.05) - 0.5;
  float warpHi  = fbm(uv * 5.5 - uTime * 0.04 + 13.0) - 0.5;
  float warp = warpLow * 0.55 + warpHi * 0.18;
  float field = distGradient + warp;

  float remapped = mix(-0.25, 1.25, p);
  float edgeWidth = 0.09;
  float edgeBand = 1.0 - smoothstep(0.0, edgeWidth * 1.8, abs(field - remapped));

  // ripple displacement perpendicular to direction
  vec2 perp = vec2(-dir.y, dir.x);
  float ripplePhase = (field - remapped) * 14.0;
  float ripple = sin(ripplePhase) * 0.5 + 0.5;
  float pushAmount = ripple * edgeBand * 0.04 * bell;
  vec2 pushUv = uv + perp * pushAmount;

  // sample with slight chromatic split during morph
  vec2 sUv = coverUv(pushUv);
  float ca = 0.004 * bell;
  float r = texture2D(uTex, sUv + vec2( ca,  0.0)).r;
  float g = texture2D(uTex, sUv                  ).g;
  float b = texture2D(uTex, sUv + vec2(-ca,  0.0)).b;
  vec3 col = vec3(r, g, b);

  // subtle darken at the ripple edge
  col *= 1.0 - edgeBand * 0.18 * bell;

  // slight overall brighten on hover for life
  col += vec3(0.03) * bell;

  gl_FragColor = vec4(col, 1.0);
}
`

export default function PortraitMorph({ src, alt, className }) {
  const containerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const hoverRef = useRef(false)
  const progressRef = useRef(0)
  const originRef = useRef([0.5, 0.5])
  const directionRef = useRef([1, 0])
  const lastPointerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cleanup = () => {}
    let cancelled = false
    const idle = (cb) =>
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback(cb, { timeout: 500 })
        : setTimeout(cb, 50)
    const cancelIdle = (h) =>
      typeof cancelIdleCallback === 'function' && typeof h === 'number'
        ? cancelIdleCallback(h)
        : clearTimeout(h)
    const idleHandle = idle(() => {
      if (cancelled) return
      cleanup = bootstrap()
    })
    return () => {
      cancelled = true
      cancelIdle(idleHandle)
      cleanup()
    }

    function bootstrap() {
    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    })
    const gl = renderer.gl
    const canvas = gl.canvas
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    container.appendChild(canvas)

    const scene = new Transform()
    const tex = new Texture(gl, { generateMipmaps: false })
    const imageSize = [1, 1]

    const loadImage = (s) =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          tex.image = img
          imageSize[0] = img.naturalWidth
          imageSize[1] = img.naturalHeight
          resolve()
        }
        img.onerror = reject
        img.src = s
      })

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTex: { value: tex },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uImageSize: { value: imageSize },
        uOrigin: { value: [0.5, 0.5] },
        uDirection: { value: [1, 0] },
      },
      transparent: true,
    })
    const mesh = new Mesh(gl, { geometry, program })
    mesh.setParent(scene)

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      program.uniforms.uResolution.value = [w * renderer.dpr, h * renderer.dpr]
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    let raf = 0
    let last = performance.now()
    let time = 0
    let running = true
    let visible = true
    let docVisible = document.visibilityState !== 'hidden'

    const tick = () => {
      if (!running) return
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      time += dt

      const target = hoverRef.current ? 1 : 0
      const stiffness = hoverRef.current ? 2.4 : 2.0
      const k = 1 - Math.exp(-stiffness * dt)
      progressRef.current += (target - progressRef.current) * k

      program.uniforms.uTime.value = time
      program.uniforms.uProgress.value = progressRef.current
      program.uniforms.uOrigin.value = originRef.current
      program.uniforms.uDirection.value = directionRef.current
      program.uniforms.uImageSize.value = imageSize

      renderer.render({ scene })
      raf = requestAnimationFrame(tick)
    }

    const startLoop = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stopLoop = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
        if (visible && docVisible) startLoop()
        else stopLoop()
      },
      { rootMargin: '100px' }
    )
    io.observe(container)

    const onVis = () => {
      docVisible = document.visibilityState !== 'hidden'
      if (visible && docVisible) startLoop()
      else stopLoop()
    }
    document.addEventListener('visibilitychange', onVis)

    loadImage(src)
      .then(() => {
        setReady(true)
        if (visible && docVisible) startLoop()
      })
      .catch(() => setReady(false))

    const computeEdgeDirection = (x, y) => {
      const dxLeft = x
      const dxRight = 1 - x
      const dyBottom = y
      const dyTop = 1 - y
      const minDist = Math.min(dxLeft, dxRight, dyBottom, dyTop)
      if (minDist === dxLeft) return [1, 0]
      if (minDist === dxRight) return [-1, 0]
      if (minDist === dyBottom) return [0, 1]
      return [0, -1]
    }

    const onPointerEnter = (e) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1 - (e.clientY - rect.top) / rect.height
      originRef.current = [x, y]
      directionRef.current = computeEdgeDirection(x, y)
      lastPointerRef.current = { x, y, t: performance.now() }
      hoverRef.current = true
    }
    const onPointerLeave = (e) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1 - (e.clientY - rect.top) / rect.height
      originRef.current = [x, y]
      const flipped = computeEdgeDirection(x, y).map((v) => -v)
      directionRef.current = flipped
      hoverRef.current = false
    }
    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1 - (e.clientY - rect.top) / rect.height
      const lp = lastPointerRef.current
      if (lp && performance.now() - lp.t < 80 && progressRef.current < 0.15) {
        const vx = x - lp.x
        const vy = y - lp.y
        const mag = Math.hypot(vx, vy)
        if (mag > 0.01) directionRef.current = [vx / mag, vy / mag]
      }
      lastPointerRef.current = { x, y, t: performance.now() }
    }

    container.addEventListener('pointerenter', onPointerEnter)
    container.addEventListener('pointerleave', onPointerLeave)
    container.addEventListener('pointermove', onPointerMove)

    return () => {
      running = false
      stopLoop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      ro.disconnect()
      container.removeEventListener('pointerenter', onPointerEnter)
      container.removeEventListener('pointerleave', onPointerLeave)
      container.removeEventListener('pointermove', onPointerMove)
      const ext = gl.getExtension('WEBGL_lose_context')
      if (ext) ext.loseContext()
      if (canvas.parentNode === container) container.removeChild(canvas)
    }
    }
  }, [src])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {!ready ? (
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      ) : null}
    </div>
  )
}
