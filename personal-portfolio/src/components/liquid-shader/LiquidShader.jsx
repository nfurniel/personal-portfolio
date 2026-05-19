/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uIntensity;
  uniform float uScroll;

  // Simplex noise — Ashima Arts, public domain
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * aspect;

    float t = uTime * 0.15;
    vec2 mouseInfluence = (uMouse - 0.5) * aspect * 0.6;
    float distToMouse = length(p - mouseInfluence);
    float mouseRipple = exp(-distToMouse * 2.5) * 0.4;

    vec2 q = vec2(
      fbm(p * 1.2 + vec2(t, -t * 0.7)),
      fbm(p * 1.2 + vec2(-t * 0.5, t * 0.9))
    );

    vec2 r = vec2(
      fbm(p * 1.5 + q + vec2(1.7, 9.2) + t * 0.3),
      fbm(p * 1.5 + q + vec2(8.3, 2.8) - t * 0.4)
    );

    float n = fbm(p + r + mouseRipple + uScroll * 0.3);
    float noise = smoothstep(-0.4, 0.6, n) * uIntensity;

    vec3 col = mix(uColorA, uColorB, noise);
    col = mix(col, uColorC, smoothstep(0.55, 0.95, noise) * 0.8);

    float vignette = smoothstep(1.1, 0.3, length(p));
    col *= vignette;

    float alpha = smoothstep(0.05, 0.65, noise + mouseRipple * 0.5);

    gl_FragColor = vec4(col, alpha);
  }
`;

function hexToVec3(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

const ShaderPlane = ({ colorA, colorB, colorC, intensity, speed, scrollFactor }) => {
  const meshRef = useRef(null);
  const { size, pointer } = useThree();
  const scrollRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorA: { value: new THREE.Vector3(...hexToVec3(colorA)) },
      uColorB: { value: new THREE.Vector3(...hexToVec3(colorB)) },
      uColorC: { value: new THREE.Vector3(...hexToVec3(colorC)) },
      uIntensity: { value: intensity },
      uScroll: { value: 0 }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  useEffect(() => {
    uniforms.uColorA.value.set(...hexToVec3(colorA));
    uniforms.uColorB.value.set(...hexToVec3(colorB));
    uniforms.uColorC.value.set(...hexToVec3(colorC));
    uniforms.uIntensity.value = intensity;
  }, [colorA, colorB, colorC, intensity, uniforms]);

  useEffect(() => {
    if (!scrollFactor) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? window.scrollY / max : 0;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollFactor]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta * speed;
    const targetX = pointer.x * 0.5 + 0.5;
    const targetY = pointer.y * 0.5 + 0.5;
    uniforms.uMouse.value.x += (targetX - uniforms.uMouse.value.x) * 0.06;
    uniforms.uMouse.value.y += (targetY - uniforms.uMouse.value.y) * 0.06;
    if (scrollFactor) {
      uniforms.uScroll.value += (scrollRef.current - uniforms.uScroll.value) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

const LiquidShader = ({
  colorA = '#0a0a14',
  colorB = '#1a0a2e',
  colorC = '#FF9FFC',
  intensity = 1.0,
  speed = 1.0,
  scrollFactor = true,
  className = '',
  style
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '100px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setDpr(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
  }, []);

  return (
    <div
      ref={containerRef}
      className={`liquid-shader ${className}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
    >
      {isVisible && (
        <Canvas
          orthographic
          dpr={dpr}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 1] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ShaderPlane
            colorA={colorA}
            colorB={colorB}
            colorC={colorC}
            intensity={intensity}
            speed={speed}
            scrollFactor={scrollFactor}
          />
        </Canvas>
      )}
    </div>
  );
};

export default LiquidShader;
