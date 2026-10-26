import * as THREE from 'three';
import { C } from './palette';
import { matUnique } from './materials';
import { at, bx, cl, halo, mergeTicks, motes, sp, tube } from './props';
import type { Device } from './props';

/* ------------------------------------------------------------------ */
/* Lámpara de pie                                                      */
/* ------------------------------------------------------------------ */

export function floorLamp(): Device {
  const g = new THREE.Group();

  const base = cl(0.24, 0.28, 0.07, 10, C.woodDark);
  at(base, 0, 0.035, 0);
  g.add(base);

  const pole = cl(0.035, 0.035, 1.62, 6, C.woodDark);
  at(pole, 0, 0.85, 0);
  g.add(pole);

  const shadeMat = matUnique(C.sun, {
    emissive: C.sun,
    emissiveIntensity: 0,
    side: THREE.DoubleSide,
    rough: 0.7,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.42, 8, 1, true), shadeMat);
  at(shade, 0, 1.82, 0);
  shade.castShadow = true;
  g.add(shade);

  const bulbMat = matUnique(C.cream, { emissive: C.sun, emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), bulbMat);
  at(bulb, 0, 1.72, 0);
  g.add(bulb);

  const glow = halo(C.sun, 1.05, 0);
  at(glow, 0, 1.8, 0);
  g.add(glow);

  const light = new THREE.PointLight(C.sun, 0, 3.6, 2);
  at(light, 0, 1.75, 0);
  g.add(light);

  const poolMat = new THREE.MeshBasicMaterial({
    color: C.sun,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.05, 20), poolMat);
  at(pool, 0, 0.02, 0, 0, -Math.PI / 2);
  pool.receiveShadow = false;
  pool.castShadow = false;
  g.add(pool);

  const set = (on: boolean) => {
    shadeMat.emissiveIntensity = on ? 0.85 : 0;
    bulbMat.emissiveIntensity = on ? 1.8 : 0;
    light.intensity = on ? 1.6 : 0;
    (glow.material as THREE.SpriteMaterial).opacity = on ? 0.22 : 0;
    poolMat.opacity = on ? 0.13 : 0;
  };
  set(true);

  return { group: g, set };
}

/* ------------------------------------------------------------------ */
/* Televisor en modo dormido                                           */
/* ------------------------------------------------------------------ */

export function tvUnit(): Device {
  const g = new THREE.Group();

  const consoleBox = bx(2.0, 0.5, 0.44, C.wood);
  at(consoleBox, 0, 0.25, 0);
  g.add(consoleBox);
  for (let i = 0; i < 2; i += 1) {
    const drawer = bx(0.86, 0.2, 0.03, C.woodDark);
    at(drawer, -0.46 + i * 0.92, 0.3, 0.23);
    g.add(drawer);
    const knob = cl(0.035, 0.035, 0.04, 6, C.sun);
    at(knob, -0.46 + i * 0.92, 0.3, 0.26, 0, Math.PI / 2);
    g.add(knob);
  }

  const frame = bx(1.62, 0.98, 0.1, C.ink);
  at(frame, 0, 1.78, 0);
  g.add(frame);

  const screenMat = matUnique(0x2a3038, { emissive: 0x101418, emissiveIntensity: 1 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.84), screenMat);
  at(screen, 0, 1.78, 0.055);
  screen.castShadow = false;
  g.add(screen);

  const ledMat = matUnique(0x551111, { emissive: C.coral, emissiveIntensity: 0 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), ledMat);
  at(led, 0.66, 1.34, 0.06);
  led.castShadow = false;
  g.add(led);

  const ledGlow = halo(C.coral, 0.4, 0);
  at(ledGlow, 0.66, 1.34, 0.09);
  g.add(ledGlow);

  let on = true;
  let t0 = 0;
  const set = (active: boolean) => {
    on = active;
    ledMat.emissiveIntensity = active ? 1.6 : 0;
    screenMat.emissiveIntensity = active ? 0.7 : 1.6;
    (ledGlow.material as THREE.SpriteMaterial).opacity = active ? 0.4 : 0;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt) => {
      t0 += dt;
      if (!on) return;
      (ledGlow.material as THREE.SpriteMaterial).opacity = 0.25 + Math.sin(t0 * 3) * 0.16;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Enchufe con cargador conectado sin celular                          */
/* ------------------------------------------------------------------ */

export function wallCharger(): Device {
  const g = new THREE.Group();

  const strip = bx(0.42, 0.06, 0.16, C.offwhite);
  at(strip, 0.28, 0.03, 0.1);
  g.add(strip);
  const stripLed = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.015, 0),
    matUnique(C.coral, { emissive: C.coral, emissiveIntensity: 1.4 }),
  );
  at(stripLed, 0.44, 0.065, 0.1);
  stripLed.castShadow = false;
  g.add(stripLed);

  const plate = bx(0.16, 0.16, 0.03, C.offwhite);
  at(plate, 0, 1.12, 0);
  g.add(plate);

  const live = new THREE.Group();

  const cube = bx(0.11, 0.11, 0.11, C.white);
  at(cube, 0, 1.12, 0.07);
  live.add(cube);

  const cubeLedMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.3 });
  const cubeLed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.014, 0), cubeLedMat);
  at(cubeLed, 0.03, 1.08, 0.13);
  cubeLed.castShadow = false;
  live.add(cubeLed);

  const cable = tube(
    [
      [0, 1.06, 0.08],
      [0.06, 0.86, 0.16],
      [0.16, 0.5, 0.24],
      [0.26, 0.16, 0.16],
      [0.3, 0.03, 0.04],
    ],
    0.018,
    C.ink,
  );
  live.add(cable);

  const looseCable = tube(
    [
      [0.3, 0.03, 0.04],
      [0.42, 0.02, 0.02],
      [0.5, 0.02, 0.14],
      [0.58, 0.02, 0.24],
    ],
    0.016,
    C.ink,
  );
  live.add(looseCable);

  const plug = bx(0.08, 0.05, 0.15, C.offwhite);
  at(plug, 0.6, 0.03, 0.28);
  live.add(plug);
  const prongL = cl(0.008, 0.008, 0.06, 4, C.metal);
  at(prongL, 0.58, 0.03, 0.36, 0, Math.PI / 2);
  live.add(prongL);
  const prongR = prongL.clone();
  at(prongR, 0.63, 0.03, 0.36, 0, Math.PI / 2);
  live.add(prongR);

  g.add(live);

  const set = (on: boolean) => {
    live.visible = on;
  };
  set(true);

  return { group: g, set };
}

/* ------------------------------------------------------------------ */
/* Refrigerador con la puerta abierta                                  */
/* ------------------------------------------------------------------ */

export function fridgeUnit(): Device {
  const g = new THREE.Group();

  const body = bx(0.98, 1.86, 0.74, C.white);
  at(body, 0, 0.95, 0);
  g.add(body);

  const seam = bx(0.99, 0.03, 0.75, C.offwhite);
  at(seam, 0, 1.28, 0);
  g.add(seam);

  const inner = bx(0.84, 1.7, 0.04, 0xd8e6ee);
  at(inner, 0, 0.98, -0.33);
  g.add(inner);

  for (let i = 0; i < 3; i += 1) {
    const shelf = bx(0.8, 0.03, 0.56, C.glass);
    at(shelf, 0, 0.5 + i * 0.42, -0.04);
    g.add(shelf);
  }

  const bottle = cl(0.06, 0.06, 0.22, 6, C.save);
  at(bottle, -0.2, 0.65, -0.1);
  g.add(bottle);
  const jar = cl(0.08, 0.07, 0.16, 8, C.sun);
  at(jar, 0.16, 0.62, -0.06);
  g.add(jar);
  const greens = sp(0.12, C.leaf);
  at(greens, 0.05, 1.0, -0.08);
  g.add(greens);

  const coldGlowMat = matUnique(C.ice, { emissive: C.ice, emissiveIntensity: 1.1 });
  const coldGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.5), coldGlowMat);
  at(coldGlow, 0, 0.98, -0.3);
  coldGlow.castShadow = false;
  g.add(coldGlow);

  // Puerta con bisagra en el borde izquierdo.
  const hinge = new THREE.Group();
  at(hinge, -0.49, 0.95, 0.37);
  g.add(hinge);

  const door = bx(0.97, 1.84, 0.08, C.white);
  at(door, 0.485, 0, 0);
  hinge.add(door);

  const handle = bx(0.05, 0.5, 0.05, C.metal);
  at(handle, 0.88, 0.16, 0.06);
  hinge.add(handle);
  const handle2 = bx(0.05, 0.28, 0.05, C.metal);
  at(handle2, 0.88, 0.62, 0.06);
  hinge.add(handle2);

  const magnet = bx(0.1, 0.1, 0.02, C.sun);
  at(magnet, 0.3, 0.4, 0.05);
  hinge.add(magnet);

  const leak = motes(6, C.ice, { spread: 0.7, depth: 0.5, speed: 0.32, rise: true, size: 0.055 });
  at(leak.group, 0, 0.35, 0.5);
  g.add(leak.group);

  let target = -1.15;
  let current = -1.15;
  hinge.rotation.y = current;

  const set = (open: boolean) => {
    target = open ? -1.15 : 0;
    leak.group.visible = open;
    coldGlowMat.emissiveIntensity = open ? 1.1 : 0.45;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      current += (target - current) * Math.min(1, dt * 5);
      hinge.rotation.y = current;
      if (leak.group.visible) leak.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Ventana abierta + aire acondicionado encendido                      */
/* ------------------------------------------------------------------ */

export function airConWindow(): Device {
  const g = new THREE.Group();
  const ticks: ((dt: number, t: number) => void)[] = [];

  /* --- Ventana --- */
  const win = new THREE.Group();
  at(win, 0.85, 1.62, 0.02);
  g.add(win);

  const fw = 1.84;  const fh = 1.36;
  const top = bx(fw, 0.1, 0.12, C.wood);
  at(top, 0, fh / 2, 0);
  win.add(top);
  const bottom = bx(fw, 0.12, 0.18, C.wood);
  at(bottom, 0, -fh / 2, 0.02);
  win.add(bottom);
  const sideL = bx(0.1, fh, 0.12, C.wood);
  at(sideL, -fw / 2, 0, 0);
  win.add(sideL);
  const sideR = sideL.clone();
  at(sideR, fw / 2, 0, 0);
  win.add(sideR);

  const skyMat = matUnique(C.sky, { emissive: C.sky, emissiveIntensity: 0.55, rough: 1 });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(fw - 0.1, fh - 0.1), skyMat);
  sky.castShadow = false;
  win.add(sky);

  const cloud = sp(0.16, C.white);
  at(cloud, -0.3, 0.2, 0.02);
  cloud.castShadow = false;
  win.add(cloud);
  const cloud2 = sp(0.11, C.white);
  at(cloud2, 0.35, -0.1, 0.02);
  cloud2.castShadow = false;
  win.add(cloud2);

  // Hojas que se abren hacia el interior
  const paneA = new THREE.Group();
  at(paneA, -fw / 2 + 0.05, 0, 0.04);
  win.add(paneA);
  const glassA = new THREE.Mesh(
    new THREE.PlaneGeometry(fw / 2 - 0.1, fh - 0.16),
    matUnique(C.glass, { transparent: true, opacity: 0.35, rough: 0.1, metal: 0.1 }),
  );
  at(glassA, (fw / 2 - 0.1) / 2, 0, 0);
  glassA.castShadow = false;
  paneA.add(glassA);
  const mullA = bx(fw / 2 - 0.1, 0.05, 0.05, C.wood);
  at(mullA, (fw / 2 - 0.1) / 2, 0, 0.02);
  paneA.add(mullA);

  const paneB = new THREE.Group();
  at(paneB, fw / 2 - 0.05, 0, 0.04);
  win.add(paneB);
  const glassB = new THREE.Mesh(
    new THREE.PlaneGeometry(fw / 2 - 0.1, fh - 0.16),
    matUnique(C.glass, { transparent: true, opacity: 0.35, rough: 0.1, metal: 0.1 }),
  );
  at(glassB, -(fw / 2 - 0.1) / 2, 0, 0);
  glassB.castShadow = false;
  paneB.add(glassB);
  const mullB = bx(fw / 2 - 0.1, 0.05, 0.05, C.wood);
  at(mullB, -(fw / 2 - 0.1) / 2, 0, 0.02);
  paneB.add(mullB);

  const curtainL = bx(0.05, fh + 0.4, 0.5, C.creamDark);
  at(curtainL, -fw / 2 - 0.16, 0.1, 0.3);
  win.add(curtainL);
  const curtainR = bx(0.05, fh + 0.4, 0.5, C.creamDark);
  at(curtainR, fw / 2 + 0.16, 0.1, 0.3);
  win.add(curtainR);

  /* --- Aire acondicionado --- */
  const ac = new THREE.Group();
  at(ac, -1.05, 2.55, 0.16);
  g.add(ac);

  const acBody = bx(1.34, 0.52, 0.34, C.white);
  ac.add(acBody);
  const acFace = bx(1.24, 0.2, 0.04, C.offwhite);
  at(acFace, 0, -0.14, 0.18);
  ac.add(acFace);
  for (let i = 0; i < 3; i += 1) {
    const louver = bx(1.1, 0.03, 0.05, C.gray);
    at(louver, 0, -0.08 - i * 0.055, 0.19);
    louver.rotation.x = -0.3;
    ac.add(louver);
  }

  const acLedMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.5 });
  const acLed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02, 0), acLedMat);
  at(acLed, 0.56, 0.14, 0.18);
  acLed.castShadow = false;
  ac.add(acLed);

  const airflow = new THREE.Group();
  at(airflow, 0, -0.2, 0.2);
  ac.add(airflow);
  const streaks: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i += 1) {
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.02, 0.5),
      matUnique(C.sky, { emissive: C.sky, emissiveIntensity: 0.6, transparent: true, opacity: 0.55 }),
    );
    s.castShadow = false;
    s.receiveShadow = false;
    s.position.set(-0.35 + i * 0.35, 0, 0.2);
    airflow.add(s);
    streaks.push(s);
  }

  ticks.push((dt, t) => {
    for (let i = 0; i < streaks.length; i += 1) {
      const s = streaks[i];
      const p = ((t * 0.9 + i * 0.33) % 1);
      s.position.z = 0.1 + p * 0.7;
      s.scale.z = 0.6 + Math.sin(p * Math.PI) * 0.9;
      const m = s.material as THREE.MeshStandardMaterial;
      m.opacity = 0.5 * Math.sin(p * Math.PI);
    }
    void dt;
  });

  let open = true;
  let paneTarget = -1.05;
  let acOn = true;

  const set = (active: boolean) => {
    open = active;
    acOn = active;
    paneTarget = active ? -1.05 : 0;
    airflow.visible = active;
    acLedMat.emissiveIntensity = active ? 1.5 : 0.15;
  };
  set(true);

  ticks.push((dt, t) => {
    const rate = Math.min(1, dt * 4);
    // Las hojas son simétricas: abren hacia lados opuestos.
    const targetA = open ? paneTarget : 0;
    const targetB = open ? -paneTarget : 0;
    paneA.rotation.y += (targetA - paneA.rotation.y) * rate;
    paneB.rotation.y += (targetB - paneB.rotation.y) * rate;
    const sway = Math.sin(t * 0.7) * 0.02;
    curtainL.rotation.z = sway;
    curtainR.rotation.z = -sway;
    void acOn;
  });

  return { group: g, set, tick: mergeTicks(...ticks) };
}

/* ------------------------------------------------------------------ */
/* Plancha encendida y olvidada                                        */
/* ------------------------------------------------------------------ */

export function ironUnit(): Device {
  const g = new THREE.Group();

  const board = bx(1.32, 0.08, 0.44, C.cream);
  at(board, 0, 0.84, 0);
  g.add(board);
  const boardEdge = bx(1.34, 0.05, 0.46, C.sky);
  at(boardEdge, 0, 0.79, 0);
  g.add(boardEdge);

  for (const sx of [-0.46, 0.46]) {
    const legA = bx(0.05, 0.86, 0.05, C.metalDark);
    at(legA, sx, 0.42, 0.16, 0, 0.12, sx > 0 ? -0.1 : 0.1);
    g.add(legA);
    const legB = bx(0.05, 0.86, 0.05, C.metalDark);
    at(legB, sx, 0.42, -0.16, 0, -0.12, sx > 0 ? 0.1 : -0.1);
    g.add(legB);
  }

  const ironBody = bx(0.28, 0.11, 0.17, C.white);
  at(ironBody, 0.24, 0.94, 0);
  g.add(ironBody);
  const sole = bx(0.3, 0.03, 0.19, C.metal);
  at(sole, 0.24, 0.875, 0);
  g.add(sole);
  const handle = bx(0.16, 0.06, 0.08, C.ink);
  at(handle, 0.2, 1.02, 0);
  g.add(handle);

  const ironLedMat = matUnique(C.coral, { emissive: C.coral, emissiveIntensity: 1.6 });
  const ironLed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018, 0), ironLedMat);
  at(ironLed, 0.33, 0.95, 0.09);
  ironLed.castShadow = false;
  g.add(ironLed);

  const steam = motes(5, C.white, { spread: 0.2, depth: 0.16, speed: 0.55, rise: true, size: 0.045 });
  at(steam.group, 0.26, 0.98, 0);
  g.add(steam.group);

  const set = (on: boolean) => {
    ironLedMat.emissiveIntensity = on ? 1.6 : 0;
    steam.group.visible = on;
    (sole.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(C.fire);
    (sole.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 0.3 : 0;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (steam.group.visible) steam.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Cafetera de filtro (señuelo: café listo y caliente)                 */
/* ------------------------------------------------------------------ */

export function coffeeMaker(): Device {
  const g = new THREE.Group();

  const body = bx(0.42, 0.5, 0.34, C.ink);
  at(body, 0, 0.25, -0.06);
  g.add(body);
  const top = bx(0.44, 0.06, 0.36, C.grayDark);
  at(top, 0, 0.51, -0.06);
  g.add(top);

  const carafe = cl(0.14, 0.12, 0.26, 8, C.glass, { transparent: true, opacity: 0.55 });
  at(carafe, 0, 0.16, 0.16);
  g.add(carafe);
  const coffee = cl(0.12, 0.1, 0.16, 8, 0x6b4326);
  at(coffee, 0, 0.13, 0.16);
  g.add(coffee);
  const lid = cl(0.15, 0.15, 0.04, 8, C.ink);
  at(lid, 0, 0.3, 0.16);
  g.add(lid);

  const plate = cl(0.2, 0.2, 0.03, 10, C.gray);
  at(plate, 0, 0.02, 0.16);
  g.add(plate);

  const ledMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.4 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.016, 0), ledMat);
  at(led, 0.16, 0.4, 0.13);
  led.castShadow = false;
  g.add(led);

  const steam = motes(5, C.white, { spread: 0.12, depth: 0.1, speed: 0.7, rise: true, size: 0.04 });
  at(steam.group, 0, 0.34, 0.16);
  g.add(steam.group);

  const set = (on: boolean) => {
    ledMat.emissiveIntensity = on ? 1.4 : 0.1;
    steam.group.visible = on;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (steam.group.visible) steam.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Mesa auxiliar con libro abierto (señuelo: luz en uso)               */
/* ------------------------------------------------------------------ */

export function readingNook(torch: Device): Device {
  const g = new THREE.Group();

  const top = bx(0.9, 0.08, 0.6, C.wood);
  at(top, 0, 0.62, 0);
  g.add(top);
  for (const [x, z] of [
    [-0.36, -0.22],
    [0.36, -0.22],
    [-0.36, 0.22],
    [0.36, 0.22],
  ]) {
    const leg = cl(0.04, 0.035, 0.62, 5, C.woodDark);
    at(leg, x, 0.31, z);
    g.add(leg);
  }

  const bookL = bx(0.3, 0.03, 0.22, C.coral);
  at(bookL, -0.14, 0.675, 0.02, 0, 0, 0.12);
  g.add(bookL);
  const bookR = bx(0.3, 0.03, 0.22, C.coral);
  at(bookR, 0.14, 0.675, 0.02, 0, 0, -0.12);
  g.add(bookR);
  const pagesL = bx(0.26, 0.02, 0.19, C.cream);
  at(pagesL, -0.14, 0.693, 0.02, 0, 0, 0.12);
  g.add(pagesL);
  const pagesR = bx(0.26, 0.02, 0.19, C.cream);
  at(pagesR, 0.14, 0.693, 0.02, 0, 0, -0.12);
  g.add(pagesR);

  const mug = cl(0.07, 0.065, 0.11, 8, C.cream);
  at(mug, 0.34, 0.72, 0.12);
  g.add(mug);
  const mugSteam = motes(3, C.white, { spread: 0.08, depth: 0.08, speed: 0.8, size: 0.03 });
  at(mugSteam.group, 0.34, 0.78, 0.12);
  g.add(mugSteam.group);

  const lamp = torch;
  at(lamp.group, 0.02, 0.66, -0.16);
  g.add(lamp.group);

  return {
    group: g,
    set: (on: boolean) => {
      lamp.set(on);
      mugSteam.group.visible = on;
    },
    tick: (dt, t) => {
      if (mugSteam.group.visible) mugSteam.tick(dt, t);
      lamp.tick?.(dt, t);
    },
  };
}
