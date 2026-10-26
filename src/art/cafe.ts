import * as THREE from 'three';
import { C } from './palette';
import { mat, matUnique } from './materials';
import { at, bx, cl, halo, motes, sp, tube } from './props';
import type { Device } from './props';

/* ------------------------------------------------------------------ */
/* Cafetera espresso encendida con la jarra vacía                      */
/* ------------------------------------------------------------------ */

export function espressoMachine(): Device {
  const g = new THREE.Group();

  const body = bx(0.8, 0.56, 0.46, C.metal);
  at(body, 0, 0.28, 0);
  g.add(body);
  const front = bx(0.74, 0.42, 0.03, C.metalDark);
  at(front, 0, 0.3, 0.24);
  g.add(front);
  const topTray = bx(0.84, 0.05, 0.5, C.grayDark);
  at(topTray, 0, 0.57, 0);
  g.add(topTray);

  const groupHead = cl(0.09, 0.09, 0.12, 8, C.metalDark);
  at(groupHead, -0.16, 0.44, 0.26);
  g.add(groupHead);
  const portaArm = bx(0.28, 0.05, 0.06, C.ink);
  at(portaArm, 0.02, 0.4, 0.3);
  g.add(portaArm);
  const portafilter = cl(0.1, 0.09, 0.05, 8, C.metal);
  at(portafilter, -0.16, 0.38, 0.26);
  g.add(portafilter);

  const steamWand = cl(0.015, 0.015, 0.24, 5, C.metal);
  at(steamWand, 0.28, 0.4, 0.28, 0, 0, 0.2);
  g.add(steamWand);

  const tray = bx(0.6, 0.03, 0.3, C.grayDark);
  at(tray, 0, 0.03, 0.12);
  g.add(tray);

  // Jarra vacía y transparente: la clave visual del desperdicio.
  const carafeMat = matUnique(C.glass, { transparent: true, opacity: 0.4, rough: 0.15 });
  const carafe = cl(0.16, 0.13, 0.24, 8, C.glass, { transparent: true, opacity: 0.4 });
  at(carafe, 0.02, 0.17, 0.14);
  g.add(carafe);
  void carafeMat;
  const carafeLip = cl(0.17, 0.17, 0.03, 8, C.metal);
  at(carafeLip, 0.02, 0.29, 0.14);
  g.add(carafeLip);

  const ledMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.6 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018, 0), ledMat);
  at(led, 0.3, 0.5, 0.26);
  led.castShadow = false;
  g.add(led);

  const light = new THREE.PointLight(C.sun, 0, 2.2, 2);
  at(light, 0, 0.6, 0.1);
  g.add(light);

  const steam = motes(6, C.white, { spread: 0.24, depth: 0.16, speed: 0.55, rise: true, size: 0.045 });
  at(steam.group, -0.02, 0.34, 0.2);
  g.add(steam.group);

  const drop = motes(4, 0x8a5533, { spread: 0.06, depth: 0.06, speed: 0.9, rise: false, size: 0.03 });
  at(drop.group, -0.16, 0.36, 0.26);
  g.add(drop.group);

  let on = true;
  const set = (active: boolean) => {
    on = active;
    ledMat.emissiveIntensity = active ? 1.6 : 0.1;
    light.intensity = active ? 1.1 : 0;
    steam.group.visible = active;
    drop.group.visible = active;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (!on) return;
      steam.tick(dt, t);
      drop.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Vitrina refrigerada con la puerta abierta                           */
/* ------------------------------------------------------------------ */

export function displayCase(): Device {
  const g = new THREE.Group();

  const base = bx(1.2, 0.14, 0.6, C.forest);
  at(base, 0, 0.07, 0);
  g.add(base);

  const interior = bx(1.1, 0.06, 0.52, C.creamDark);
  at(interior, 0, 0.16, 0);
  g.add(interior);

  const glassMat = matUnique(C.glass, { transparent: true, opacity: 0.28, rough: 0.1 });
  const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.62), glassMat);
  at(backPanel, 0, 0.5, -0.27);
  backPanel.castShadow = false;
  g.add(backPanel);

  const topGlass = bx(1.2, 0.04, 0.6, C.glass, { transparent: true, opacity: 0.3 });
  at(topGlass, 0, 0.8, 0);
  topGlass.castShadow = false;
  g.add(topGlass);

  for (const x of [-0.6, 0.6]) {
    const post = bx(0.04, 0.7, 0.04, C.metal);
    at(post, x, 0.5, 0.28);
    g.add(post);
  }

  // Bandejas con pasteles
  for (let row = 0; row < 2; row += 1) {
    const tray = bx(1.0, 0.02, 0.44, C.offwhite);
    at(tray, 0, 0.3 + row * 0.26, 0);
    g.add(tray);
    for (let i = 0; i < 3; i += 1) {
      const cake = cl(0.06, 0.07, 0.09, 8, [C.coral, C.sun, C.purple][(i + row) % 3]);
      at(cake, -0.32 + i * 0.32, 0.36 + row * 0.26, 0);
      g.add(cake);
      const cherry = sp(0.025, C.coral);
      at(cherry, -0.32 + i * 0.32, 0.42 + row * 0.26, 0);
      g.add(cherry);
    }
  }

  const innerLightMat = matUnique(C.sun, { emissive: C.sun, emissiveIntensity: 1.2 });
  const innerLight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.02, 0.04), innerLightMat);
  at(innerLight, 0, 0.78, 0.22);
  innerLight.castShadow = false;
  g.add(innerLight);

  // Puerta de vidrio con bisagra a la izquierda
  const hinge = new THREE.Group();
  at(hinge, -0.6, 0.46, 0.29);
  g.add(hinge);

  const doorFrame = bx(1.18, 0.68, 0.04, C.metal);
  at(doorFrame, 0.6, 0, 0);
  hinge.add(doorFrame);
  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.58), glassMat);
  at(doorGlass, 0.6, 0, 0.03);
  doorGlass.castShadow = false;
  hinge.add(doorGlass);
  const handle = bx(0.05, 0.24, 0.05, C.ink);
  at(handle, 1.12, 0, 0.05);
  hinge.add(handle);

  const leak = motes(6, C.ice, { spread: 0.9, depth: 0.4, speed: 0.3, rise: true, size: 0.05 });
  at(leak.group, 0, 0.2, 0.34);
  g.add(leak.group);

  let target = -1.2;
  let current = -1.2;
  hinge.rotation.y = current;
  let open = true;

  const set = (active: boolean) => {
    open = active;
    target = active ? -1.2 : 0;
    leak.group.visible = active;
    innerLightMat.emissiveIntensity = active ? 1.2 : 0.3;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      current += (target - current) * Math.min(1, dt * 4);
      hinge.rotation.y = current;
      if (open) leak.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Lámpara colgante                                                    */
/* ------------------------------------------------------------------ */

export function pendantLamp(cord = 0.9): Device {
  const g = new THREE.Group();

  const cordMesh = cl(0.012, 0.012, cord, 4, C.ink);
  at(cordMesh, 0, cord / 2, 0);
  g.add(cordMesh);

  const shadeMat = matUnique(C.terracotta, { emissive: C.sun, emissiveIntensity: 0, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.34, 0.3, 8, 1, true), shadeMat);
  at(shade, 0, -0.16, 0);
  shade.castShadow = true;
  g.add(shade);

  const bulbMat = matUnique(C.cream, { emissive: C.sun, emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), bulbMat);
  at(bulb, 0, -0.26, 0);
  g.add(bulb);

  const glow = halo(C.sun, 1.1, 0);
  at(glow, 0, -0.26, 0);
  g.add(glow);

  const set = (on: boolean) => {
    shadeMat.emissiveIntensity = on ? 0.35 : 0;
    bulbMat.emissiveIntensity = on ? 1.6 : 0;
    (glow.material as THREE.SpriteMaterial).opacity = on ? 0.3 : 0;
  };
  set(true);

  return { group: g, set };
}

/* ------------------------------------------------------------------ */
/* Ventilador de pie                                                   */
/* ------------------------------------------------------------------ */

export function standFan(): Device {
  const g = new THREE.Group();

  const base = cl(0.26, 0.3, 0.07, 10, C.offwhite);
  at(base, 0, 0.035, 0);
  g.add(base);
  const pole = cl(0.035, 0.035, 0.95, 6, C.offwhite);
  at(pole, 0, 0.5, 0);
  g.add(pole);

  const head = new THREE.Group();
  at(head, 0, 1.05, 0);
  g.add(head);

  const motor = cl(0.11, 0.1, 0.16, 10, C.offwhite);
  at(motor, 0, 0, -0.12, 0, 0, Math.PI / 2);
  motor.rotation.z = 0;
  motor.rotation.x = Math.PI / 2;
  head.add(motor);

  const cageMat = mat(C.metal);
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.07, 0.012, 4, 16), cageMat);
    at(ring, 0, 0, 0.02);
    head.add(ring);
  }
  for (let i = 0; i < 5; i += 1) {
    const spoke = bx(0.012, 0.5, 0.012, C.metal);
    at(spoke, 0, 0, 0.03);
    spoke.rotation.z = (i / 5) * Math.PI;
    head.add(spoke);
  }

  const blades = new THREE.Group();
  at(blades, 0, 0, 0);
  head.add(blades);
  for (let i = 0; i < 3; i += 1) {
    const blade = bx(0.12, 0.3, 0.02, C.sky);
    at(blade, 0, 0.14, 0);
    blade.rotation.z = (i / 3) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / 3) * Math.PI * 2;
    pivot.add(blade);
    blade.position.set(0, 0.13, 0);
    blade.rotation.set(0.5, 0, 0);
    blades.add(pivot);
  }

  let on = true;
  const set = (active: boolean) => {
    on = active;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (!on) return;
      blades.rotation.z -= dt * 9;
      head.rotation.y = Math.sin(t * 0.7) * 0.55;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Calefactor eléctrico                                                */
/* ------------------------------------------------------------------ */

export function heaterUnit(): Device {
  const g = new THREE.Group();

  const body = bx(0.7, 0.52, 0.28, C.coral);
  at(body, 0, 0.28, 0);
  g.add(body);
  const grill = bx(0.6, 0.34, 0.04, C.ink);
  at(grill, 0, 0.3, 0.15);
  g.add(grill);

  const coilMat = matUnique(0x552211, { emissive: C.fire, emissiveIntensity: 0 });
  for (let i = 0; i < 3; i += 1) {
    const coil = bx(0.52, 0.03, 0.02, C.fire);
    coil.material = coilMat;
    at(coil, 0, 0.2 + i * 0.1, 0.17);
    coil.castShadow = false;
    g.add(coil);
  }

  const glow = halo(C.fire, 1.1, 0);
  at(glow, 0, 0.32, 0.2);
  g.add(glow);

  for (const x of [-0.24, 0.24]) {
    const foot = bx(0.12, 0.04, 0.34, C.grayDark);
    at(foot, x, 0.02, 0);
    g.add(foot);
  }

  const set = (on: boolean) => {
    coilMat.emissiveIntensity = on ? 1.5 : 0;
    (glow.material as THREE.SpriteMaterial).opacity = on ? 0.32 : 0;
  };
  set(true);

  return { group: g, set };
}

/* ------------------------------------------------------------------ */
/* Lavabo con grifo goteando agua caliente                             */
/* ------------------------------------------------------------------ */

export function sinkUnit(): Device {
  const g = new THREE.Group();

  const counter = bx(1.1, 0.1, 0.62, C.cream);
  at(counter, 0, 0.06, 0);
  g.add(counter);

  const basin = bx(0.72, 0.14, 0.42, C.metal);
  at(basin, 0, 0.1, 0.04);
  g.add(basin);
  const basinInner = bx(0.62, 0.1, 0.32, C.grayDark);
  at(basinInner, 0, 0.14, 0.04);
  g.add(basinInner);

  const faucetBody = cl(0.03, 0.035, 0.36, 8, C.metal);
  at(faucetBody, -0.3, 0.28, -0.16);
  g.add(faucetBody);
  const spout = tube(
    [
      [-0.3, 0.44, -0.16],
      [-0.28, 0.52, -0.1],
      [-0.22, 0.5, 0.0],
      [-0.2, 0.42, 0.02],
    ],
    0.03,
    C.metal,
  );
  g.add(spout);

  const streamMat = matUnique(C.ice, {
    emissive: C.ice,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.7,
  });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.3, 5), streamMat);
  at(stream, -0.2, 0.27, 0.02);
  stream.castShadow = false;
  g.add(stream);

  const steam = motes(5, C.white, { spread: 0.18, depth: 0.1, speed: 0.5, rise: true, size: 0.04 });
  at(steam.group, -0.2, 0.16, 0.02);
  g.add(steam.group);

  const rippleMat = new THREE.MeshBasicMaterial({
    color: C.ice,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.07, 12), rippleMat);
  at(ripple, -0.2, 0.15, 0.02, 0, -Math.PI / 2);
  ripple.castShadow = false;
  g.add(ripple);

  let on = true;
  const set = (active: boolean) => {
    on = active;
    stream.visible = active;
    steam.group.visible = active;
    ripple.visible = active;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (!on) return;
      steam.tick(dt, t);
      const s = 1 + ((t * 1.2) % 1) * 1.8;
      ripple.scale.setScalar(s);
      rippleMat.opacity = 0.5 * (1 - ((t * 1.2) % 1));
      stream.scale.y = 0.92 + Math.sin(t * 12) * 0.05;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Letrero luminoso                                                    */
/* ------------------------------------------------------------------ */

export function neonSign(text = 'CAFÉ'): Device {
  const g = new THREE.Group();

  const board = bx(2.0, 0.9, 0.1, C.ink);
  g.add(board);
  const border = bx(1.9, 0.8, 0.04, C.woodDark);
  at(border, 0, 0, 0.06);
  g.add(border);

  const glowMat = matUnique(C.neon, { emissive: C.neon, emissiveIntensity: 2 });
  const cup = cl(0.22, 0.16, 0.26, 10, C.neon);
  cup.material = glowMat;
  at(cup, -0.2, 0.02, 0.1);
  g.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 4, 10), glowMat);
  at(handle, 0.06, 0.04, 0.1);
  g.add(handle);
  const saucer = cl(0.3, 0.3, 0.03, 10, C.neon);
  saucer.material = glowMat;
  at(saucer, -0.2, -0.14, 0.1);
  g.add(saucer);

  const steamGlow = cl(0.02, 0.02, 0.2, 4, C.neon);
  steamGlow.material = glowMat;
  at(steamGlow, -0.24, 0.28, 0.1);
  g.add(steamGlow);
  const steamGlow2 = cl(0.02, 0.02, 0.16, 4, C.neon);
  steamGlow2.material = glowMat;
  at(steamGlow2, -0.12, 0.3, 0.1);
  g.add(steamGlow2);

  const glow = halo(C.neon, 2.6, 0);
  at(glow, 0, 0, 0.2);
  g.add(glow);

  const label = text;
  g.userData.text = label;

  const set = (on: boolean) => {
    glowMat.emissiveIntensity = on ? 2 : 0.08;
    (glow.material as THREE.SpriteMaterial).opacity = on ? 0.26 : 0;
  };
  set(true);

  return { group: g, set };
}

/* ------------------------------------------------------------------ */
/* Refrigerador de bebidas cerrado (señuelo)                           */
/* ------------------------------------------------------------------ */

export function drinksFridge(): Device {
  const g = new THREE.Group();

  const body = bx(0.8, 1.5, 0.66, C.forest);
  at(body, 0, 0.75, 0);
  g.add(body);

  const glassMat = matUnique(C.glass, { transparent: true, opacity: 0.25, rough: 0.1 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 1.2), glassMat);
  at(glass, 0, 0.8, 0.34);
  glass.castShadow = false;
  g.add(glass);

  for (let row = 0; row < 3; row += 1) {
    const shelf = bx(0.66, 0.02, 0.4, C.metal);
    at(shelf, 0, 0.4 + row * 0.35, 0);
    g.add(shelf);
    for (let i = 0; i < 4; i += 1) {
      const bottle = cl(0.045, 0.05, 0.2, 6, [C.sun, C.save, C.coral, C.sky][(i + row) % 4]);
      at(bottle, -0.24 + i * 0.16, 0.52 + row * 0.35, 0.02);
      g.add(bottle);
    }
  }

  const frame = bx(0.84, 1.54, 0.04, C.metalDark);
  at(frame, 0, 0.75, 0.35);
  g.add(frame);
  const innerGlass = bx(0.7, 1.24, 0.02, C.glass, { transparent: true, opacity: 0.22 });
  at(innerGlass, 0, 0.8, 0.37);
  innerGlass.castShadow = false;
  g.add(innerGlass);

  const ledMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.2 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02, 0), ledMat);
  at(led, 0.3, 1.35, 0.38);
  led.castShadow = false;
  g.add(led);

  const handle = bx(0.05, 0.5, 0.05, C.metal);
  at(handle, 0.36, 0.8, 0.4);
  g.add(handle);

  return {
    group: g,
    set: (on: boolean) => {
      ledMat.emissiveIntensity = on ? 1.2 : 0.2;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Caja registradora con pantalla encendida                            */
/* ------------------------------------------------------------------ */

export function posRegister(): Device {
  const g = new THREE.Group();

  const base = bx(0.42, 0.1, 0.34, C.ink);
  at(base, 0, 0.05, 0);
  g.add(base);
  const stem = cl(0.03, 0.03, 0.3, 6, C.grayDark);
  at(stem, 0, 0.2, -0.06);
  g.add(stem);

  const screen = bx(0.42, 0.3, 0.04, C.ink);
  at(screen, 0, 0.42, -0.02, 0, -0.2);
  g.add(screen);

  const screenMat = matUnique(C.sky, { emissive: C.sky, emissiveIntensity: 1.1 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.24), screenMat);
  at(face, 0, 0.42, 0.01, -0.2);
  face.castShadow = false;
  g.add(face);

  const keypad = bx(0.32, 0.03, 0.2, C.gray);
  at(keypad, 0, 0.12, 0.04);
  g.add(keypad);

  const set = (on: boolean) => {
    screenMat.emissiveIntensity = on ? 1.1 : 0.15;
  };
  set(true);

  return { group: g, set };
}

/* ------------------------------------------------------------------ */
/* Pizarra de menú en la pared                                         */
/* ------------------------------------------------------------------ */

export function menuBoard(): Device {
  const g = new THREE.Group();

  const frame = bx(1.7, 1.0, 0.08, C.woodDark);
  g.add(frame);
  const boardMat = matUnique(0x2f3b33, { emissive: 0x000000, emissiveIntensity: 0 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 0.86), boardMat);
  at(board, 0, 0, 0.05);
  board.castShadow = false;
  g.add(board);

  const colors = [C.cream, C.sun, C.save, C.coral];
  for (let i = 0; i < 4; i += 1) {
    const line = bx(0.9 - i * 0.12, 0.035, 0.01, colors[i]);
    at(line, -0.2 + i * 0.02, 0.28 - i * 0.16, 0.06);
    line.castShadow = false;
    g.add(line);
    const price = bx(0.16, 0.035, 0.01, C.cream);
    at(price, 0.56, 0.28 - i * 0.16, 0.06);
    price.castShadow = false;
    g.add(price);
  }

  return { group: g, set: () => undefined };
}

/* ------------------------------------------------------------------ */
/* Teléfono cargando en el mostrador (señuelo)                         */
/* ------------------------------------------------------------------ */

export function phoneCharging(): Device {
  const g = new THREE.Group();

  const mat_ = bx(0.22, 0.03, 0.12, C.grayDark);
  at(mat_, 0, 0.015, 0);
  g.add(mat_);
  const cable = tube(
    [
      [0.1, 0.02, 0],
      [0.22, 0.01, 0.02],
      [0.3, 0.01, 0.1],
    ],
    0.012,
    C.ink,
  );
  g.add(cable);
  const plug = bx(0.05, 0.04, 0.04, C.white);
  at(plug, 0.34, 0.02, 0.12);
  g.add(plug);

  const phone = bx(0.1, 0.015, 0.19, C.ink);
  at(phone, 0, 0.035, 0.02);
  g.add(phone);
  const screenMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 0.9 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.16), screenMat);
  at(scr, 0, 0.045, 0.02, 0, -Math.PI / 2);
  scr.castShadow = false;
  g.add(scr);

  return {
    group: g,
    set: (on: boolean) => {
      screenMat.emissiveIntensity = on ? 0.9 : 0.15;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Mesa de bar con lámpara (señuelo)                                   */
/* ------------------------------------------------------------------ */

export function cafeTable(): Device {
  const g = new THREE.Group();

  const top = cl(0.5, 0.5, 0.07, 12, C.wood);
  at(top, 0, 0.76, 0);
  g.add(top);
  const stem = cl(0.06, 0.06, 0.74, 8, C.metalDark);
  at(stem, 0, 0.37, 0);
  g.add(stem);
  const foot = cl(0.22, 0.26, 0.05, 10, C.metalDark);
  at(foot, 0, 0.025, 0);
  g.add(foot);

  const cup = cl(0.075, 0.065, 0.1, 8, C.cream);
  at(cup, 0.16, 0.85, 0.08);
  g.add(cup);
  const coffee = cl(0.065, 0.06, 0.02, 8, 0x6b4326);
  at(coffee, 0.16, 0.9, 0.08);
  g.add(coffee);
  const laptop = bx(0.34, 0.02, 0.24, C.metal);
  at(laptop, -0.1, 0.8, -0.02);
  g.add(laptop);
  const lid = bx(0.34, 0.22, 0.015, C.metal);
  at(lid, -0.1, 0.91, -0.14, 0, 0, 0);
  lid.rotation.x = -0.25;
  g.add(lid);

  return { group: g, set: () => undefined };
}
