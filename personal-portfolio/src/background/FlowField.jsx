import { useEffect, useRef } from 'react'

const VERT = `
precision mediump float;
attribute vec2 a_position;
void main(){
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_brightness;
uniform float u_iterations;
uniform vec2  u_velocity;
uniform float u_scale;
uniform vec3  u_colorLow;
uniform vec3  u_colorHigh;
uniform vec3  u_background;
uniform vec4  u_fadeShape; // x,y center; z,w radius

float h(vec2 p){
  vec3 t = vec3(p, u_time * 0.35);
  return fract(sin(dot(t, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec2 p  = uv * u_scale + u_velocity * u_time;

  vec2 acc = vec2(0.0);
  float MAX_ITER = 24.0;
  for(float i = 0.0; i < 24.0; i++){
    if(i >= u_iterations) break;
    float e = 0.002 + 0.0008 * i;
    vec2 g = vec2(h(p + vec2(e, 0.0)) - h(p - vec2(e, 0.0)),
                  h(p + vec2(0.0, e)) - h(p - vec2(0.0, e)));
    acc += g;
    p += g * 0.6;
  }

  float m = clamp(length(acc) * 0.55 * u_brightness, 0.0, 1.0);
  vec3 col = mix(u_colorLow, u_colorHigh, m);

  // Elliptical radial fade so the shader fades into bg at edges
  vec2 d = (uv - u_fadeShape.xy) / u_fadeShape.zw;
  float fade = smoothstep(1.0, 0.0, length(d));
  col = mix(u_background, col, fade);

  // soft grain to avoid banding
  float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.018;
  col += grain;

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl, type, src) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const label = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
    console.warn(`FlowField ${label} shader failed:`, gl.getShaderInfoLog(shader) || '(no log)')
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return [0, 0, 0]
  return m.map((c) => parseInt(c, 16) / 255)
}

function readCssVarColor(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!v) return fallback
  // accept #rrggbb hex
  if (/^#([0-9a-f]{6})$/i.test(v)) return hexToRgb(v)
  // accept rgb(a,b,c)
  const m = v.match(/rgba?\(([^)]+)\)/i)
  if (m) {
    const [r, g, b] = m[1].split(',').map((s) => parseFloat(s.trim()) / 255)
    return [r || 0, g || 0, b || 0]
  }
  return fallback
}

export default function FlowField({
  brightness = 3,
  iterations = 10,
  velocity = [0, 0.1],
  scale = 1.4,
  fadeShape = [0, 0, 1.2, 0.9],
  colorLow,
  colorHigh,
}) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const visibleRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    })
    if (!gl) return

    const vert = compile(gl, gl.VERTEX_SHADER, VERT)
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vert || !frag) return

    const program = gl.createProgram()
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = {
      res: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      brightness: gl.getUniformLocation(program, 'u_brightness'),
      iter: gl.getUniformLocation(program, 'u_iterations'),
      vel: gl.getUniformLocation(program, 'u_velocity'),
      scale: gl.getUniformLocation(program, 'u_scale'),
      cLow: gl.getUniformLocation(program, 'u_colorLow'),
      cHigh: gl.getUniformLocation(program, 'u_colorHigh'),
      bg: gl.getUniformLocation(program, 'u_background'),
      fade: gl.getUniformLocation(program, 'u_fadeShape'),
    }

    const syncColors = () => {
      const bg = readCssVarColor('--background', [1, 1, 1])
      const low = colorLow ? hexToRgb(colorLow) : bg
      const high = colorHigh ? hexToRgb(colorHigh) : readCssVarColor('--accent', [0, 0.4, 1])
      gl.uniform3fv(u.cLow, low)
      gl.uniform3fv(u.cHigh, high)
      gl.uniform3fv(u.bg, bg)
    }
    syncColors()

    gl.uniform1f(u.brightness, brightness)
    gl.uniform1f(u.iter, iterations)
    gl.uniform2fv(u.vel, velocity)
    gl.uniform1f(u.scale, scale)
    gl.uniform4fv(u.fade, fadeShape)

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const W = Math.floor(w * dpr)
      const H = Math.floor(h * dpr)
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W
        canvas.height = H
        gl.viewport(0, 0, W, H)
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const io = new IntersectionObserver((entries) => {
      visibleRef.current = entries[0]?.isIntersecting ?? true
    }, { threshold: 0 })
    io.observe(canvas)

    // re-sync colors when theme changes
    const mo = new MutationObserver(syncColors)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })

    let t0 = performance.now()
    const loop = (now) => {
      if (!visibleRef.current || document.hidden) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }
      const t = (now - t0) / 1000
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.time, t)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      const ext = gl.getExtension('WEBGL_lose_context')
      ext?.loseContext()
    }
  }, [brightness, iterations, velocity, scale, fadeShape, colorLow, colorHigh])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}
