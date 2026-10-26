import * as THREE from 'three';
import { C } from './palette';
import { mat, matUnique } from './materials';
import type { MatOpts } from './materials';
import { scenery } from './scenery';
import type { SceneryOpts } from './scenery';

/** Un dispositivo es un grupo 3D que puede apagarse o corregirse. */
export type Device = {
  group: THREE.Group;
  /** true = estado con problema / encendido; false = corregido. */
  set: (active: boolean) => void;
  /** Animación continua (solo se llama si el dispositivo está en escena). */
  tick?: (dt: number, t: number) => void;
};

export const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/* Primitivas                                                          */
/* ------------------------------------------------------------------ */

export function mesh(geo: THREE.BufferGeometry, color: number, o?: MatOpts): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(color, o));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export const bx = (w: number, h: number, d: number, color: number, o?: MatOpts) =>
  mesh(new THREE.BoxGeometry(w, h, d), color, o);

export const cl = (rt: number, rb: number, h: number, seg: number, color: number, o?: MatOpts) =>
  mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color, o);

export const sp = (r: number, color: number, o?: MatOpts) =>
  mesh(new THREE.IcosahedronGeometry(r, 0), color, o);

/** Coloca posición y rotación en una sola llamada. */
export function at<T extends THREE.Object3D>(
  obj: T,
  x = 0,
  y = 0,
  z = 0,
  ry = 0,
  rx = 0,
  rz = 0,
): T {
  obj.position.set(x, y, z);
  obj.rotation.set(rx, ry, rz);
  return obj;
}

/** Tubo suave a partir de una lista de puntos (cables, mangueras, grifos). */
export function tube(points: [number, number, number][], radius: number, color: number): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, Math.max(10, points.length * 6), radius, 5, false);
  return mesh(geo, color);
}

export function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

/* ------------------------------------------------------------------ */
/* Efectos: motas de energía / frío / calor                            */
/* ------------------------------------------------------------------ */

export type Motes = {
  group: THREE.Group;
  tick: (dt: number, t: number) => void;
};

export function motes(
  count: number,
  color: number,
  opts: { spread?: number; depth?: number; speed?: number; rise?: boolean; size?: number } = {},
): Motes {
  const g = new THREE.Group();
  const spread = opts.spread ?? 0.45;
  const depth = opts.depth ?? 0.28;
  const speed = opts.speed ?? 0.45;
  const rise = opts.rise ?? true;
  const base = opts.size ?? 0.05;

  const items: { m: THREE.Mesh; phase: number; drift: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const material = matUnique(color, {
      emissive: color,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85,
      flat: true,
    });
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(base * (0.7 + Math.random() * 0.6), 0), material);
    m.castShadow = false;
    m.receiveShadow = false;
    m.position.set((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * depth);
    g.add(m);
    items.push({ m, phase: Math.random(), drift: (Math.random() - 0.5) * 0.4 });
  }

  let t0 = 0;
  return {
    group: g,
    tick: (dt) => {
      t0 += dt;
      for (const it of items) {
        it.phase = (it.phase + dt * speed) % 1;
        const p = it.phase;
        it.m.position.y = rise ? p * 1.05 : -p * 1.05;
        it.m.position.x += Math.sin(t0 * 2.2 + it.drift * 6) * 0.0035;
        it.m.scale.setScalar(0.25 + Math.sin(p * Math.PI) * 0.85);
      }
    },
  };
}

/** Halo suave (sprite) para lámparas y aparatos encendidos. */
export function halo(color: number, size: number, opacity = 0.35): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const hex = `#${color.toString(16).padStart(6, '0')}`;
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, hex);
    grad.addColorStop(0.45, `${hex}88`);
    grad.addColorStop(1, `${hex}00`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: tex,
    color: 0xffffff,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(material);
  s.scale.setScalar(size);
  return s;
}

/** Une varios ticks en uno solo (dispositivos compuestos). */
export function mergeTicks(
  ...fns: (undefined | ((dt: number, t: number) => void))[]
): ((dt: number, t: number) => void) | undefined {
  const list = fns.filter((f): f is (dt: number, t: number) => void => typeof f === 'function');
  if (list.length === 0) return undefined;
  return (dt, t) => {
    for (const f of list) f(dt, t);
  };
}

/** Ventanal fijo con cielo luminoso (para simular luz de día). */
export function bigWindow(w = 2.4, h = 1.5): THREE.Group {
  const g = new THREE.Group();

  const top = bx(w, 0.12, 0.14, C.cream);
  at(top, 0, h / 2, 0);
  g.add(top);
  const bottom = bx(w + 0.12, 0.16, 0.22, C.cream);
  at(bottom, 0, -h / 2, 0.04);
  g.add(bottom);
  const sideL = bx(0.12, h, 0.14, C.cream);
  at(sideL, -w / 2, 0, 0);
  g.add(sideL);
  const sideR = sideL.clone();
  at(sideR, w / 2, 0, 0);
  g.add(sideR);

  const skyMat = matUnique(0xbfe4f2, { emissive: 0xbfe4f2, emissiveIntensity: 0.75, rough: 1 });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, h - 0.08), skyMat);
  sky.castShadow = false;
  g.add(sky);

  const mullionV = bx(0.06, h - 0.08, 0.06, C.cream);
  g.add(mullionV);
  const mullionH = bx(w - 0.08, 0.06, 0.06, C.cream);
  g.add(mullionH);

  const cloudA = sp(0.2, C.white);
  at(cloudA, -w * 0.22, h * 0.18, 0.03);
  cloudA.castShadow = false;
  g.add(cloudA);
  const cloudB = sp(0.14, C.white);
  at(cloudB, w * 0.2, -h * 0.12, 0.03);
  cloudB.castShadow = false;
  g.add(cloudB);
  const hill = mesh(new THREE.ConeGeometry(0.55, 0.4, 4), C.olive);
  at(hill, -w * 0.25, -h / 2 + 0.18, 0.02);
  hill.castShadow = false;
  g.add(hill);

  return g;
}

/** Gabinete bajo con puertas. */
export function sideboard(w = 1.6, h = 0.8, d = 0.45, color: number = C.wood): THREE.Group {
  const g = new THREE.Group();
  const body = bx(w, h, d, color);
  at(body, 0, h / 2, 0);
  g.add(body);
  const top = bx(w + 0.06, 0.06, d + 0.06, C.creamDark);
  at(top, 0, h + 0.02, 0);
  g.add(top);
  for (let i = 0; i < 2; i += 1) {
    const door = bx(w / 2 - 0.08, h - 0.16, 0.03, C.woodDark);
    at(door, -w / 4 + i * (w / 2), h / 2, d / 2 + 0.01);
    g.add(door);
    const knob = sp(0.03, C.sun);
    at(knob, -w / 4 + i * (w / 2) + (i === 0 ? 0.1 : -0.1), h / 2, d / 2 + 0.05);
    g.add(knob);
  }
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) {
    const leg = cl(0.04, 0.035, 0.12, 5, C.woodDark);
    at(leg, x, 0.06, 0);
    g.add(leg);
  }
  return g;
}

/* ------------------------------------------------------------------ */
/* Ambiente: base, suelo y paredes                                     */
/* ------------------------------------------------------------------ */

export type RoomOpts = {
  floor?: number;
  side?: number;
  wall?: number;
  trim?: number;
  wallHeight?: number;
  /** Paisaje exterior alrededor de la sala. `false` lo desactiva. */
  scenery?: false | SceneryOpts;
};

export function roomBase(w: number, d: number, opts: RoomOpts = {}): THREE.Group {
  const floorColor = opts.floor ?? C.sand;
  const sideColor = opts.side ?? C.woodDark;
  const wallColor = opts.wall ?? C.cream;
  const trimColor = opts.trim ?? C.wood;
  const wallH = opts.wallHeight ?? 3.2;
  const g = new THREE.Group();

  const side = mat(sideColor);
  const top = mat(floorColor);
  const baseGeo = new THREE.BoxGeometry(w + 1.0, 0.8, d + 1.0);
  const baseMats = [side, side, top, side, side, side];
  const base = new THREE.Mesh(baseGeo, baseMats);
  base.position.y = -0.4;
  base.receiveShadow = true;
  base.castShadow = true;
  g.add(base);

  // Pared trasera (z negativa) y pared izquierda (x negativa).
  const back = bx(w + 1.0, wallH, 0.22, wallColor);
  at(back, 0, wallH / 2, -d / 2 - 0.11);
  g.add(back);

  const left = bx(0.22, wallH, d + 1.0, wallColor);
  at(left, -w / 2 - 0.11, wallH / 2, 0);
  g.add(left);

  // Zócalos
  const skirtBack = bx(w + 1.0, 0.16, 0.06, trimColor);
  at(skirtBack, 0, 0.08, -d / 2 + 0.02);
  g.add(skirtBack);

  const skirtLeft = bx(0.06, 0.16, d + 1.0, trimColor);
  at(skirtLeft, -w / 2 + 0.02, 0.08, 0);
  g.add(skirtLeft);

  // Remate superior de las paredes
  const capBack = bx(w + 1.0, 0.09, 0.34, trimColor);
  at(capBack, 0, wallH + 0.04, -d / 2 - 0.11);
  g.add(capBack);

  const capLeft = bx(0.34, 0.09, d + 1.0, trimColor);
  at(capLeft, -w / 2 - 0.11, wallH + 0.04, 0);
  g.add(capLeft);

  // Paisaje exterior: prado, montañas y árboles alrededor del diorama.
  if (opts.scenery !== false) {
    const landscape = scenery(w, d, {
      ...opts.scenery,
      wallTop: opts.scenery?.wallTop ?? wallH + 0.085,
    });
    g.add(landscape);
    g.userData.tick = landscape.userData.tick;
  }

  return g;
}

/* ------------------------------------------------------------------ */
/* Decoración                                                          */
/* ------------------------------------------------------------------ */

export function rug(w: number, d: number, color: number = C.terracotta): THREE.Group {
  const g = new THREE.Group();
  const base = bx(w, 0.03, d, color);
  at(base, 0, 0.015, 0);
  base.castShadow = false;
  g.add(base);
  const inner = bx(w * 0.84, 0.035, d * 0.78, C.cream);
  at(inner, 0, 0.018, 0);
  inner.castShadow = false;
  g.add(inner);
  return g;
}

export function plant(scale = 1, tone: number = C.leaf): Device {
  const g = new THREE.Group();
  const pot = cl(0.26, 0.2, 0.4, 8, C.terracotta);
  at(pot, 0, 0.2, 0);
  g.add(pot);
  const rim = cl(0.28, 0.28, 0.07, 8, C.terracotta);
  at(rim, 0, 0.4, 0);
  g.add(rim);
  const soil = cl(0.25, 0.25, 0.04, 8, C.woodDark);
  at(soil, 0, 0.43, 0);
  g.add(soil);

  const bush = sp(0.32, tone);
  at(bush, 0, 0.78, 0);
  bush.scale.set(1, 1.15, 1);
  g.add(bush);
  const b2 = sp(0.22, C.olive);
  at(b2, 0.2, 0.62, 0.12);
  g.add(b2);
  const b3 = sp(0.19, C.forest);
  at(b3, -0.18, 0.7, -0.1);
  g.add(b3);

  g.scale.setScalar(scale);
  const seed = Math.random() * 10;
  return {
    group: g,
    set: () => undefined,
    tick: (_dt, t) => {
      const s = Math.sin(t * 0.9 + seed) * 0.035;
      bush.rotation.z = s;
      b2.rotation.z = s * 1.4;
      b3.rotation.z = -s;
    },
  };
}

export function sofa(color: number = C.olive): THREE.Group {
  const g = new THREE.Group();
  const base = bx(2.2, 0.38, 0.95, color);
  at(base, 0, 0.3, 0);
  g.add(base);
  const back = bx(2.2, 0.6, 0.22, color);
  at(back, 0, 0.72, -0.37);
  g.add(back);
  const armL = bx(0.22, 0.46, 0.95, color);
  at(armL, -0.99, 0.56, 0);
  g.add(armL);
  const armR = armL.clone();
  at(armR, 0.99, 0.56, 0);
  g.add(armR);

  for (let i = 0; i < 2; i += 1) {
    const cushion = bx(0.92, 0.16, 0.8, C.cream);
    at(cushion, -0.5 + i * 1.0, 0.56, 0.02);
    g.add(cushion);
  }
  const pillow = bx(0.42, 0.42, 0.14, C.sun);
  at(pillow, -0.7, 0.86, -0.22, 0.2);
  g.add(pillow);

  for (const [x, z] of [
    [-0.9, -0.36],
    [0.9, -0.36],
    [-0.9, 0.36],
    [0.9, 0.36],
  ]) {
    const leg = cl(0.05, 0.05, 0.16, 6, C.woodDark);
    at(leg, x, 0.08, z);
    g.add(leg);
  }
  return g;
}

export function tableTop(w: number, d: number, h: number, color: number = C.wood): THREE.Group {
  const g = new THREE.Group();
  const top = bx(w, 0.09, d, color);
  at(top, 0, h, 0);
  g.add(top);
  const inset = bx(w - 0.16, 0.05, d - 0.16, C.creamDark);
  at(inset, 0, h - 0.06, 0);
  g.add(inset);
  const legPos: [number, number][] = [
    [-w / 2 + 0.12, -d / 2 + 0.12],
    [w / 2 - 0.12, -d / 2 + 0.12],
    [-w / 2 + 0.12, d / 2 - 0.12],
    [w / 2 - 0.12, d / 2 - 0.12],
  ];
  for (const [x, z] of legPos) {
    const leg = cl(0.05, 0.04, h, 6, C.woodDark);
    at(leg, x, h / 2, z);
    g.add(leg);
  }
  return g;
}

export function roundTable(r: number, h: number, color: number = C.wood): THREE.Group {
  const g = new THREE.Group();
  const top = cl(r, r, 0.08, 12, color);
  at(top, 0, h, 0);
  g.add(top);
  const stem = cl(0.06, 0.06, h, 6, C.woodDark);
  at(stem, 0, h / 2, 0);
  g.add(stem);
  const foot = cl(0.26, 0.3, 0.06, 10, C.woodDark);
  at(foot, 0, 0.03, 0);
  g.add(foot);
  return g;
}

export function chair(color: number = C.terracotta): THREE.Group {
  const g = new THREE.Group();
  const seat = bx(0.44, 0.07, 0.44, color);
  at(seat, 0, 0.45, 0);
  g.add(seat);
  const back = bx(0.44, 0.46, 0.07, color);
  at(back, 0, 0.7, -0.19);
  g.add(back);
  for (const [x, z] of [
    [-0.17, -0.17],
    [0.17, -0.17],
    [-0.17, 0.17],
    [0.17, 0.17],
  ]) {
    const leg = cl(0.035, 0.035, 0.45, 5, C.woodDark);
    at(leg, x, 0.22, z);
    g.add(leg);
  }
  return g;
}

export function stool(color: number = C.terracotta): THREE.Group {
  const g = new THREE.Group();
  const seat = cl(0.22, 0.22, 0.08, 10, color);
  at(seat, 0, 0.72, 0);
  g.add(seat);
  const stem = cl(0.04, 0.04, 0.7, 6, C.woodDark);
  at(stem, 0, 0.36, 0);
  g.add(stem);
  const foot = cl(0.2, 0.22, 0.05, 10, C.woodDark);
  at(foot, 0, 0.03, 0);
  g.add(foot);
  return g;
}

export function crate(size = 0.6, color: number = C.wood): THREE.Group {
  const g = new THREE.Group();
  const body = bx(size, size * 0.8, size, color);
  at(body, 0, size * 0.4, 0);
  g.add(body);
  for (const dir of [-1, 1]) {
    const plank = bx(size * 1.02, 0.07, size * 1.02, C.woodDark);
    at(plank, 0, size * 0.4 + dir * size * 0.22, 0);
    g.add(plank);
  }
  return g;
}

export function wallFrame(w: number, h: number, art: number = C.sky): THREE.Group {
  const g = new THREE.Group();
  const frame = bx(w, h, 0.08, C.woodDark);
  g.add(frame);
  const canvas = bx(w - 0.12, h - 0.12, 0.1, art);
  at(canvas, 0, 0, 0.01);
  g.add(canvas);
  const sun = cl(0.09, 0.09, 0.11, 8, C.sun);
  at(sun, -w * 0.18, h * 0.18, 0.02, 0, Math.PI / 2);
  g.add(sun);
  return g;
}

export function shelfUnit(w: number, h: number, d: number, color: number = C.wood): THREE.Group {
  const g = new THREE.Group();
  const sideL = bx(0.08, h, d, color);
  at(sideL, -w / 2 + 0.04, h / 2, 0);
  g.add(sideL);
  const sideR = sideL.clone();
  at(sideR, w / 2 - 0.04, h / 2, 0);
  g.add(sideR);
  const rows = Math.max(2, Math.round(h / 0.5));
  for (let i = 0; i <= rows; i += 1) {
    const shelf = bx(w, 0.06, d, color);
    at(shelf, 0, (h / rows) * i, 0);
    g.add(shelf);
  }
  const back = bx(w, h, 0.04, C.woodDark);
  at(back, 0, h / 2, -d / 2 + 0.03);
  g.add(back);
  return g;
}

export function counterRun(w: number, d: number, h: number, color: number = C.forest): THREE.Group {
  const g = new THREE.Group();
  const body = bx(w, h - 0.06, d, color);
  at(body, 0, (h - 0.06) / 2, 0);
  g.add(body);
  const top = bx(w + 0.08, 0.08, d + 0.08, C.cream);
  at(top, 0, h - 0.02, 0);
  g.add(top);

  const doors = Math.max(1, Math.round(w / 0.9));
  for (let i = 0; i < doors; i += 1) {
    const dw = (w / doors) * 0.82;
    const door = bx(dw, h * 0.62, 0.05, C.forest);
    at(door, -w / 2 + (w / doors) * (i + 0.5), h * 0.42, d / 2 + 0.01);
    g.add(door);
    const handle = bx(dw * 0.16, 0.05, 0.05, C.sun);
    at(handle, -w / 2 + (w / doors) * (i + 0.5) + dw * 0.32, h * 0.6, d / 2 + 0.05);
    g.add(handle);
  }
  return g;
}

export function cardboardBox(size = 0.5): THREE.Group {
  const g = new THREE.Group();
  const body = bx(size, size * 0.85, size, C.sand);
  at(body, 0, size * 0.42, 0);
  g.add(body);
  const tape = bx(size * 1.01, 0.04, size * 0.2, C.cream);
  at(tape, 0, size * 0.85, 0);
  g.add(tape);
  return g;
}

export function deskLamp(colored: number = C.sun): Device {
  const g = new THREE.Group();
  const base = cl(0.16, 0.18, 0.05, 8, C.woodDark);
  at(base, 0, 0.025, 0);
  g.add(base);
  const stem = cl(0.028, 0.028, 0.42, 6, C.woodDark);
  at(stem, 0, 0.24, 0);
  g.add(stem);

  const shadeMat = matUnique(C.cream, {
    emissive: colored,
    emissiveIntensity: 0,
    side: THREE.DoubleSide,
    rough: 0.8,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.22, 8, 1, true), shadeMat);
  at(shade, 0.06, 0.56, 0, 0, 0, -0.25);
  g.add(shade);

  const bulb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.06, 0),
    matUnique(colored, { emissive: colored, emissiveIntensity: 0 }),
  );
  at(bulb, 0.07, 0.49, 0);
  g.add(bulb);

  const light = new THREE.PointLight(colored, 0, 2.6, 2);
  at(light, 0.08, 0.44, 0);
  g.add(light);

  const set = (on: boolean) => {
    shadeMat.emissiveIntensity = on ? 0.9 : 0;
    (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 1.4 : 0;
    light.intensity = on ? 3.2 : 0;
  };
  set(true);
  return { group: g, set };
}
