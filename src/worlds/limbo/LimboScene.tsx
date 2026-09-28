import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Points,
  PointsMaterial,
  type PerspectiveCamera,
} from "three";

export type LimboPointer = { x: number; y: number; active: boolean };

const COUNT = 5600;
const RADIUS = 1.08;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function dotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.95)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function buildParticles() {
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const home = new Float32Array(COUNT * 3);
  const phase = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i += 1) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN * i;
    const shell = 0.93 + ((i * 17) % 100) / 1000;
    const o = i * 3;
    home[o] = Math.cos(theta) * ring * RADIUS * shell;
    home[o + 1] = y * RADIUS * shell;
    home[o + 2] = Math.sin(theta) * ring * RADIUS * shell;
    positions[o] = home[o];
    positions[o + 1] = home[o + 1];
    positions[o + 2] = home[o + 2];
    phase[i] = (i % 628) / 100;
    const rim = Math.pow(ring, 0.55);
    const shade = 0.28 + rim * 0.72;
    colors[o] = shade;
    colors[o + 1] = shade;
    colors[o + 2] = shade;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  const material = new PointsMaterial({
    map: dotTexture(),
    size: 0.026,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    sizeAttenuation: true,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return { points, geometry, material, home, phase, positions, colors };
}

export function LimboScene({
  pointerRef,
}: {
  blendRef: RefObject<number>;
  pointerRef: RefObject<LimboPointer>;
}) {
  const reduceRef = useRef<boolean | null>(null);
  const followed = useRef({ x: 0, y: 0 });
  const spin = useRef(0);
  const field = useMemo(() => buildParticles(), []);

  useEffect(() => {
    return () => {
      field.geometry.dispose();
      field.material.dispose();
      const map = field.material.map;
      if (map) map.dispose();
    };
  }, [field]);

  useFrame((state, delta) => {
    if (reduceRef.current === null) {
      reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    const reduce = reduceRef.current;
    const pointer = pointerRef.current ?? { x: 0, y: 0, active: false };
    const dt = Math.min(delta, 0.05);
    const follow = 1 - Math.exp(-dt * 2.4);
    if (!reduce && pointer.active) {
      followed.current.x += (pointer.x - followed.current.x) * follow;
      followed.current.y += (pointer.y - followed.current.y) * follow;
    }
    if (!reduce) spin.current += dt * 0.28;

    const camera = state.camera as PerspectiveCamera;
    const distance = Math.max(0.1, camera.position.length());
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * distance;
    const halfW = halfH * (state.size.width / Math.max(1, state.size.height));
    const aim = followed.current;
    const px = aim.x * halfW;
    const py = aim.y * halfH;
    const side = pointer.active && !reduce ? smoothstep(0.34, 0.72, Math.abs(aim.x)) : 0;
    const time = reduce ? 0 : performance.now() / 1000;
    const cos = Math.cos(spin.current);
    const sin = Math.sin(spin.current);

    const { positions, colors, home, phase } = field;
    for (let i = 0; i < COUNT; i += 1) {
      const o = i * 3;
      const hx = home[o] * cos + home[o + 2] * sin;
      const hy = home[o + 1];
      const hz = -home[o] * sin + home[o + 2] * cos;

      const dx = hx - px;
      const dy = hy - py;
      const dist = Math.hypot(dx, dy);
      const front = smoothstep(-0.15, 0.55, hz / RADIUS);
      const influence = pointer.active ? smoothstep(0.78, 0.02, dist) * front * (1 - side) : 0;
      const push = influence * 0.62;
      const inv = dist > 0.0008 ? 1 / dist : 0;

      const orbit = phase[i] + time * (2.6 + (i % 5) * 0.18);
      const orbitR = 0.05 + (i % 13) * 0.011;
      const sx = px + Math.cos(orbit) * orbitR;
      const sy = py + Math.sin(orbit) * orbitR;
      const sz = Math.sin(orbit * 2) * orbitR * 0.35;

      const looseX = hx + dx * inv * push;
      const looseY = hy + dy * inv * push;
      const looseZ = hz + influence * 0.22;
      const targetX = looseX + (sx - looseX) * side;
      const targetY = looseY + (sy - looseY) * side;
      const targetZ = looseZ + (sz - looseZ) * side;

      const lag = 1 - Math.exp(-dt * (3.1 + (i % 6) * 0.2));
      positions[o] += (targetX - positions[o]) * lag;
      positions[o + 1] += (targetY - positions[o + 1]) * lag;
      positions[o + 2] += (targetZ - positions[o + 2]) * lag;

      const rim = Math.pow(1 - Math.min(1, Math.abs(hz) / RADIUS), 0.6);
      const shade = side > 0.2 ? 0.55 + side * 0.45 : 0.22 + rim * 0.78;
      colors[o] = shade;
      colors[o + 1] = shade;
      colors[o + 2] = shade;
    }
    field.geometry.attributes.position.needsUpdate = true;
    field.geometry.attributes.color.needsUpdate = true;
  });

  return <primitive object={field.points} />;
}
