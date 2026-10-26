import * as THREE from 'three';
import { C } from './palette';
import { mat } from './materials';
import type { MatOpts } from './materials';

/**
 * Fondo de paisaje que rodea cada habitación: prado, colinas, montañas y
 * árboles. Se coloca fuera del diorama para que la escena no se vea
 * suspendida sobre un fondo plano.
 *
 * La composición se calcula en "coordenadas de pantalla" (eje X isométrico y
 * profundidad x+z) para asegurar que la cordillera y la línea de árboles
 * asomen por encima de las paredes de la sala.
 */

export type SceneryOpts = {
  grass?: number;
  grassLight?: number;
  grassDark?: number;
  hill?: number;
  mountain?: number;
  mountainFar?: number;
  snow?: number;
  seed?: number;
  /** Altura del remate superior de las paredes (para encajar la cordillera). */
  wallTop?: number;
};

const GROUND_Y = -0.805;

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Generador pseudoaleatorio determinista: cada sala conserva su paisaje. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Borde lejano del prado. En vista isométrica el horizonte queda horizontal
 * cuando la línea de corte cumple x+z = constante; por eso recortamos el
 * prado en diagonal y no con un z fijo.
 */
const EDGE_SUM = -15;

function edgeWave(x: number): number {
  return Math.sin(x * 0.29 + 0.8) * 0.34 + Math.sin(x * 0.11 + 2.1) * 0.5;
}

/** Coordenada z del borde lejano del prado para una x dada. */
function edgeZ(x: number): number {
  return EDGE_SUM - x + edgeWave(x);
}

/**
 * Convierte una posición de pantalla (X isométrico y suma x+z) a coordenadas
 * del mundo. Sirve para alinear montañas y árboles con la vista.
 */
function screenToGround(screenX: number, sum: number): [number, number] {
  const diff = screenX / Math.SQRT1_2;
  return [(sum + diff) / 2, (sum - diff) / 2];
}

function put<T extends THREE.Object3D>(obj: T, x: number, y: number, z: number, ry = 0): T {
  obj.position.set(x, y, z);
  obj.rotation.set(0, ry, 0);
  return obj;
}

function plain(geo: THREE.BufferGeometry, color: number, o?: MatOpts): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(color, o));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------ */
/* Suelo                                                               */
/* ------------------------------------------------------------------ */

function createMeadow(color: number): THREE.Mesh {
  const shape = new THREE.Shape();
  let first = true;
  for (let x = -38; x <= 38.01; x += 2) {
    // Recortamos la esquina lejana para que el prado no invada el cielo.
    const z = Math.max(-38, edgeZ(x));
    const px = x;
    const py = -z;
    if (first) {
      shape.moveTo(px, py);
      first = false;
    } else {
      shape.lineTo(px, py);
    }
  }
  // Cierre por el lado cercano (z = +38) para que el prado rodee la sala.
  shape.lineTo(38, -38);
  shape.lineTo(-38, -38);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(geo, mat(color, { rough: 1 }));
  ground.position.y = GROUND_Y;
  ground.castShadow = false;
  ground.receiveShadow = true;
  return ground;
}

/* ------------------------------------------------------------------ */
/* Vegetación                                                          */
/* ------------------------------------------------------------------ */

function makePine(scale: number, tone: number): THREE.Group {
  const g = new THREE.Group();

  const trunk = plain(new THREE.CylinderGeometry(0.055, 0.085, 0.42, 5), C.woodDark);
  put(trunk, 0, 0.21, 0);
  g.add(trunk);

  const tiers: [number, number, number][] = [
    [0.42, 0.72, 0.62],
    [0.33, 0.6, 0.93],
    [0.22, 0.48, 1.18],
  ];
  for (let i = 0; i < tiers.length; i += 1) {
    const [radius, height, y] = tiers[i];
    const cone = plain(new THREE.ConeGeometry(radius, height, 6), i === 1 ? C.leaf : tone);
    put(cone, 0, y, 0, i * 0.55);
    g.add(cone);
  }

  g.scale.setScalar(scale);
  return g;
}

function makeLeafy(scale: number, tone: number): THREE.Group {
  const g = new THREE.Group();

  const trunk = plain(new THREE.CylinderGeometry(0.07, 0.1, 0.62, 5), C.woodDark);
  put(trunk, 0, 0.31, 0);
  g.add(trunk);

  const crown = plain(new THREE.IcosahedronGeometry(0.44, 1), tone);
  put(crown, 0, 0.9, 0);
  crown.scale.set(1, 1.15, 1);
  g.add(crown);

  const sideA = plain(new THREE.IcosahedronGeometry(0.3, 0), C.leaf);
  put(sideA, -0.28, 0.74, 0.08);
  g.add(sideA);

  const sideB = plain(new THREE.IcosahedronGeometry(0.26, 0), C.olive);
  put(sideB, 0.3, 0.78, -0.07);
  g.add(sideB);

  g.scale.setScalar(scale);
  return g;
}

function makeBush(scale: number, tone: number): THREE.Group {
  const g = new THREE.Group();

  const main = plain(new THREE.IcosahedronGeometry(0.3, 0), tone);
  put(main, 0, 0.22, 0);
  main.scale.set(1, 0.85, 1);
  g.add(main);

  const sideA = plain(new THREE.IcosahedronGeometry(0.22, 0), C.leaf);
  put(sideA, 0.2, 0.18, 0.06);
  g.add(sideA);

  const sideB = plain(new THREE.IcosahedronGeometry(0.18, 0), C.olive);
  put(sideB, -0.18, 0.16, -0.04);
  g.add(sideB);

  g.scale.setScalar(scale);
  return g;
}

function makeFlower(scale: number, petal: number): THREE.Group {
  const g = new THREE.Group();
  const stem = plain(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 3), C.forest);
  put(stem, 0, 0.11, 0);
  g.add(stem);
  const head = plain(new THREE.IcosahedronGeometry(0.05, 0), petal);
  put(head, 0, 0.24, 0);
  g.add(head);
  g.scale.setScalar(scale);
  return g;
}

/* ------------------------------------------------------------------ */
/* Relieve                                                             */
/* ------------------------------------------------------------------ */

/**
 * Constantes de la proyección vertical de la cámara isométrica
 * (elevación 32°, azimut 45°). Permiten diseñar las cordilleras en
 * coordenadas de pantalla y colocarlas luego en el mundo.
 */
const SUM_V = -0.374694;
const Y_V = 0.848048;

/** Inversa de la proyección: (X pantalla, altura pantalla, x+z) → mundo. */
function screenToWorld(u: number, v: number, sum: number): [number, number, number] {
  const diff = u / Math.SQRT1_2;
  return [(sum + diff) / 2, 1.1 + (v - SUM_V * sum) / Y_V, (sum - diff) / 2];
}

type RidgePoint = { u: number; v: number };

/**
 * Cordillera lejana dibujada como una pared vertical en un plano
 * x+z = constante. Vista desde la cámara isométrica, la pared queda de
 * frente y su silueta se controla directamente en píxeles de pantalla.
 */
function mountainWall(
  rand: () => number,
  opts: {
    uMin: number;
    uMax: number;
    sum: number;
    base: number;
    maxTop: number;
    step: number;
    color: number;
    snow: number | null;
  },
): THREE.Group {
  const { uMin, uMax, sum, base, maxTop, step, color, snow } = opts;
  const span = maxTop - base;

  const pts: RidgePoint[] = [{ u: uMin, v: base + span * 0.1 }];
  const peaks: number[] = [];
  let u = uMin;
  while (u < uMax - step * 0.4) {
    const w = Math.min(step * (0.8 + rand() * 0.55), uMax - u);
    const valley = base + span * (0.1 + rand() * 0.16);
    const peak = base + span * (0.58 + rand() * 0.42);
    pts.push({ u: u + w * 0.5, v: valley });
    peaks.push(pts.length);
    pts.push({ u: u + w, v: Math.min(maxTop, peak) });
    u += w;
  }
  pts.push({ u: uMax, v: base + span * 0.1 });

  const wall: number[] = [];
  const pushWall = (p: RidgePoint) => {
    const [x, y, z] = screenToWorld(p.u, p.v, sum);
    wall.push(x, y, z);
  };
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    pushWall({ u: a.u, v: base });
    pushWall({ u: b.u, v: base });
    pushWall(b);
    pushWall({ u: a.u, v: base });
    pushWall(b);
    pushWall(a);
  }

  const group = new THREE.Group();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(wall, 3));
  geo.computeVertexNormals();
  const wallMesh = new THREE.Mesh(
    geo,
    mat(color, { emissive: color, emissiveIntensity: 0.26, rough: 1 }),
  );
  wallMesh.castShadow = false;
  wallMesh.receiveShadow = false;
  group.add(wallMesh);

  if (snow !== null) {
    // Gorros de nieve: triángulos pegados a la cara visible de la pared.
    const caps: number[] = [];
    const pushCap = (p: RidgePoint) => {
      const [x, y, z] = screenToWorld(p.u, p.v, sum);
      caps.push(x + 0.014, y, z + 0.014);
    };
    for (const k of peaks) {
      const peak = pts[k];
      const left = pts[k - 1];
      const right = pts[k + 1];
      if (!left || !right) continue;
      if (peak.v < base + span * 0.68 || rand() > 0.72) continue;
      const level = peak.v - (peak.v - base) * 0.24;
      const tL = (level - left.v) / (peak.v - left.v);
      const tR = (level - right.v) / (peak.v - right.v);
      if (tL <= 0 || tR <= 0) continue;
      pushCap(peak);
      pushCap({ u: left.u + (peak.u - left.u) * tL, v: level });
      pushCap({ u: right.u + (peak.u - right.u) * tR, v: level });
    }
    if (caps.length > 0) {
      const capGeo = new THREE.BufferGeometry();
      capGeo.setAttribute('position', new THREE.Float32BufferAttribute(caps, 3));
      capGeo.computeVertexNormals();
      const capMesh = new THREE.Mesh(
        capGeo,
        mat(snow, { emissive: snow, emissiveIntensity: 0.45, rough: 1 }),
      );
      capMesh.castShadow = false;
      capMesh.receiveShadow = false;
      group.add(capMesh);
    }
  }

  return group;
}

function addHill(
  parent: THREE.Object3D,
  x: number,
  z: number,
  radius: number,
  height: number,
  color: number,
  rot: number,
): void {
  const hill = plain(new THREE.IcosahedronGeometry(1, 1), color, {
    emissive: color,
    emissiveIntensity: 0.12,
    rough: 1,
  });
  put(hill, x, GROUND_Y, z, rot);
  hill.scale.set(radius, height, radius * 0.85);
  hill.castShadow = false;
  hill.receiveShadow = false;
  parent.add(hill);
}

/* ------------------------------------------------------------------ */
/* Paisaje completo                                                    */
/* ------------------------------------------------------------------ */

export function scenery(w: number, d: number, o: SceneryOpts = {}): THREE.Group {
  const g = new THREE.Group();
  const rand = rng(o.seed ?? Math.round(w * 131 + d * 17 + 7));

  const grass = o.grass ?? C.meadow;
  const grassLight = o.grassLight ?? C.meadowLight;
  const grassDark = o.grassDark ?? C.meadowDark;
  const hillColor = o.hill ?? C.hill;
  const mountainColor = o.mountain ?? C.mountain;
  const mountainFarColor = o.mountainFar ?? C.mountainFar;
  const snow = o.snow ?? C.snow;

  const sway: { obj: THREE.Object3D; phase: number; amp: number }[] = [];

  g.add(createMeadow(grass));

  /* Manchas de pasto: rompen la uniformidad del prado. */
  for (let i = 0; i < 26; i += 1) {
    const x = -19 + rand() * 38;
    const z = -11.4 + rand() * 24;
    if (Math.abs(x) < w / 2 + 1 && Math.abs(z) < d / 2 + 1) continue;
    if (x + z < EDGE_SUM + 1.6) continue;

    const radius = 1.4 + rand() * 3.4;
    const geo = new THREE.CircleGeometry(radius, 7);
    geo.rotateX(-Math.PI / 2);
    const patch = new THREE.Mesh(geo, mat(rand() > 0.5 ? grassLight : grassDark, { rough: 1 }));
    patch.position.set(x, GROUND_Y + 0.004 + i * 0.0004, z);
    patch.rotation.y = rand() * Math.PI * 2;
    patch.scale.set(1, 1, 0.55 + rand() * 0.6);
    patch.castShadow = false;
    patch.receiveShadow = true;
    g.add(patch);
  }

  /*
   * Altura de la esquina lejana del remate de las paredes. Las cordilleras
   * se colocan por encima de esa referencia para que asomen sin invadir el
   * cielo: la pared de la sala queda integrada en el paisaje.
   */
  const roomPeakV = 0.3747 * ((w + d) / 2 + 0.78) + 0.848 * ((o.wallTop ?? 3.285) - 1.1);

  /* Cordillera lejana: silueta pálida, casi sin detalle. */
  g.add(
    mountainWall(rand, {
      uMin: -28,
      uMax: 28,
      sum: -18.6,
      base: 3.0,
      maxTop: roomPeakV + 0.62,
      step: 2.75,
      color: mountainFarColor,
      snow,
    }),
  );

  /* Cordillera cercana: un tono más oscura y con algunas cumbres nevadas. */
  g.add(
    mountainWall(rand, {
      uMin: -28,
      uMax: 28,
      sum: -17.0,
      base: 3.1,
      maxTop: roomPeakV + 0.22,
      step: 2.25,
      color: mountainColor,
      snow,
    }),
  );

  /* Colinas redondeadas que tapan el borde del prado. */
  for (let i = 0; i < 9; i += 1) {
    const screenX = -10.6 + i * 2.6 + (rand() - 0.5) * 0.9;
    const sum = -15.2 - rand() * 0.5;
    const [x, z] = screenToGround(screenX, sum);
    addHill(g, x, z, 1.2 + rand() * 0.7, 0.7 + rand() * 0.35, hillColor, rand() * Math.PI * 2);
  }

  /* Línea de árboles sobre el horizonte. */
  const horizonTrees = 16;
  for (let i = 0; i < horizonTrees; i += 1) {
    const screenX = -10.4 + (i / (horizonTrees - 1)) * 20.8 + (rand() - 0.5) * 0.8;
    const sum = -14.4 - rand() * 0.6;
    const [x, z] = screenToGround(screenX, sum);
    const scale = 0.8 + rand() * 0.5;
    const tree =
      rand() > 0.42
        ? makePine(scale, rand() > 0.5 ? C.forest : C.grassDeep)
        : makeLeafy(scale * 0.9, rand() > 0.5 ? C.olive : C.leaf);
    put(tree, x, GROUND_Y, z, rand() * Math.PI * 2);
    g.add(tree);
    sway.push({ obj: tree, phase: rand() * Math.PI * 2, amp: 0.012 + rand() * 0.014 });
  }

  /* Árboles más cercanos que asoman por encima de las paredes. */
  const midTrees: [number, number][] = [
    [-9.4, -6.4],
    [-8.3, -8.8],
    [8.5, -7.5],
    [9.3, -6],
    [-9.6, -4.2],
    [9.6, -4.6],
  ];
  for (let i = 0; i < midTrees.length; i += 1) {
    const [screenX, sum] = midTrees[i];
    const [x, z] = screenToGround(screenX, sum);
    const scale = 1.65 + rand() * 0.5;
    const tree = i % 2 === 0 ? makePine(scale, C.forest) : makeLeafy(scale * 0.85, C.olive);
    put(tree, x, GROUND_Y, z, rand() * Math.PI * 2);
    g.add(tree);
    sway.push({ obj: tree, phase: rand() * Math.PI * 2, amp: 0.01 + rand() * 0.012 });
  }

  /* Arbustos y flores en los márgenes visibles. */
  for (let i = 0; i < 14; i += 1) {
    const side = rand() > 0.48 ? -1 : 1;
    const screenX = side * (8 + rand() * 2);
    const sum = -2.5 + rand() * 4;
    const [x, z] = screenToGround(screenX, sum);
    if (Math.abs(x) < w / 2 + 0.8 && Math.abs(z) < d / 2 + 0.8) continue;

    const bush = makeBush(0.55 + rand() * 0.7, rand() > 0.5 ? C.leaf : C.olive);
    put(bush, x, GROUND_Y, z, rand() * Math.PI * 2);
    g.add(bush);
  }

  const petals = [C.sun, C.coral, C.white, C.purple];
  for (let i = 0; i < 18; i += 1) {
    const side = rand() > 0.5 ? -1 : 1;
    const screenX = side * (8.2 + rand() * 1.6);
    const sum = -3 + rand() * 4;
    const [x, z] = screenToGround(screenX, sum);
    if (Math.abs(x) < w / 2 + 0.6 && Math.abs(z) < d / 2 + 0.6) continue;

    const flower = makeFlower(0.8 + rand() * 0.6, petals[Math.floor(rand() * petals.length)]);
    put(flower, x, GROUND_Y, z, rand() * Math.PI * 2);
    g.add(flower);
  }

  /* Márgenes cercanos: arbustos y flores en las esquinas del encuadre. */
  for (let i = 0; i < 16; i += 1) {
    const side = rand() > 0.5 ? -1 : 1;
    const screenX = side * (8.4 + rand() * 2.6);
    const sum = 2 + rand() * 6;
    const [x, z] = screenToGround(screenX, sum);
    if (Math.abs(x) < w / 2 + 0.8 && Math.abs(z) < d / 2 + 0.8) continue;

    if (rand() > 0.42) {
      const bush = makeBush(0.5 + rand() * 0.65, rand() > 0.5 ? C.leaf : C.olive);
      put(bush, x, GROUND_Y, z, rand() * Math.PI * 2);
      g.add(bush);
    } else {
      const flower = makeFlower(0.75 + rand() * 0.7, petals[Math.floor(rand() * petals.length)]);
      put(flower, x, GROUND_Y, z, rand() * Math.PI * 2);
      g.add(flower);
    }
  }

  /* Brisa suave en los árboles. */
  g.userData.tick = (_dt: number, t: number) => {
    for (const item of sway) {
      item.obj.rotation.z = Math.sin(t * 0.6 + item.phase) * item.amp;
    }
  };

  return g;
}
