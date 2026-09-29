import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Euler,
  Points,
  PointsMaterial,
  Vector3,
  type Group,
  type PerspectiveCamera,
} from "three";

export type LimboPointer = { x: number; y: number; active: boolean };

const COUNT = 5600;
const LOST_AT_START = 260;
const RADIUS = 1.08;
/** Pitch and yaw of the whole cloud. Shell and strays stay on one angled plane. */
const SCENE_TILT: [number, number, number] = [0, 0, 0];
const tiltEuler = new Euler(SCENE_TILT[0], SCENE_TILT[1], SCENE_TILT[2]);
const tiltPoint = new Vector3();
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const SHELL = 0;
const LOST = 1;
/** Draw on a stray. Off at rest; only strays in STRAY_REACH feel it, and only once the orb has left center. */
const STRAY_PULL = 0.16;
/** Gap outside the shell where a stray can be drawn. Wider than this, it keeps drifting. */
const STRAY_REACH = 0.7;

function hash(index: number) {
  const value = Math.sin(index * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

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

/** Peak radial swell of one breath, one percent of the shell radius. */
const HEART_SWELL = 0.01;
/** How long the swell lasts inside each beat. The rest of the ~1s cycle is still. */
const HEART_SPAN = 0.8;

/** One breath: a soft rise, then a longer fall. Peak is 1. */
function heartbeat(age: number) {
  if (age <= 0 || age >= HEART_SPAN) return 0;
  const t = age / HEART_SPAN;
  const rise = 0.38;
  return t < rise ? smoothstep(0, rise, t) : 1 - smoothstep(rise, 1, t);
}

function buildParticles() {
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const home = new Float32Array(COUNT * 3);
  const velocity = new Float32Array(COUNT * 3);
  const phase = new Float32Array(COUNT);
  const mode = new Uint8Array(COUNT);
  const escape = new Float32Array(COUNT);

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

  for (let n = 0; n < LOST_AT_START; n += 1) {
    const i = (n * 97) % COUNT;
    const o = i * 3;
    mode[i] = LOST;
    let lostX = (hash(n) * 2 - 1) * 2.7;
    let lostY = (hash(n + 40) * 2 - 1) * 1.55;
    const fromCenter = Math.hypot(lostX, lostY) || 1;
    if (fromCenter < 1.75) {
      lostX = (lostX / fromCenter) * 1.75;
      lostY = (lostY / fromCenter) * 1.75;
    }
    positions[o] = lostX;
    positions[o + 1] = lostY;
    positions[o + 2] = (hash(n + 80) - 0.5) * 0.35;
    velocity[o] = (hash(n + 11) - 0.5) * 0.22;
    velocity[o + 1] = (hash(n + 23) - 0.5) * 0.16;
    const shade = 0.96;
    colors[o] = shade;
    colors[o + 1] = shade;
    colors[o + 2] = shade;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  const material = new PointsMaterial({
    map: dotTexture(),
    size: 0.034,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    sizeAttenuation: true,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return { points, geometry, material, home, phase, positions, colors, velocity, mode, escape };
}

export function LimboScene({
  pointerRef,
}: {
  blendRef: RefObject<number>;
  pointerRef: RefObject<LimboPointer>;
}) {
  const groupRef = useRef<Group>(null);
  const reduceRef = useRef<boolean | null>(null);
  const followed = useRef({ x: 0, y: 0 });
  const spin = useRef(0);
  const shed = useRef(0);
  const shedWait = useRef(4 + Math.random());
  const beat = useRef({ age: 0, wait: 0.92 + Math.random() * 0.16 });
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
    const ease = 1 - Math.exp(-dt * 2.4);
    if (!reduce && pointer.active) {
      followed.current.x += (pointer.x - followed.current.x) * ease;
      followed.current.y += (pointer.y - followed.current.y) * ease;
    }
    if (!reduce) spin.current += dt * 0.28;

    const camera = state.camera as PerspectiveCamera;
    const distance = Math.max(0.1, camera.position.length());
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * distance;
    const halfW = halfH * (state.size.width / Math.max(1, state.size.height));
    const aim = followed.current;
    const px = aim.x * halfW;
    const py = aim.y * halfH;
    const travel = pointer.active && !reduce ? Math.hypot(aim.x, aim.y) : 0;
    const follow = pointer.active && !reduce ? smoothstep(0.08, 0.28, travel) : 0;
    const singularity = pointer.active && !reduce ? smoothstep(0.16, 0.88, Math.abs(aim.x)) : 0;
    const orbX = px * follow;
    const orbY = py * follow;
    const body = RADIUS * (1 - singularity) + 0.2 * singularity;
    let beatEnv = 0;
    if (!reduce) {
      beat.current.age += dt;
      if (beat.current.age >= beat.current.wait) {
        beat.current.age -= beat.current.wait;
        beat.current.wait = 0.9 + Math.random() * 0.2;
      }
      beatEnv = heartbeat(beat.current.age);
    }
    const beatScale = 1 + beatEnv * (1 - singularity) * HEART_SWELL;
    const time = reduce ? 0 : performance.now() / 1000;
    const cos = Math.cos(spin.current);
    const sin = Math.sin(spin.current);

    if (!reduce) {
      shed.current += dt;
      if (shed.current > shedWait.current) {
        shed.current = 0;
        shedWait.current = 4 + Math.random();
        const release = 1 + Math.floor(Math.random() * 2);
        const start = Math.floor(Math.random() * COUNT);
        let freed = 0;
        for (let n = 0; n < COUNT && freed < release; n += 1) {
          const i = (start + n) % COUNT;
          if (field.mode[i] !== SHELL) continue;
          const o = i * 3;
          field.mode[i] = LOST;
          field.escape[i] = 2.6;
          const dx = field.positions[o] - orbX;
          const dy = field.positions[o + 1] - orbY;
          const dz = field.positions[o + 2];
          const length = Math.hypot(dx, dy, dz) || 1;
          const tangent = (Math.random() - 0.5) * 0.04;
          field.velocity[o] = (dx / length) * 0.04 - (dy / length) * tangent;
          field.velocity[o + 1] = (dy / length) * 0.04 + (dx / length) * tangent;
          field.velocity[o + 2] = (dz / length) * 0.02;
          field.positions[o] += (dx / length) * 0.03;
          field.positions[o + 1] += (dy / length) * 0.03;
          freed += 1;
        }
      }
    }

    const { positions, colors, home, phase, velocity, mode, escape } = field;
    for (let i = 0; i < COUNT; i += 1) {
      const o = i * 3;
      const hx = home[o] * cos + home[o + 2] * sin;
      const hy = home[o + 1];
      const hz = -home[o] * sin + home[o + 2] * cos;
      const orbit = phase[i] + time * (2.6 + (i % 5) * 0.18);
      const orbitR = 0.05 + (i % 13) * 0.011;

      if (mode[i] === LOST) {
        const toX = orbX - positions[o];
        const toY = orbY - positions[o + 1];
        const toZ = -positions[o + 2];
        const radial = Math.hypot(toX, toY, positions[o + 2]);
        const gap = radial - body;
        const r = Math.max(radial, 0.4);
        const outward = -(velocity[o] * toX + velocity[o + 1] * toY + velocity[o + 2] * toZ) / r;
        if (escape[i] > 0) {
          escape[i] = Math.max(0, escape[i] - dt);
          if (gap < 1.5 && outward < 0.48) {
            const push = 0.42 / (r * r);
            velocity[o] -= (toX / r) * push * dt;
            velocity[o + 1] -= (toY / r) * push * dt;
            velocity[o + 2] -= (toZ / r) * push * dt;
          }
        } else if (follow > 0 && gap < STRAY_REACH) {
          const dir = Math.max(radial, 1e-4);
          const nx = toX / dir;
          const ny = toY / dir;
          const nz = toZ / dir;
          // Ease off in the last stretch. Inverse-square would speed up into the surface.
          const settle = smoothstep(0.32, 0.05, gap);
          const softened = Math.max(radial, 0.9);
          const pull = (STRAY_PULL / (softened * softened)) * follow * (1 - settle);
          velocity[o] += nx * pull * dt;
          velocity[o + 1] += ny * pull * dt;
          velocity[o + 2] += nz * pull * dt;
          const toward = velocity[o] * nx + velocity[o + 1] * ny + velocity[o + 2] * nz;
          const glide = 0.2;
          if (toward > glide) {
            const excess = (toward - glide) * settle;
            velocity[o] -= nx * excess;
            velocity[o + 1] -= ny * excess;
            velocity[o + 2] -= nz * excess;
          }
          if (gap < 0.06) {
            const ox = positions[o] - orbX;
            const oy = positions[o + 1] - orbY;
            const oz = positions[o + 2];
            const len = Math.hypot(ox, oy, oz) || 1;
            const homeR = Math.hypot(home[o], home[o + 1], home[o + 2]) || RADIUS;
            const sx = (ox / len) * homeR;
            const sy = (oy / len) * homeR;
            const sz = (oz / len) * homeR;
            home[o] = sx * cos - sz * sin;
            home[o + 1] = sy;
            home[o + 2] = sx * sin + sz * cos;
            phase[i] = Math.atan2(oy, ox) - time * (2.6 + (i % 5) * 0.18);
            mode[i] = SHELL;
            velocity[o] = 0;
            velocity[o + 1] = 0;
            velocity[o + 2] = 0;
          }
        }
        if (gap > 1.15) {
          velocity[o] += Math.sin(time * 0.65 + phase[i]) * dt * 0.03;
          velocity[o + 1] += Math.cos(time * 0.5 + phase[i]) * dt * 0.025;
        }
        const drag = 1 - dt * 0.04;
        velocity[o] *= drag;
        velocity[o + 1] *= drag;
        velocity[o + 2] *= drag;
        positions[o] += velocity[o] * dt;
        positions[o + 1] += velocity[o + 1] * dt;
        positions[o + 2] += velocity[o + 2] * dt;
        if (Math.abs(positions[o]) > halfW * 0.96) velocity[o] *= -0.8;
        if (Math.abs(positions[o + 1]) > halfH * 0.96) velocity[o + 1] *= -0.8;
        colors[o] = 1;
        colors[o + 1] = 1;
        colors[o + 2] = 1;
        continue;
      }

      const dx = hx - px;
      const dy = hy - py;
      const dist = Math.hypot(dx, dy);
      const front = smoothstep(-0.15, 0.55, hz / RADIUS);
      const influence = pointer.active ? smoothstep(0.78, 0.02, dist) * front * (1 - follow) * (1 - singularity) : 0;
      const push = influence * 0.62;
      const inv = dist > 0.0008 ? 1 / dist : 0;
      const looseX = hx + dx * inv * push;
      const looseY = hy + dy * inv * push;
      const looseZ = hz + influence * 0.22;
      const shellX = looseX * (1 - singularity) + Math.cos(orbit) * orbitR * singularity;
      const shellY = looseY * (1 - singularity) + Math.sin(orbit) * orbitR * singularity;
      const shellZ = looseZ * (1 - singularity) + Math.sin(orbit * 2) * orbitR * 0.35 * singularity;
      const targetX = orbX + shellX * beatScale;
      const targetY = orbY + shellY * beatScale;
      const targetZ = shellZ * beatScale;
      const lag = 1 - Math.exp(-dt * (3.1 + (i % 6) * 0.2));
      positions[o] += (targetX - positions[o]) * lag;
      positions[o + 1] += (targetY - positions[o + 1]) * lag;
      positions[o + 2] += (targetZ - positions[o + 2]) * lag;

      const rim = Math.pow(1 - Math.min(1, Math.abs(hz) / RADIUS), 0.6);
      const shade = Math.min(
        1,
        (singularity > 0.2 ? 0.55 + singularity * 0.45 : 0.22 + rim * 0.78) + beatEnv * (1 - singularity) * 0.008,
      );
      colors[o] = shade;
      colors[o + 1] = shade;
      colors[o + 2] = shade;
    }

    field.geometry.attributes.position.needsUpdate = true;
    field.geometry.attributes.color.needsUpdate = true;

    const group = groupRef.current;
    if (group) {
      tiltPoint.set(orbX, orbY, 0).applyEuler(tiltEuler);
      group.position.set(orbX - tiltPoint.x, orbY - tiltPoint.y, -tiltPoint.z);
      document.documentElement.dataset.limbo = `${state.scene.children.length}:${state.scene.children
        .map((child) => `${child.type}${child.children.length}`)
        .join(",")}`;
    }
  });

  return (
    <group ref={groupRef} rotation={SCENE_TILT}>
      <primitive object={field.points} />
    </group>
  );
}
