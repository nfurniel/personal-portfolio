"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import "./glyph-tide.css";

export interface GlyphTideProps {
  colors?: string[];
  backgroundColor?: string;
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  scale?: number;
  level?: number;
  tideRange?: number;
  tidePeriod?: number;
  waves?: number;
  foam?: number;
  contours?: number;
  wetSand?: number;
  depthFade?: number;
  brightness?: number;
  speed?: number;
  interactive?: boolean;
  cursorRadius?: number;
  cursorStrength?: number;
  wake?: number;
  wakeLength?: number;
  rippleSize?: number;
  clickRipples?: boolean;
  seed?: number;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const DEFAULT_COLORS = ["#5227FF", "#FF9FFC"];
const DEFAULT_CHARACTERS = " .:~+*#%@";
const DEFAULT_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace';
const MAX_RIPPLES = 24;

const passVertexShader = `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fluidHeader = `
precision highp float;

uniform vec2 uSize;
uniform vec2 uView;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 e = b - a;
  float t = clamp(dot(p - a, e) / max(dot(e, e), 1e-4), 0.0, 1.0);
  return length(p - a - e * t);
}
`;

const velocityShader = `${fluidHeader}
uniform sampler2D uVelocity;
uniform float uDt;
uniform float uDecay;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform vec2 uBrushVelocity;
uniform float uRadius;
uniform float uBlend;

void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  vec2 p = uv * uView - uView * 0.5;
  vec2 v = texture2D(uVelocity, uv).xy;
  vec2 carried = texture2D(uVelocity, uv - v * uDt / uView).xy * uDecay;
  float d = segment(p, uFrom, uTo) / uRadius;
  float w = clamp(exp(-d * d) * uBlend, 0.0, 1.0);
  gl_FragColor = vec4(mix(carried, uBrushVelocity, w), 0.0, 1.0);
}
`;

const divergenceShader = `${fluidHeader}
uniform sampler2D uVelocity;

void main() {
  vec2 texel = 1.0 / uSize;
  vec2 uv = gl_FragCoord.xy * texel;
  vec2 h = uView / uSize;
  float l = texture2D(uVelocity, uv - vec2(texel.x, 0.0)).x;
  float r = texture2D(uVelocity, uv + vec2(texel.x, 0.0)).x;
  float b = texture2D(uVelocity, uv - vec2(0.0, texel.y)).y;
  float t = texture2D(uVelocity, uv + vec2(0.0, texel.y)).y;
  gl_FragColor = vec4(0.5 * ((r - l) / h.x + (t - b) / h.y), 0.0, 0.0, 1.0);
}
`;

const pressureShader = `${fluidHeader}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main() {
  vec2 texel = 1.0 / uSize;
  vec2 uv = gl_FragCoord.xy * texel;
  vec2 h = uView / uSize;
  float l = texture2D(uPressure, uv - vec2(texel.x, 0.0)).x;
  float r = texture2D(uPressure, uv + vec2(texel.x, 0.0)).x;
  float b = texture2D(uPressure, uv - vec2(0.0, texel.y)).x;
  float t = texture2D(uPressure, uv + vec2(0.0, texel.y)).x;
  float ax = 1.0 / (h.x * h.x);
  float ay = 1.0 / (h.y * h.y);
  float divergence = texture2D(uDivergence, uv).x;
  gl_FragColor = vec4(((l + r) * ax + (b + t) * ay - divergence) / (2.0 * (ax + ay)), 0.0, 0.0, 1.0);
}
`;

const projectShader = `${fluidHeader}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main() {
  vec2 texel = 1.0 / uSize;
  vec2 uv = gl_FragCoord.xy * texel;
  vec2 h = uView / uSize;
  float l = texture2D(uPressure, uv - vec2(texel.x, 0.0)).x;
  float r = texture2D(uPressure, uv + vec2(texel.x, 0.0)).x;
  float b = texture2D(uPressure, uv - vec2(0.0, texel.y)).x;
  float t = texture2D(uPressure, uv + vec2(0.0, texel.y)).x;
  vec2 v = texture2D(uVelocity, uv).xy - 0.5 * vec2((r - l) / h.x, (t - b) / h.y);
  gl_FragColor = vec4(v, 0.0, 1.0);
}
`;

const dyeShader = `${fluidHeader}
uniform sampler2D uDye;
uniform sampler2D uVelocity;
uniform float uDt;
uniform vec2 uDecay;
uniform float uOffsetDecay;
uniform float uMaxOffset;
uniform float uPush;
uniform vec4 uSplash;
uniform float uSpread;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uStrength;

void main() {
  vec2 texel = 1.0 / uSize;
  vec2 uv = gl_FragCoord.xy * texel;
  vec2 p = uv * uView - uView * 0.5;
  vec2 v = texture2D(uVelocity, uv).xy;
  vec2 back = uv - v * uDt / uView;
  vec4 center = texture2D(uDye, back);
  vec2 around = (
    texture2D(uDye, back + vec2(texel.x, 0.0)).xy +
    texture2D(uDye, back - vec2(texel.x, 0.0)).xy +
    texture2D(uDye, back + vec2(0.0, texel.y)).xy +
    texture2D(uDye, back - vec2(0.0, texel.y)).xy
  ) * 0.25;
  vec2 dye = mix(center.xy, around, uSpread) * uDecay;
  vec2 offset = center.zw * uOffsetDecay + v * uDt * uPush;
  vec2 fromSplash = p - uSplash.xy;
  float r = length(fromSplash);
  float g = exp(-r * r / (uSplash.w * uSplash.w)) * smoothstep(0.0, uSplash.w * 0.25, r);
  offset += fromSplash / max(r, 1e-3) * g * uSplash.z * uDt;
  float reach = length(offset);
  if (reach > uMaxOffset) offset *= uMaxOffset / reach;
  float d = segment(p, uFrom, uTo) / uRadius;
  float paint = clamp(exp(-d * d) * uStrength, 0.0, 1.0);
  gl_FragColor = vec4(max(dye, vec2(paint)), offset);
}
`;

const fieldShader = `
precision highp float;

#define MAX_RIPPLES ${MAX_RIPPLES}

uniform vec2 uGrid;
uniform vec2 uCell;
uniform vec2 uView;
uniform float uTime;
uniform float uClock;
uniform float uScale;
uniform vec2 uSeed;
uniform float uLevel;
uniform float uRange;
uniform float uPeriod;
uniform float uWaves;
uniform float uFoam;
uniform float uContours;
uniform float uWet;
uniform float uDepthFade;
uniform float uCount;
uniform vec4 uRipples[MAX_RIPPLES];
uniform float uRippleSize;
uniform sampler2D uDye;
uniform float uWakeGain;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec2 gradient(vec2 i) {
  float a = hash(i + 19.19) * 6.2831853;
  return vec2(cos(a), sin(a));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(gradient(i), f);
  float b = dot(gradient(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(gradient(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(gradient(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float terrain(vec2 q) {
  vec2 w = vec2(noise(q * 0.55 + uSeed), noise(q * 0.55 + uSeed + 13.7));
  q += w * 0.85;
  float h = 0.5 + 0.62 * noise(q * 0.8 + uSeed * 0.7) + 0.26 * noise(q * 1.9 - uSeed) + 0.09 * noise(q * 4.3 + 3.1);
  float channel = clamp(1.0 - abs(noise(q * 0.7 + uSeed * 1.3 + 7.0)) * 2.6, 0.0, 1.0);
  return h - 0.13 * pow(channel, 6.0);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  float rowFromTop = uGrid.y - 1.0 - cell.y;
  vec2 p = vec2((cell.x + 0.5) * uCell.x - uView.x * 0.5, uView.y * 0.5 - (rowFromTop + 0.5) * uCell.y);
  float unit = 430.0 * uScale;
  vec2 q = p / unit;
  vec4 stream = texture2D(uDye, (p + uView * 0.5) / uView);
  float trail = pow(clamp(stream.x, 0.0, 1.0), 0.9) * uWakeGain * smoothstep(0.05, 0.16, stream.x);
  float trailHeat = max(clamp(stream.y, 0.0, 1.0), 0.72 * sqrt(clamp(stream.x, 0.0, 1.0)));
  float shift = length(stream.zw);
  vec2 moved = (p - stream.zw * smoothstep(3.0, 8.0, shift)) / unit;
  float h = terrain(moved);
  float e = 0.75 * uCell.x / unit;
  float hx = (terrain(moved + vec2(e, 0.0)) - terrain(moved - vec2(e, 0.0))) / (2.0 * e);
  float hy = (terrain(moved + vec2(0.0, e)) - terrain(moved - vec2(0.0, e))) / (2.0 * e);
  float slope = max(length(vec2(hx, hy)) / unit, 1e-5);

  float phase = uTime / max(uPeriod, 1.0) * 6.2831853;
  float swing = 0.085 * uRange;
  float level = uLevel + swing * sin(phase);
  float lapAmount = 0.007 * uWaves;
  float lap = lapAmount * (0.6 * sin(dot(moved, vec2(0.8, 0.6)) * 7.0 - uTime * 1.3) + 0.4 * sin(dot(moved, vec2(-0.45, 0.9)) * 10.5 - uTime * 1.9));

  float ripple = 0.0;
  float rippleWidth = uCell.y * 0.55;
  float rippleSpeed = 120.0 * uRippleSize;
  for (int i = 0; i < MAX_RIPPLES; i++) {
    vec4 source = uRipples[i];
    float age = uClock - source.z;
    if (source.w <= 0.0 || age < 0.0 || age > 4.0) continue;
    float r = length((p - source.xy) * vec2(1.0, uCell.x / uCell.y * 1.9));
    float front = age * rippleSpeed;
    float x = (r - front) / rippleWidth;
    float y = (r - front + uCell.y * 1.6) / rippleWidth;
    float crest = exp(-x * x) + 0.45 * exp(-y * y);
    ripple = max(ripple, source.w * crest * exp(-age * 0.9) * smoothstep(0.0, uCell.y, r) / (1.0 + front / 420.0));
  }

  float surface = level + lap;
  float depth = surface - h;
  float reach = depth / slope;
  float light = 0.0;
  float heat = 0.0;
  float neutral = 0.0;

  if (depth > 0.0) {
    float edge = exp(-reach / (uCell.y * 0.8));
    float breakup = 0.5 + 0.5 * noise(moved * 16.0 + vec2(uTime * 0.22, -uTime * 0.15));
    float lace = smoothstep(0.05, 0.4, noise(moved * 20.0 + vec2(uTime * 0.16, -uTime * 0.1))) * exp(-reach / (uCell.y * 3.6));
    float foam = (edge * (0.5 + 0.7 * breakup) + lace * 0.4) * uFoam;
    float drift = noise(moved * 1.3 + vec2(uTime * 0.03, uTime * 0.018));
    float swell = 0.5 + 0.5 * sin(dot(moved, vec2(0.22, 0.975)) * 40.0 - uTime * 1.2 + drift * 5.0 + depth * 10.0);
    float ring = clamp(ripple, 0.0, 1.0);
    float deep = smoothstep(0.0, 0.2, depth);
    float shallow = exp(-reach / (uCell.y * 6.0));
    float body = 0.05 + 0.26 * swell * swell * swell * uWaves + 0.08 * shallow;
    body = max(body * (1.0 - uDepthFade * deep * 0.5), 0.62 * ring);
    light = max(max(body, clamp(foam, 0.0, 1.0) * 0.72), trail);
    heat = clamp(max(max(foam * 1.15, ring * 0.75), trailHeat * 0.95), 0.0, 1.0);
  } else {
    float wetBack = phase - uWet * 1.2;
    float peak = 1.5707963 + ceil((wetBack - 1.5707963) / 6.2831853) * 6.2831853;
    float high = peak <= phase ? uLevel + swing : max(level, uLevel + swing * sin(wetBack));
    high += lapAmount;
    float wet = clamp((high - h) / max(high - surface, 1e-4), 0.0, 1.0);
    float sheen = wet * wet * step(0.001, uWet);
    float contourH = abs(fract(h * 6.0 + 0.5) - 0.5) / 6.0;
    float line = (1.0 - smoothstep(uCell.y * 0.3, uCell.y * 0.55, contourH / slope)) * uContours;
    float grain = step(0.975, hash(cell + uSeed * 3.1));
    float tremor = clamp(ripple, 0.0, 1.0);
    light = max(max(0.075 * line, 0.05 * grain), 0.1 * sheen * step(hash(cell * 1.93 + 2.0), 0.55));
    light = max(max(light, 0.2 * tremor), trail);
    heat = trailHeat * 0.95;
    neutral = (1.0 - sheen * 0.5) * (1.0 - smoothstep(0.04, 0.3, trail));
  }

  float ramp = pow(clamp(light, 0.0, 1.0), 0.8);
  float index = light > 0.025 ? max(floor(ramp * (uCount - 1.0) + 0.5), 1.0) : 0.0;
  if (trail > 0.025 && trail >= light - 1e-4) index = min(index, floor((uCount - 1.0) * 0.625 + 0.5));
  index = clamp(index, 0.0, uCount - 1.0);
  gl_FragColor = vec4(index / 255.0, light, heat, neutral);
}
`;

const glyphShader = `
precision highp float;

uniform sampler2D uField;
uniform sampler2D uAtlas;
uniform vec2 uCellPx;
uniform vec2 uGrid;
uniform vec2 uResolution;
uniform float uBrightness;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uBackground;
uniform float uInk;
uniform float uTransparent;

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 frag = floor(gl_FragCoord.xy);
  float fromTop = uResolution.y - 1.0 - frag.y;
  vec2 cell = vec2(floor(frag.x / uCellPx.x), floor(fromTop / uCellPx.y));
  vec2 inside = vec2(frag.x - cell.x * uCellPx.x, fromTop - cell.y * uCellPx.y);
  vec4 field = texelFetch(uField, ivec2(cell.x, uGrid.y - 1.0 - cell.y), 0);
  float index = floor(field.r * 255.0 + 0.5);
  float mask = index > 0.5 ? texelFetch(uAtlas, ivec2(index * uCellPx.x + inside.x, inside.y), 0).r : 0.0;
  float light = field.g * uBrightness;

  vec3 neutral = mix(vec3(0.72, 0.72, 0.78), uColorA, 0.22);
  vec3 tone = mix(uColorA, uColorB, smoothstep(0.1, 0.8, field.b));
  tone = mix(tone, vec3(1.0), smoothstep(0.75, 1.0, field.b) * 0.35);
  tone = mix(tone, neutral, field.a);

  if (uInk > 0.5) {
    vec3 ink = mix(uColorA, uColorB, smoothstep(0.1, 0.8, field.b));
    ink = mix(ink, vec3(0.12, 0.12, 0.14), field.a * 0.7);
    vec3 color = mix(uBackground, ink, clamp(mask * light * 2.6, 0.0, 1.0));
    gl_FragColor = vec4(toSrgb(color), 1.0);
    return;
  }

  vec3 emission = tone * mask * light * 1.7;
  if (uTransparent > 0.5) {
    vec3 glow = 1.0 - exp(-emission * 1.1);
    float alpha = clamp(max(max(glow.r, glow.g), glow.b), 0.0, 1.0);
    gl_FragColor = vec4(toSrgb(glow), alpha);
    return;
  }
  vec3 color = 1.0 - exp(-(uBackground + emission) * 1.1);
  gl_FragColor = vec4(toSrgb(color), 1.0);
}
`;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isTransparent = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "transparent") return true;
  if (/^#[0-9a-f]{8}$/.test(normalized)) return normalized.endsWith("00");
  if (/^#[0-9a-f]{4}$/.test(normalized)) return normalized.endsWith("0");
  const alpha = normalized.match(
    /^(?:rgba?|hsla?)\(.*[,/]\s*(0|0?\.0+|0%)\s*\)$/,
  );
  return alpha !== null;
};

const readColor = (target: THREE.Color, value: string, fallback: string) => {
  const trimmed = value.trim();
  try {
    target.set(/^#[0-9a-f]{8}$/i.test(trimmed) ? trimmed.slice(0, 7) : trimmed);
  } catch {
    target.set(fallback);
  }
  return target;
};

const subscribeToDpr = (notify: () => void) => {
  const media = window.matchMedia("(min-resolution: 2dppx)");
  media.addEventListener("change", notify);
  window.addEventListener("resize", notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener("resize", notify);
  };
};

const readDpr = () =>
  typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface PointerInput {
  x: number;
  y: number;
  inside: boolean;
  presses: number;
  pressX: number;
  pressY: number;
}

interface TideSettings {
  colors: string[];
  backgroundColor: string;
  characters: string;
  fontSize: number;
  fontFamily: string;
  scale: number;
  level: number;
  tideRange: number;
  tidePeriod: number;
  waves: number;
  foam: number;
  contours: number;
  wetSand: number;
  depthFade: number;
  brightness: number;
  speed: number;
  interactive: boolean;
  cursorRadius: number;
  cursorStrength: number;
  wake: number;
  wakeLength: number;
  rippleSize: number;
  clickRipples: boolean;
  seed: number;
  paused: boolean;
  reduced: boolean;
}

interface TideSceneProps {
  settings: TideSettings;
  pointerRef: MutableRefObject<PointerInput>;
  wakeRef: MutableRefObject<(() => void) | null>;
}

interface Motion {
  time: number;
  clock: number;
  tracking: boolean;
  brushX: number;
  brushY: number;
  brushVX: number;
  brushVY: number;
  energy: number;
  lastPaint: number;
  splashX: number;
  splashY: number;
  splashTime: number;
  presses: number;
  next: number;
  ripples: THREE.Vector4[];
}

interface FluidPasses {
  velocity: THREE.ShaderMaterial;
  divergence: THREE.ShaderMaterial;
  pressure: THREE.ShaderMaterial;
  project: THREE.ShaderMaterial;
  dye: THREE.ShaderMaterial;
}

interface FieldRig {
  target: THREE.WebGLRenderTarget;
  velocity: THREE.WebGLRenderTarget[];
  pressure: THREE.WebGLRenderTarget[];
  divergence: THREE.WebGLRenderTarget;
  dye: THREE.WebGLRenderTarget[];
  flip: number;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  material: THREE.ShaderMaterial;
  passes: FluidPasses;
  quad: THREE.Mesh;
  columns: number;
  rows: number;
  fluidWidth: number;
  fluidHeight: number;
}

interface Atlas {
  texture: THREE.CanvasTexture;
  count: number;
}

const createFluidTarget = (width: number, height: number) =>
  new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });

const createPass = (
  fragment: string,
  uniforms: Record<string, THREE.IUniform>,
) =>
  new THREE.ShaderMaterial({
    vertexShader: passVertexShader,
    fragmentShader: fragment,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });

const createRig = (
  columns: number,
  rows: number,
  fluidWidth: number,
  fluidHeight: number,
): FieldRig => {
  const target = new THREE.WebGLRenderTarget(columns, rows, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const grid = () => ({
    uSize: { value: new THREE.Vector2(fluidWidth, fluidHeight) },
    uView: { value: new THREE.Vector2(1, 1) },
  });
  const brush = () => ({
    ...grid(),
    uDt: { value: 0 },
    uFrom: { value: new THREE.Vector2() },
    uTo: { value: new THREE.Vector2() },
    uRadius: { value: 12 },
  });
  const passes: FluidPasses = {
    velocity: createPass(velocityShader, {
      ...brush(),
      uVelocity: { value: null },
      uDecay: { value: 1 },
      uBrushVelocity: { value: new THREE.Vector2() },
      uBlend: { value: 0 },
    }),
    divergence: createPass(divergenceShader, {
      ...grid(),
      uVelocity: { value: null },
    }),
    pressure: createPass(pressureShader, {
      ...grid(),
      uPressure: { value: null },
      uDivergence: { value: null },
    }),
    project: createPass(projectShader, {
      ...grid(),
      uPressure: { value: null },
      uVelocity: { value: null },
    }),
    dye: createPass(dyeShader, {
      ...brush(),
      uDye: { value: null },
      uVelocity: { value: null },
      uDecay: { value: new THREE.Vector2(1, 1) },
      uOffsetDecay: { value: 1 },
      uMaxOffset: { value: 30 },
      uPush: { value: 1 },
      uSplash: { value: new THREE.Vector4(0, 0, 0, 1) },
      uSpread: { value: 0 },
      uStrength: { value: 0 },
    }),
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: passVertexShader,
    fragmentShader: fieldShader,
    uniforms: {
      uGrid: { value: new THREE.Vector2(columns, rows) },
      uCell: { value: new THREE.Vector2(8, 16) },
      uView: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uClock: { value: 0 },
      uScale: { value: 1 },
      uSeed: { value: new THREE.Vector2() },
      uLevel: { value: 0.5 },
      uRange: { value: 1 },
      uPeriod: { value: 36 },
      uWaves: { value: 1 },
      uFoam: { value: 1 },
      uContours: { value: 1 },
      uWet: { value: 1 },
      uDepthFade: { value: 0.6 },
      uCount: { value: DEFAULT_CHARACTERS.length },
      uRipples: {
        value: Array.from(
          { length: MAX_RIPPLES },
          () => new THREE.Vector4(0, 0, -99, 0),
        ),
      },
      uRippleSize: { value: 1 },
      uDye: { value: null },
      uWakeGain: { value: 0.95 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  const pair = () => [
    createFluidTarget(fluidWidth, fluidHeight),
    createFluidTarget(fluidWidth, fluidHeight),
  ];
  return {
    target,
    velocity: pair(),
    pressure: pair(),
    divergence: createFluidTarget(fluidWidth, fluidHeight),
    dye: pair(),
    flip: 0,
    scene,
    camera,
    material,
    passes,
    quad,
    columns,
    rows,
    fluidWidth,
    fluidHeight,
  };
};

const disposeRig = (rig: FieldRig) => {
  rig.target.dispose();
  [...rig.velocity, ...rig.pressure, rig.divergence, ...rig.dye].forEach((target) =>
    target.dispose(),
  );
  rig.material.dispose();
  Object.values(rig.passes).forEach((pass) => pass.dispose());
  rig.quad.geometry.dispose();
};

const drawAtlas = (
  canvas: HTMLCanvasElement,
  glyphs: string[],
  cellWidth: number,
  cellHeight: number,
  fontPx: number,
  family: string,
) => {
  canvas.width = Math.max(1, glyphs.length * cellWidth);
  canvas.height = Math.max(1, cellHeight);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${fontPx}px ${family}`;
  glyphs.forEach((character, index) => {
    if (character.trim() === "") return;
    context.fillText(character, index * cellWidth + cellWidth / 2, cellHeight / 2 + fontPx * 0.04);
  });
};

const createUniforms = () => ({
  uField: { value: null as THREE.Texture | null },
  uAtlas: { value: null as THREE.Texture | null },
  uCellPx: { value: new THREE.Vector2(8, 16) },
  uGrid: { value: new THREE.Vector2(1, 1) },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uBrightness: { value: 1 },
  uColorA: { value: new THREE.Color() },
  uColorB: { value: new THREE.Color() },
  uBackground: { value: new THREE.Color() },
  uInk: { value: 0 },
  uTransparent: { value: 0 },
});

type GlyphUniforms = ReturnType<typeof createUniforms>;

const TideScene = ({ settings, pointerRef, wakeRef }: TideSceneProps) => {
  const { gl, size, viewport, invalidate } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const rigRef = useRef<FieldRig | null>(null);
  const atlasRef = useRef<Atlas | null>(null);
  const motionRef = useRef<Motion | null>(null);
  const uniforms = useMemo(() => createUniforms(), []);
  const colorKey = settings.colors.join("|");
  const { backgroundColor, characters, fontFamily } = settings;
  const dpr = viewport.dpr;
  const fontSize = clamp(settings.fontSize, 6, 48);
  const cellWidth = Math.max(3, Math.round(fontSize * 0.6 * dpr));
  const cellHeight = Math.max(5, Math.round(fontSize * 1.15 * dpr));
  const columns = Math.max(1, Math.ceil((size.width * dpr) / cellWidth));
  const rows = Math.max(1, Math.ceil((size.height * dpr) / cellHeight));
  const fluidWidth = Math.max(8, Math.ceil((columns * cellWidth) / dpr / 6));
  const fluidHeight = Math.max(8, Math.ceil((rows * cellHeight) / dpr / 6));

  useEffect(() => {
    const rig = createRig(columns, rows, fluidWidth, fluidHeight);
    rigRef.current = rig;
    invalidate();
    return () => {
      rigRef.current = null;
      disposeRig(rig);
    };
  }, [columns, rows, fluidWidth, fluidHeight, invalidate]);

  useEffect(() => {
    const glyphs = Array.from(characters.length > 1 ? characters : DEFAULT_CHARACTERS);
    const canvas = document.createElement("canvas");
    const fontPx = Math.round(fontSize * dpr);
    const family = fontFamily.trim() || DEFAULT_FONT;
    drawAtlas(canvas, glyphs, cellWidth, cellHeight, fontPx, family);
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    const atlas = { texture, count: glyphs.length };
    atlasRef.current = atlas;
    invalidate();
    let active = true;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts
        .load(`${fontPx}px ${family}`)
        .then(() => {
          if (!active) return;
          drawAtlas(canvas, glyphs, cellWidth, cellHeight, fontPx, family);
          texture.needsUpdate = true;
          invalidate();
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
      if (atlasRef.current === atlas) atlasRef.current = null;
      texture.dispose();
    };
  }, [characters, fontFamily, fontSize, dpr, cellWidth, cellHeight, invalidate]);

  useEffect(() => {
    wakeRef.current = invalidate;
    return () => {
      wakeRef.current = null;
    };
  }, [invalidate, wakeRef]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    const values = material.uniforms as unknown as GlyphUniforms;
    const palette = colorKey ? colorKey.split("|") : DEFAULT_COLORS;
    readColor(values.uColorA.value, palette[0] ?? DEFAULT_COLORS[0], DEFAULT_COLORS[0]);
    readColor(
      values.uColorB.value,
      palette[1] ?? palette[0] ?? DEFAULT_COLORS[1],
      DEFAULT_COLORS[1],
    );
    const transparent = isTransparent(backgroundColor);
    readColor(
      values.uBackground.value,
      transparent ? "#000000" : backgroundColor,
      "#000000",
    );
    const background = values.uBackground.value;
    const luminance =
      background.r * 0.2126 + background.g * 0.7152 + background.b * 0.0722;
    values.uInk.value = !transparent && luminance > 0.2 ? 1 : 0;
    values.uTransparent.value = transparent ? 1 : 0;
    invalidate();
  }, [colorKey, backgroundColor, invalidate]);

  useEffect(() => {
    invalidate();
  }, [settings, size, invalidate]);

  useFrame((_, delta) => {
    const material = materialRef.current;
    const rig = rigRef.current;
    const atlas = atlasRef.current;
    if (!material || !rig || !atlas) return;
    const values = material.uniforms as unknown as GlyphUniforms;
    const s = settings;
    const input = pointerRef.current;
    const dt = Math.min(Math.max(delta, 0), 0.1);
    const animate = !s.paused && !s.reduced;
    const period = clamp(s.tidePeriod, 4, 240);

    if (!motionRef.current) {
      motionRef.current = {
        time: period * 0.38,
        clock: 0,
        tracking: false,
        brushX: 0,
        brushY: 0,
        brushVX: 0,
        brushVY: 0,
        energy: 0,
        lastPaint: -99,
        splashX: 0,
        splashY: 0,
        splashTime: -99,
        presses: input.presses,
        next: 0,
        ripples: Array.from(
          { length: MAX_RIPPLES },
          () => new THREE.Vector4(0, 0, -99, 0),
        ),
      };
    }
    const motion = motionRef.current;
    if (animate) motion.time += dt * clamp(s.speed, 0, 4);
    if (!s.reduced) motion.clock += dt;

    const cellCssX = cellWidth / dpr;
    const cellCssY = cellHeight / dpr;
    const gridWidth = rig.columns * cellCssX;
    const gridHeight = rig.rows * cellCssY;
    const emit = (x: number, y: number, amplitude: number) => {
      const slot = motion.next;
      motion.next = (slot + 1) % MAX_RIPPLES;
      motion.ripples[slot].set(x - gridWidth / 2, gridHeight / 2 - y, motion.clock, amplitude);
    };

    const tracking = s.interactive && !s.reduced && input.inside;
    const pointerX = input.x - gridWidth / 2;
    const pointerY = gridHeight / 2 - input.y;
    if (tracking && !motion.tracking) {
      motion.brushX = pointerX;
      motion.brushY = pointerY;
      motion.brushVX = 0;
      motion.brushVY = 0;
    }
    motion.tracking = tracking;
    const fromX = motion.brushX;
    const fromY = motion.brushY;
    if (tracking && dt > 0) {
      const omega = 16;
      const steps = Math.max(2, Math.ceil(dt / 0.008));
      const h = dt / steps;
      for (let k = 0; k < steps; k++) {
        motion.brushVX +=
          ((pointerX - motion.brushX) * omega * omega - motion.brushVX * 2 * omega) * h;
        motion.brushVY +=
          ((pointerY - motion.brushY) * omega * omega - motion.brushVY * 2 * omega) * h;
        motion.brushX += motion.brushVX * h;
        motion.brushY += motion.brushVY * h;
      }
    } else {
      motion.brushVX = 0;
      motion.brushVY = 0;
    }
    const brushSpeed = Math.hypot(motion.brushVX, motion.brushVY);
    const drive = tracking ? 1 - Math.exp(-brushSpeed / 260) : 0;
    const response = drive > motion.energy ? 0.05 : 0.18;
    motion.energy += (drive - motion.energy) * (1 - Math.exp(-dt / response));
    if (motion.energy > 0.01) motion.lastPaint = motion.clock;

    if (input.presses !== motion.presses) {
      motion.presses = input.presses;
      if (s.clickRipples && s.interactive && !s.reduced) {
        emit(input.pressX, input.pressY, 1.7);
        motion.splashX = input.pressX - gridWidth / 2;
        motion.splashY = gridHeight / 2 - input.pressY;
        motion.splashTime = motion.clock;
      }
    }

    const field = rig.material.uniforms;
    (field.uGrid.value as THREE.Vector2).set(rig.columns, rig.rows);
    (field.uCell.value as THREE.Vector2).set(cellCssX, cellCssY);
    (field.uView.value as THREE.Vector2).set(gridWidth, gridHeight);
    field.uTime.value = motion.time;
    field.uClock.value = motion.clock;
    field.uScale.value = clamp(s.scale, 0.2, 5);
    (field.uSeed.value as THREE.Vector2).set(s.seed * 17.13, s.seed * -9.71);
    field.uLevel.value = clamp(s.level, 0, 1);
    field.uRange.value = clamp(s.tideRange, 0, 3);
    field.uPeriod.value = period;
    field.uWaves.value = clamp(s.waves, 0, 3);
    field.uFoam.value = clamp(s.foam, 0, 3);
    field.uContours.value = clamp(s.contours, 0, 3);
    field.uWet.value = clamp(s.wetSand, 0, 4);
    field.uDepthFade.value = clamp(s.depthFade, 0, 1);
    field.uCount.value = atlas.count;
    field.uRippleSize.value = clamp(s.rippleSize, 0.3, 3);
    let rippling = false;
    const ripples = field.uRipples.value as THREE.Vector4[];
    for (let k = 0; k < MAX_RIPPLES; k++) {
      ripples[k].copy(motion.ripples[k]);
      if (motion.ripples[k].w > 0 && motion.clock - motion.ripples[k].z < 5) rippling = true;
    }

    const wakeStrength = clamp(s.wake, 0, 3);
    const wakeLength = clamp(s.wakeLength, 0.2, 10);
    const reach = clamp(s.cursorRadius, 8, 600);
    const push = clamp(s.cursorStrength, 0, 3);
    const speedFactor = 1 - Math.exp(-brushSpeed / 900);
    const radius = clamp(reach * 0.1, 4, 40) * (0.9 + 0.3 * speedFactor);
    const splashAge = motion.clock - motion.splashTime;
    const flowing =
      motion.clock - motion.lastPaint < Math.max(wakeLength * 5, 8) || splashAge < 8;
    const passes = rig.passes;
    const quad = rig.quad;
    const run = (pass: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget) => {
      quad.material = pass;
      gl.setRenderTarget(target);
      gl.render(rig.scene, rig.camera);
    };
    const place = (pass: THREE.ShaderMaterial, stroke: boolean) => {
      const uniforms = pass.uniforms;
      (uniforms.uSize.value as THREE.Vector2).set(rig.fluidWidth, rig.fluidHeight);
      (uniforms.uView.value as THREE.Vector2).set(gridWidth, gridHeight);
      if (!stroke) return uniforms;
      (uniforms.uFrom.value as THREE.Vector2).set(fromX, fromY);
      (uniforms.uTo.value as THREE.Vector2).set(motion.brushX, motion.brushY);
      uniforms.uDt.value = dt;
      uniforms.uRadius.value = radius;
      return uniforms;
    };
    const previousTarget = gl.getRenderTarget();
    if (flowing && dt > 0) {
      const source = rig.flip;
      const sink = 1 - source;
      const velocity = place(passes.velocity, true);
      velocity.uVelocity.value = rig.velocity[0].texture;
      velocity.uDecay.value = Math.exp(-dt / (0.22 * wakeLength));
      velocity.uRadius.value = reach * 0.5;
      (velocity.uBrushVelocity.value as THREE.Vector2).set(
        motion.brushVX * 0.55,
        motion.brushVY * 0.55,
      );
      velocity.uBlend.value =
        (1 - Math.exp(-dt / 0.05)) * motion.energy * Math.min(wakeStrength, 1);
      run(passes.velocity, rig.velocity[1]);

      const divergence = place(passes.divergence, false);
      divergence.uVelocity.value = rig.velocity[1].texture;
      run(passes.divergence, rig.divergence);

      const pressure = place(passes.pressure, false);
      pressure.uDivergence.value = rig.divergence.texture;
      gl.setRenderTarget(rig.pressure[0]);
      gl.clearColor();
      for (let k = 0; k < 10; k++) {
        pressure.uPressure.value = rig.pressure[k % 2].texture;
        run(passes.pressure, rig.pressure[1 - (k % 2)]);
      }

      const project = place(passes.project, false);
      project.uPressure.value = rig.pressure[0].texture;
      project.uVelocity.value = rig.velocity[1].texture;
      run(passes.project, rig.velocity[0]);

      const dye = place(passes.dye, true);
      dye.uDye.value = rig.dye[source].texture;
      dye.uVelocity.value = rig.velocity[0].texture;
      (dye.uDecay.value as THREE.Vector2).set(
        Math.exp(-dt / (0.42 * wakeLength)),
        Math.exp(-dt / (0.45 * wakeLength)),
      );
      dye.uOffsetDecay.value = Math.exp(-dt / (0.5 * wakeLength));
      dye.uMaxOffset.value = reach * 0.75 * push;
      dye.uPush.value = 1.8 * push;
      (dye.uSplash.value as THREE.Vector4).set(
        motion.splashX,
        motion.splashY,
        splashAge < 0.2 ? reach * 2.2 * push : 0,
        reach * 1.1,
      );
      dye.uSpread.value = 1 - Math.exp(-dt / 0.35);
      dye.uStrength.value = motion.energy * Math.min(wakeStrength, 1);
      run(passes.dye, rig.dye[sink]);
      rig.flip = sink;
    }
    field.uDye.value = rig.dye[rig.flip].texture;
    field.uWakeGain.value = 0.95 * Math.sqrt(Math.max(wakeStrength, 1));
    quad.material = rig.material;
    gl.setRenderTarget(rig.target);
    gl.render(rig.scene, rig.camera);
    gl.setRenderTarget(previousTarget);

    values.uField.value = rig.target.texture;
    values.uAtlas.value = atlas.texture;
    values.uCellPx.value.set(cellWidth, cellHeight);
    values.uGrid.value.set(rig.columns, rig.rows);
    values.uResolution.value.set(size.width * dpr, size.height * dpr);
    values.uBrightness.value = clamp(s.brightness, 0, 3);

    if (!animate && !s.reduced && (rippling || tracking || flowing)) invalidate();
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={passVertexShader}
        fragmentShader={glyphShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

export const GlyphTide = ({
  colors = DEFAULT_COLORS,
  backgroundColor = "#0a0a0a",
  characters = DEFAULT_CHARACTERS,
  fontSize = 11,
  fontFamily = DEFAULT_FONT,
  scale = 1,
  level = 0.5,
  tideRange = 1,
  tidePeriod = 36,
  waves = 1,
  foam = 1,
  contours = 1,
  wetSand = 0.6,
  depthFade = 0.6,
  brightness = 1,
  speed = 1,
  interactive = true,
  cursorRadius = 80,
  cursorStrength = 1,
  wake = 1,
  wakeLength = 2,
  rippleSize = 1,
  clickRipples = true,
  seed = 0,
  paused = false,
  dpr = 2,
  className,
  style,
  children,
}: GlyphTideProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerInput>({
    x: 0,
    y: 0,
    inside: false,
    presses: 0,
    pressX: 0,
    pressY: 0,
  });
  const wakeRef = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(true);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    readMotion,
    () => false,
  );
  const deviceDpr = useSyncExternalStore(subscribeToDpr, readDpr, () => 1);
  const pixelRatio = Math.min(deviceDpr, Math.max(dpr, 0.5));
  const animated = !paused && !reducedMotion;
  const transparent = isTransparent(backgroundColor);

  const settings: TideSettings = {
    colors,
    backgroundColor,
    characters,
    fontSize,
    fontFamily,
    scale,
    level,
    tideRange,
    tidePeriod,
    waves,
    foam,
    contours,
    wetSand,
    depthFade,
    brightness,
    speed,
    interactive,
    cursorRadius,
    cursorStrength,
    wake,
    wakeLength,
    rippleSize,
    clickRipples,
    seed,
    paused,
    reduced: reducedMotion,
  };

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "80px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const locate = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const state = pointerRef.current;
      state.x = event.clientX - box.left;
      state.y = event.clientY - box.top;
      state.inside = true;
    };
    const move = (event: PointerEvent) => {
      locate(event);
      wakeRef.current?.();
    };
    const down = (event: PointerEvent) => {
      locate(event);
      const state = pointerRef.current;
      state.pressX = state.x;
      state.pressY = state.y;
      state.presses += 1;
      wakeRef.current?.();
    };
    const leave = () => {
      pointerRef.current.inside = false;
      wakeRef.current?.();
    };
    node.addEventListener("pointermove", move, { passive: true });
    node.addEventListener("pointerdown", down, { passive: true });
    node.addEventListener("pointerleave", leave, { passive: true });
    node.addEventListener("pointercancel", leave, { passive: true });
    return () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointerleave", leave);
      node.removeEventListener("pointercancel", leave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={["glyph-tide", className].filter(Boolean).join(" ")}
      style={{
        backgroundColor: transparent ? undefined : backgroundColor,
        ...style,
      }}
    >
      <div className="glyph-tide__canvas" aria-hidden="true">
        <Canvas
          dpr={pixelRatio}
          frameloop={visible && animated ? "always" : "demand"}
          gl={{
            antialias: false,
            alpha: true,
            premultipliedAlpha: true,
            powerPreference: "high-performance",
          }}
          style={{ pointerEvents: "none" }}
        >
          <TideScene
            settings={settings}
            pointerRef={pointerRef}
            wakeRef={wakeRef}
          />
        </Canvas>
      </div>
      {children ? (
        <div className="glyph-tide__content">{children}</div>
      ) : null}
    </div>
  );
};

export default GlyphTide;
