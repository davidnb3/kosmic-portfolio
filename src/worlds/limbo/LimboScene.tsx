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
/** `depart` starts the music flight. The scene eases the rest. */
export type LimboStage = { depart: boolean };

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
const WAVE = 2;
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

const FRAME = 0;
const SURROUND = 1;
const CONE = 2;
const CAP = 3;
const SCREW = 4;
const WAVE_GROUPS = 4;
/** Cone axis: the mouth opens toward the camera and down to the right, so the view looks into the cone from above-left. */
const WAVE_F = { x: 0.46, y: -0.38, z: 0.8 };
const WAVE_SPEED = 0.4;
const SPEAKER_SCALE = 0.74;

function coneBasis() {
  const fl = Math.hypot(WAVE_F.x, WAVE_F.y, WAVE_F.z);
  const fx = WAVE_F.x / fl;
  const fy = WAVE_F.y / fl;
  const fz = WAVE_F.z / fl;
  let rx = fz;
  let ry = 0;
  let rz = -fx;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  const bx = fy * rz - fz * ry;
  const by = fz * rx - fx * rz;
  const bz = fx * ry - fy * rx;
  return { fx, fy, fz, rx, ry, rz, bx, by, bz };
}

const CONE_BASIS = coneBasis();

function placeCone(x: number, y: number, along: number, out: Float32Array, o: number) {
  const b = CONE_BASIS;
  out[o] = (b.rx * x + b.bx * y + b.fx * along) * SPEAKER_SCALE;
  out[o + 1] = (b.ry * x + b.by * y + b.fy * along) * SPEAKER_SCALE;
  out[o + 2] = (b.rz * x + b.bz * y + b.fz * along) * SPEAKER_SCALE;
}

/** Woofer seen from above-left. The mouth opens toward the bottom-right. */
function buildSpeaker() {
  const home = new Float32Array(COUNT * 3);
  const kind = new Uint8Array(COUNT);
  const waveSlot = new Uint8Array(COUNT);
  let waveCount = 0;
  for (let i = 0; i < COUNT; i += 1) {
    const o = i * 3;
    const slot = i % 20;
    const ang = GOLDEN * i;
    if (slot <= 1) {
      kind[i] = SCREW;
      const which = i % 6;
      const screwAng = (which / 6) * Math.PI * 2;
      const jx = (hash(i) - 0.5) * 0.07;
      const jy = (hash(i + 3) - 0.5) * 0.07;
      placeCone(Math.cos(screwAng) * 1.22 + jx, Math.sin(screwAng) * 1.22 + jy, 0.02, home, o);
    } else if (slot <= 4) {
      kind[i] = FRAME;
      const rad = 1.02 + hash(i + 2) * 0.22;
      placeCone(Math.cos(ang) * rad, Math.sin(ang) * rad, (hash(i + 6) - 0.5) * 0.06, home, o);
    } else if (slot <= 8) {
      kind[i] = SURROUND;
      const rad = 0.9 + Math.sin(hash(i + 7) * Math.PI * 2) * 0.07;
      const tube = (hash(i + 9) - 0.5) * 0.1;
      placeCone(Math.cos(ang) * rad, Math.sin(ang) * rad, 0.04 + tube, home, o);
    } else if (slot <= 11) {
      kind[i] = CAP;
      const rad = Math.sqrt(hash(i + 5)) * 0.24;
      const dome = Math.cos((rad / 0.24) * Math.PI * 0.5) * 0.1;
      placeCone(Math.cos(ang) * rad, Math.sin(ang) * rad, -0.42 + dome, home, o);
    } else {
      kind[i] = CONE;
      const t = hash(i + 11);
      const rad = 0.26 + t * 0.62;
      const along = -0.4 + t * 0.42;
      placeCone(Math.cos(ang) * rad, Math.sin(ang) * rad, along, home, o);
      if (t > 0.48 && hash(i + 13) > 0.22) {
        waveCount += 1;
        waveSlot[i] = (waveCount % WAVE_GROUPS) + 1;
      }
    }
  }
  return { home, kind, waveSlot };
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
  const speaker = buildSpeaker();
  return {
    points,
    geometry,
    material,
    home,
    phase,
    positions,
    colors,
    velocity,
    mode,
    escape,
    speakerHome: speaker.home,
    speakerKind: speaker.kind,
    speakerWave: speaker.waveSlot,
  };
}

const FLIGHT = 1.35;

export function LimboScene({
  pointerRef,
  stageRef,
}: {
  blendRef: RefObject<number>;
  pointerRef: RefObject<LimboPointer>;
  stageRef: RefObject<LimboStage>;
}) {
  const groupRef = useRef<Group>(null);
  const reduceRef = useRef<boolean | null>(null);
  const followed = useRef({ x: 0, y: 0 });
  const spin = useRef(0);
  const spinRate = useRef(0.28);
  const shed = useRef(0);
  const shedWait = useRef(4 + Math.random());
  const beat = useRef({ age: 0, wait: 0.92 + Math.random() * 0.16 });
  const flight = useRef(0);
  const waveGroup = useRef(0);
  const crests = useRef<number[]>([]);
  const thump = useRef({ age: 0, wait: 3.6, prev: 0 });
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
    let orbX = px * follow;
    let orbY = py * follow;
    const depart = Boolean(stageRef.current?.depart);
    const goal = depart ? FLIGHT : 0;
    if (reduce) flight.current = goal;
    else {
      flight.current += (goal - flight.current) * (1 - Math.exp(-dt * 1.55));
      if (Math.abs(goal - flight.current) < 0.01) flight.current = goal;
    }
    if (!reduce) {
      const spinGoal = 0.28 * (1 - smoothstep(0, FLIGHT * 0.4, flight.current));
      spinRate.current += (spinGoal - spinRate.current) * (1 - Math.exp(-dt * 2.8));
      spin.current += dt * spinRate.current;
    }
    // Open the collapsed ring back into a sphere, carry that sphere to the corner, then ease homes into the woofer.
    const open = smoothstep(0, FLIGHT * 0.24, flight.current);
    const carry = smoothstep(0, FLIGHT * 0.58, flight.current);
    const form = smoothstep(FLIGHT * 0.62, FLIGHT, flight.current);
    const flightYaw = smoothstep(0, FLIGHT * 0.52, flight.current) * 1.15;
    if (carry > 0) {
      const landX = -halfW * 0.62;
      const landY = halfH * 0.56;
      orbX = orbX + (landX - orbX) * carry;
      orbY = orbY + (landY - orbY) * carry;
    }
    const shape = singularity * (1 - open);
    const body = RADIUS * (1 - shape) + 0.2 * shape;
    let beatEnv = 0;
    if (!reduce) {
      beat.current.age += dt;
      if (beat.current.age >= beat.current.wait) {
        beat.current.age -= beat.current.wait;
        beat.current.wait = 0.9 + Math.random() * 0.2;
      }
      beatEnv = heartbeat(beat.current.age);
    }
    const beatScale = 1 + beatEnv * (1 - shape) * HEART_SWELL;
    const time = reduce ? 0 : performance.now() / 1000;
    const angle = spin.current + (reduce ? 0 : flightYaw);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let conePush = 0;
    let launchGroup = 0;
    if (form > 0.72 && !reduce) {
      thump.current.age += dt;
      const span = 0.95;
      const t = thump.current.age / span;
      conePush = t > 0 && t < 1 ? Math.sin(Math.min(1, t) * Math.PI) : 0;
      if (thump.current.prev < 0.55 && conePush >= 0.55) {
        waveGroup.current = (waveGroup.current % WAVE_GROUPS) + 1;
        launchGroup = waveGroup.current;
        crests.current.unshift(0);
        if (crests.current.length > 6) crests.current.pop();
      }
      thump.current.prev = conePush;
      if (thump.current.age >= thump.current.wait) {
        thump.current.age = 0;
        thump.current.prev = 0;
        thump.current.wait = 3.4 + Math.random() * 1.15;
      }
    } else if (form < 0.4) {
      thump.current.prev = 0;
    }
    for (let c = 0; c < crests.current.length; c += 1) crests.current[c] += dt;
    if (crests.current.length > 0 && crests.current[crests.current.length - 1] > 9) crests.current.pop();

    if (!reduce && flight.current === 0) {
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

    const { positions, colors, home, phase, velocity, mode, escape, speakerHome, speakerKind, speakerWave } = field;
    for (let i = 0; i < COUNT; i += 1) {
      const o = i * 3;
      const sx = home[o] * cos + home[o + 2] * sin;
      const sy = home[o + 1];
      const sz = -home[o] * sin + home[o + 2] * cos;
      let hx = sx * (1 - form) + speakerHome[o] * form;
      let hy = sy * (1 - form) + speakerHome[o + 1] * form;
      let hz = sz * (1 - form) + speakerHome[o + 2] * form;
      if (form > 0.4 && speakerKind[i] !== FRAME && speakerKind[i] !== SCREW) {
        const amp = speakerKind[i] === CAP ? 0.22 : speakerKind[i] === CONE ? 0.16 : 0.05;
        hx += CONE_BASIS.fx * conePush * amp * form;
        hy += CONE_BASIS.fy * conePush * amp * form;
        hz += CONE_BASIS.fz * conePush * amp * form;
      }
      const orbit = phase[i] + time * (2.6 + (i % 5) * 0.18);
      const orbitR = 0.05 + (i % 13) * 0.011;

      if (launchGroup > 0 && speakerWave[i] === launchGroup) {
        const gone =
          Math.abs(positions[o]) > halfW * 1.2 ||
          Math.abs(positions[o + 1]) > halfH * 1.2 ||
          positions[o + 2] > 3.4 ||
          positions[o + 2] < -2.4;
        if (mode[i] === SHELL || (mode[i] === WAVE && gone)) {
        mode[i] = WAVE;
        const b = CONE_BASIS;
        const relX = positions[o] - orbX;
        const relY = positions[o + 1] - orbY;
        const relZ = positions[o + 2];
        const depth = relX * b.fx + relY * b.fy + relZ * b.fz;
        let sideX = relX - b.fx * depth;
        let sideY = relY - b.fy * depth;
        let sideZ = relZ - b.fz * depth;
        const sideLen = Math.hypot(sideX, sideY, sideZ) || 1;
        const ring = 0.48 * SPEAKER_SCALE + (hash(i + 4) - 0.5) * 0.16 * SPEAKER_SCALE;
        sideX = (sideX / sideLen) * ring;
        sideY = (sideY / sideLen) * ring;
        sideZ = (sideZ / sideLen) * ring;
        const mouth = 0.06 * SPEAKER_SCALE;
        positions[o] = orbX + sideX + b.fx * mouth;
        positions[o + 1] = orbY + sideY + b.fy * mouth;
        positions[o + 2] = sideZ + b.fz * mouth;
        const spread = 0.055;
        velocity[o] = b.fx * WAVE_SPEED + (sideX / ring) * spread;
        velocity[o + 1] = b.fy * WAVE_SPEED + (sideY / ring) * spread;
        velocity[o + 2] = b.fz * WAVE_SPEED + (sideZ / ring) * spread;
        }
      }

      if (mode[i] === WAVE) {
        const drag = 1 - dt * 0.025;
        velocity[o] *= drag;
        velocity[o + 1] *= drag;
        velocity[o + 2] *= drag;
        positions[o] += velocity[o] * dt;
        positions[o + 1] += velocity[o + 1] * dt;
        positions[o + 2] += velocity[o + 2] * dt;
        colors[o] = 0.95;
        colors[o + 1] = 0.95;
        colors[o + 2] = 0.95;
        continue;
      }

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
        } else if (follow > 0 && flight.current === 0 && gap < STRAY_REACH) {
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
        if (gap > 1.15 && form < 0.5) {
          velocity[o] += Math.sin(time * 0.65 + phase[i]) * dt * 0.03;
          velocity[o + 1] += Math.cos(time * 0.5 + phase[i]) * dt * 0.025;
        }
        if (form > 0.6) {
          const b = CONE_BASIS;
          const mouth = 0.02 * SPEAKER_SCALE;
          const mouthX = orbX + b.fx * mouth;
          const mouthY = orbY + b.fy * mouth;
          const mouthZ = b.fz * mouth;
          const relX = positions[o] - mouthX;
          const relY = positions[o + 1] - mouthY;
          const relZ = positions[o + 2] - mouthZ;
          const along = relX * b.fx + relY * b.fy + relZ * b.fz;
          const sideX = relX - b.fx * along;
          const sideY = relY - b.fy * along;
          const sideZ = relZ - b.fz * along;
          const radial = Math.hypot(sideX, sideY, sideZ);
          for (let c = 0; c < crests.current.length; c += 1) {
            const crestDist = crests.current[c] * WAVE_SPEED;
            const width = 0.48;
            const env = Math.exp(-(((along - crestDist) / width) ** 2));
            const beam = Math.exp(-radial / (0.75 + crestDist * 0.22));
            const push = env * beam * 1.35;
            const side = radial > 0.001 ? 0.16 / radial : 0;
            velocity[o] += (b.fx * 0.84 + sideX * side) * push * dt;
            velocity[o + 1] += (b.fy * 0.84 + sideY * side) * push * dt;
            velocity[o + 2] += (b.fz * 0.84 + sideZ * side) * push * dt;
          }
        }
        const drag = 1 - dt * (form > 0.5 ? 0.1 : 0.04);
        velocity[o] *= drag;
        velocity[o + 1] *= drag;
        velocity[o + 2] *= drag;
        positions[o] += velocity[o] * dt;
        positions[o + 1] += velocity[o + 1] * dt;
        positions[o + 2] += velocity[o + 2] * dt;
        if (form < 0.35) {
          if (Math.abs(positions[o]) > halfW * 0.96) velocity[o] *= -0.8;
          if (Math.abs(positions[o + 1]) > halfH * 0.96) velocity[o + 1] *= -0.8;
        }
        colors[o] = 1;
        colors[o + 1] = 1;
        colors[o + 2] = 1;
        continue;
      }

      const dx = hx - px;
      const dy = hy - py;
      const dist = Math.hypot(dx, dy);
      const front = smoothstep(-0.15, 0.55, hz / RADIUS);
      const influence = pointer.active && flight.current === 0 ? smoothstep(0.78, 0.02, dist) * front * (1 - follow) * (1 - shape) : 0;
      const push = influence * 0.62;
      const inv = dist > 0.0008 ? 1 / dist : 0;
      const looseX = hx + dx * inv * push;
      const looseY = hy + dy * inv * push;
      const looseZ = hz + influence * 0.22;
      const shellX = looseX * (1 - shape) + Math.cos(orbit) * orbitR * shape;
      const shellY = looseY * (1 - shape) + Math.sin(orbit) * orbitR * shape;
      const shellZ = looseZ * (1 - shape) + Math.sin(orbit * 2) * orbitR * 0.35 * shape;
      const targetX = orbX + shellX * beatScale;
      const targetY = orbY + shellY * beatScale;
      const targetZ = shellZ * beatScale;
      const lag = 1 - Math.exp(-dt * (3.1 + (i % 6) * 0.2));
      positions[o] += (targetX - positions[o]) * lag;
      positions[o + 1] += (targetY - positions[o + 1]) * lag;
      positions[o + 2] += (targetZ - positions[o + 2]) * lag;

      const rim = Math.pow(1 - Math.min(1, Math.abs(hz) / RADIUS), 0.6);
      const shade = Math.min(1, (shape > 0.2 ? 0.55 + shape * 0.45 : 0.22 + rim * 0.78) + beatEnv * (1 - shape) * 0.008);
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
