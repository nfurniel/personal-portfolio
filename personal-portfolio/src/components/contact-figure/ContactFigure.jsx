import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import modelUrl from '../../img/furni-figura.glb'
import './contact-figure.css'

// Tamaño objetivo (en unidades de escena) al que se normaliza el modelo.
const TARGET_SIZE = 2.2
// Empuje horizontal de encuadre (negativo = hacia la izquierda) para compensar
// la asimetría visual del modelo y dejarlo ópticamente centrado.
const FRAME_X = -0.12

function Model({ pointer, reduceMotion }) {
  const gltf = useLoader(GLTFLoader, modelUrl)
  const scene = gltf.scene
  const group = useRef(null)

  // Centra y normaliza la escala según la caja envolvente (siempre encaja en cámara).
  const { scale, center, halfHeight } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const c = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(c)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const s = TARGET_SIZE / maxDim
    return { scale: s, center: c, halfHeight: (size.y * s) / 2 }
  }, [scene])

  // Evita reflejos metálicos negros al no haber entorno HDR.
  useMemo(() => {
    scene.traverse((o) => {
      if (o.isMesh && o.material) o.material.envMapIntensity = 0.6
    })
  }, [scene])

  // Sombra suave "fake": degradado radial sobre un plano en el suelo.
  const shadowTex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 128
    const ctx = cv.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(18,18,38,0.42)')
    g.addColorStop(0.55, 'rgba(18,18,38,0.18)')
    g.addColorStop(1, 'rgba(18,18,38,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useFrame((state) => {
    if (!group.current) return
    if (reduceMotion) {
      group.current.rotation.set(0, 0, 0)
      group.current.position.y = 0
      return
    }
    const t = state.clock.elapsedTime
    // Balanceo lento manteniendo la cara al frente + parallax con el ratón.
    const targetY = Math.sin(t * 0.5) * 0.18 + pointer.current.x * 0.45
    const targetX = pointer.current.y * 0.18
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.08)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.08)
    // Flotación suave.
    group.current.position.y = Math.sin(t * 1.4) * 0.06
  })

  return (
    <group position={[FRAME_X, 0, 0]}>
      <group ref={group}>
        <group scale={scale}>
          <primitive object={scene} position={[-center.x, -center.y, -center.z]} />
        </group>
      </group>

      <mesh rotation-x={-Math.PI / 2} position={[0, -halfHeight, 0]}>
        <planeGeometry args={[3.4, 3.4]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

// Avisa al padre cuando el modelo ya resolvió (para ocultar el loader DOM).
function Loaded({ onReady }) {
  useEffect(() => {
    onReady()
  }, [onReady])
  return null
}

export default function ContactFigure({ className = '' }) {
  const wrapRef = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })
  const [inView, setInView] = useState(false)
  const [ready, setReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Respeta prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Monta el Canvas (y descarga el GLB) solo al acercarse al viewport.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Parallax con el ratón: SOLO en dispositivos con puntero fino (escritorio).
  // En táctil/emulador el cursor falsea el valor y descuadra el modelo, así que
  // ahí se queda solo con el balanceo suave centrado.
  useEffect(() => {
    if (!inView || reduceMotion) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      pointer.current.x = 0
      pointer.current.y = 0
      return
    }
    const clamp = (v) => Math.max(-1, Math.min(1, v))
    const onMove = (e) => {
      pointer.current.x = clamp((e.clientX / window.innerWidth) * 2 - 1)
      pointer.current.y = clamp(-((e.clientY / window.innerHeight) * 2 - 1))
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [inView, reduceMotion])

  return (
    <div
      ref={wrapRef}
      className={`contact-figure ${className}`.trim()}
      aria-hidden="true"
    >
      {!ready && <div className="contact-figure__loader" />}

      {inView && (
        <Canvas
          className="contact-figure__canvas"
          camera={{ position: [0, 0, 5.2], fov: 32 }}
          dpr={[1, 1.8]}
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
          style={{ touchAction: 'pan-y', pointerEvents: 'none' }}
        >
          <hemisphereLight intensity={0.7} groundColor={'#5b5b6b'} />
          <ambientLight intensity={0.45} />
          <directionalLight position={[3, 5, 4]} intensity={2.3} />
          <directionalLight position={[-4, 2, -1]} intensity={0.8} />
          <directionalLight position={[0, 3, -5]} intensity={1.3} color={'#a78bfa'} />

          <Suspense fallback={null}>
            <Model pointer={pointer} reduceMotion={reduceMotion} />
            <Loaded onReady={() => setReady(true)} />
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}

// No se precarga en el arranque a propósito: el GLB pesa ~12 MB y solo
// debe descargarse cuando el usuario llega a la sección de contacto.
