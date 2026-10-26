import * as THREE from 'three';
import { C } from './palette';
import { matUnique } from './materials';
import { at, bx, cl, halo, motes, sp, tube } from './props';
import type { Device } from './props';

/* ------------------------------------------------------------------ */
/* Horno encendido al máximo sin comida                                */
/* ------------------------------------------------------------------ */

export function ovenUnit(): Device {
  const g = new THREE.Group();

  const body = bx(0.94, 0.92, 0.66, C.metalDark);
  at(body, 0, 0.46, 0);
  g.add(body);

  const cooktop = bx(0.98, 0.06, 0.7, C.ink);
  at(cooktop, 0, 0.94, 0);
  g.add(cooktop);

  for (let i = 0; i < 4; i += 1) {
    const burner = cl(0.11, 0.11, 0.02, 10, C.grayDark);
    at(burner, -0.24 + (i % 2) * 0.48, 0.97, -0.16 + Math.floor(i / 2) * 0.32);
    g.add(burner);
  }

  const panel = bx(0.94, 0.14, 0.04, C.ink);
  at(panel, 0, 0.84, 0.34);
  g.add(panel);
  for (let i = 0; i < 4; i += 1) {
    const knob = cl(0.04, 0.04, 0.03, 8, C.metal);
    at(knob, -0.3 + i * 0.2, 0.84, 0.37, 0, Math.PI / 2);
    g.add(knob);
  }

  const windowMat = matUnique(0x2a1a12, { emissive: C.fire, emissiveIntensity: 1.6 });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38), windowMat);
  at(win, 0, 0.48, 0.335);
  win.castShadow = false;
  g.add(win);

  const frame = bx(0.7, 0.46, 0.03, C.metal);
  at(frame, 0, 0.48, 0.33);
  g.add(frame);
  const glassOver = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.36),
    matUnique(C.glass, { transparent: true, opacity: 0.3, rough: 0.1 }),
  );
  at(glassOver, 0, 0.48, 0.348);
  glassOver.castShadow = false;
  g.add(glassOver);

  const handle = bx(0.72, 0.05, 0.05, C.metal);
  at(handle, 0, 0.72, 0.37);
  g.add(handle);

  const glow = halo(C.fire, 1.6, 0.3);
  at(glow, 0, 0.48, 0.42);
  g.add(glow);

  const heat = motes(4, C.fire, { spread: 0.5, depth: 0.2, speed: 0.3, rise: true, size: 0.04 });
  at(heat.group, 0, 1.0, 0);
  g.add(heat.group);

  const knobLedMat = matUnique(C.coral, { emissive: C.coral, emissiveIntensity: 1.8 });
  const knobLed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018, 0), knobLedMat);
  at(knobLed, 0.34, 0.9, 0.37);
  knobLed.castShadow = false;
  g.add(knobLed);

  let on = true;
  const set = (active: boolean) => {
    on = active;
    windowMat.emissiveIntensity = active ? 1.6 : 0.08;
    (glow.material as THREE.SpriteMaterial).opacity = active ? 0.3 : 0;
    knobLedMat.emissiveIntensity = active ? 1.8 : 0;
    heat.group.visible = active;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (!on) return;
      heat.tick(dt, t);
      (glow.material as THREE.SpriteMaterial).opacity = 0.24 + Math.sin(t * 2.4) * 0.08;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Campana extractora                                                  */
/* ------------------------------------------------------------------ */

export function hoodUnit(): Device {
  const g = new THREE.Group();

  const canopy = bx(1.7, 0.16, 0.9, C.metal);
  at(canopy, 0, 0, 0);
  g.add(canopy);
  const skirt = bx(1.6, 0.22, 0.82, C.metal);
  at(skirt, 0, -0.16, 0);
  g.add(skirt);

  const duct = bx(0.46, 1.1, 0.46, C.metal);
  at(duct, 0, 0.63, -0.1);
  g.add(duct);

  const filter = bx(1.3, 0.03, 0.6, C.metalDark);
  at(filter, 0, -0.27, 0);
  g.add(filter);

  const blades = new THREE.Group();
  at(blades, 0, -0.22, 0);
  for (let i = 0; i < 3; i += 1) {
    const blade = bx(0.34, 0.03, 0.1, C.grayDark);
    at(blade, 0.17, 0, 0);
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 3) * Math.PI * 2;
    pivot.add(blade);
    blades.add(pivot);
  }
  g.add(blades);

  const ledMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.4 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02, 0), ledMat);
  at(led, 0.7, 0.1, 0.4);
  led.castShadow = false;
  g.add(led);

  const suction = motes(4, C.creamDark, { spread: 0.9, depth: 0.4, speed: 0.5, rise: true, size: 0.04 });
  at(suction.group, 0, -1.2, 0);
  g.add(suction.group);

  let on = true;
  const set = (active: boolean) => {
    on = active;
    ledMat.emissiveIntensity = active ? 1.4 : 0.1;
    suction.group.visible = active;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (!on) return;
      blades.rotation.y += dt * 10;
      suction.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Cámara frigorífica con la puerta mal cerrada                        */
/* ------------------------------------------------------------------ */

export function coldRoom(): Device {
  const g = new THREE.Group();

  const frame = bx(1.5, 2.3, 0.36, C.metal);
  at(frame, 0, 1.15, 0);
  g.add(frame);
  const inner = bx(1.26, 2.1, 0.4, 0xdff0f6);
  at(inner, 0, 1.1, 0.02);
  g.add(inner);

  const interiorMat = matUnique(C.ice, { emissive: C.ice, emissiveIntensity: 1.1 });
  const interior = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.0), interiorMat);
  at(interior, 0, 1.1, 0.2);
  interior.castShadow = false;
  g.add(interior);

  for (let i = 0; i < 3; i += 1) {
    const shelf = bx(1.16, 0.04, 0.34, C.metal);
    at(shelf, 0, 0.5 + i * 0.55, 0.24);
    g.add(shelf);
    for (let j = 0; j < 3; j += 1) {
      const crate = bx(0.26, 0.2, 0.24, [C.wood, C.olive, C.terracotta][(i + j) % 3]);
      at(crate, -0.38 + j * 0.38, 0.62 + i * 0.55, 0.26);
      g.add(crate);
    }
  }

  const hinge = new THREE.Group();
  at(hinge, -0.72, 1.12, 0.22);
  g.add(hinge);
  const door = bx(1.42, 2.2, 0.16, C.metal);
  at(door, 0.71, 0, 0);
  hinge.add(door);
  const doorPanel = bx(1.28, 2.04, 0.02, C.offwhite);
  at(doorPanel, 0.71, 0, 0.09);
  hinge.add(doorPanel);
  const handle = cl(0.05, 0.05, 0.4, 8, C.ink);
  at(handle, 1.36, 0, 0.16, 0, 0, Math.PI / 2);
  hinge.add(handle);
  const sign = bx(0.4, 0.16, 0.02, C.sky);
  at(sign, 0.7, -0.82, 0.11);
  hinge.add(sign);

  const freeze = motes(8, C.ice, { spread: 1.0, depth: 0.4, speed: 0.25, rise: false, size: 0.05 });
  at(freeze.group, 0, 2.1, 0.4);
  g.add(freeze.group);

  let target = -0.42;
  let current = -0.42;
  hinge.rotation.y = current;

  const set = (on: boolean) => {
    target = on ? -0.42 : 0;
    freeze.group.visible = on;
    interiorMat.emissiveIntensity = on ? 1.1 : 0.2;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      current += (target - current) * Math.min(1, dt * 4);
      hinge.rotation.y = current;
      if (freeze.group.visible) freeze.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Lavaplatos abierto a media carga                                    */
/* ------------------------------------------------------------------ */

export function dishwasherUnit(): Device {
  const g = new THREE.Group();

  const body = bx(1.0, 0.82, 0.62, C.metal);
  at(body, 0, 0.41, 0);
  g.add(body);
  const topPanel = bx(1.02, 0.06, 0.66, C.offwhite);
  at(topPanel, 0, 0.84, 0);
  g.add(topPanel);

  for (let i = 0; i < 3; i += 1) {
    const btn = cl(0.02, 0.02, 0.02, 6, i === 0 ? C.save : C.gray);
    at(btn, 0.32 + i * 0.07, 0.72, 0.32, 0, Math.PI / 2);
    g.add(btn);
  }

  // Puerta abatible hacia abajo
  const hinge = new THREE.Group();
  at(hinge, 0, 0.16, 0.31);
  g.add(hinge);
  const door = bx(0.94, 0.6, 0.06, C.metal);
  at(door, 0, 0.3, 0);
  hinge.add(door);
  const doorPanel = bx(0.8, 0.46, 0.02, C.offwhite);
  at(doorPanel, 0, 0.3, 0.04);
  hinge.add(doorPanel);

  // Interior con pocos platos: la mitad de la carga.
  const rack = bx(0.86, 0.02, 0.46, C.metalDark);
  at(rack, 0, 0.3, 0);
  g.add(rack);
  for (let i = 0; i < 2; i += 1) {
    const plate = cl(0.11, 0.11, 0.02, 10, C.cream);
    at(plate, -0.26 + i * 0.3, 0.33, -0.06, 0, 0, Math.PI / 2);
    plate.rotation.x = 1.4;
    g.add(plate);
  }
  const cup = cl(0.05, 0.045, 0.09, 8, C.cream);
  at(cup, 0.28, 0.36, 0.1);
  g.add(cup);

  const waterMat = matUnique(C.ice, { transparent: true, opacity: 0.55, rough: 0.2 });
  const water = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.4), waterMat);
  at(water, 0, 0.25, 0.02);
  water.castShadow = false;
  g.add(water);

  const drips = motes(4, C.ice, { spread: 0.5, depth: 0.2, speed: 0.9, rise: false, size: 0.025 });
  at(drips.group, 0, 0.4, 0.2);
  g.add(drips.group);

  let open = true;
  let target = 1.35;
  let current = 1.35;
  hinge.rotation.x = current;

  const set = (active: boolean) => {
    open = active;
    target = active ? 1.35 : 0;
    water.visible = active;
    drips.group.visible = active;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      current += (target - current) * Math.min(1, dt * 4);
      hinge.rotation.x = current;
      if (open) drips.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Freidora encendida y vacía                                          */
/* ------------------------------------------------------------------ */

export function fryerUnit(): Device {
  const g = new THREE.Group();

  const body = bx(0.9, 0.6, 0.6, C.metal);
  at(body, 0, 0.3, 0);
  g.add(body);
  const backBox = bx(0.92, 0.42, 0.18, C.metalDark);
  at(backBox, 0, 0.79, -0.2);
  g.add(backBox);
  const ledMat = matUnique(C.coral, { emissive: C.coral, emissiveIntensity: 1.6 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02, 0), ledMat);
  at(led, 0.34, 0.8, -0.1);
  led.castShadow = false;
  g.add(led);

  const oilMat = matUnique(0xc98a3a, { emissive: C.fire, emissiveIntensity: 0.4, rough: 0.3 });
  const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12), oilMat);
  at(oil, 0, 0.54, 0.02);
  g.add(oil);

  const well = cl(0.34, 0.32, 0.22, 12, C.metalDark);
  at(well, 0, 0.5, 0.02);
  g.add(well);

  const basket = bx(0.4, 0.18, 0.32, C.metalDark);
  at(basket, -0.02, 0.66, 0.02);
  g.add(basket);
  const basketHandle = tube(
    [
      [-0.2, 0.7, 0.02],
      [-0.3, 0.9, 0.02],
      [-0.2, 1.0, 0.02],
      [0.0, 1.0, 0.02],
    ],
    0.018,
    C.metalDark,
  );
  g.add(basketHandle);

  const bubbles = motes(6, C.sun, { spread: 0.4, depth: 0.3, speed: 1.1, rise: true, size: 0.03 });
  at(bubbles.group, 0, 0.5, 0.02);
  g.add(bubbles.group);

  const glow = halo(C.fire, 1.0, 0.22);
  at(glow, 0, 0.56, 0.05);
  g.add(glow);

  let on = true;
  const set = (active: boolean) => {
    on = active;
    ledMat.emissiveIntensity = active ? 1.6 : 0.1;
    oilMat.emissiveIntensity = active ? 0.4 : 0;
    bubbles.group.visible = active;
    (glow.material as THREE.SpriteMaterial).opacity = active ? 0.22 : 0;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (!on) return;
      bubbles.tick(dt, t);
      oil.scale.y = 0.9 + Math.sin(t * 6) * 0.25;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Mesa de servicio montada (señuelo)                                  */
/* ------------------------------------------------------------------ */

export function serviceTable(): Device {
  const g = new THREE.Group();

  const top = cl(0.62, 0.62, 0.08, 14, C.cream);
  at(top, 0, 0.76, 0);
  g.add(top);
  const cloth = cl(0.66, 0.62, 0.14, 14, C.terracotta);
  at(cloth, 0, 0.68, 0);
  g.add(cloth);
  const stem = cl(0.07, 0.07, 0.66, 8, C.woodDark);
  at(stem, 0, 0.36, 0);
  g.add(stem);
  const foot = cl(0.3, 0.34, 0.06, 12, C.woodDark);
  at(foot, 0, 0.03, 0);
  g.add(foot);

  for (let i = 0; i < 2; i += 1) {
    const plate = cl(0.16, 0.16, 0.02, 12, C.white);
    at(plate, -0.26 + i * 0.52, 0.82, 0.1 - i * 0.2);
    g.add(plate);
    const glass = cl(0.045, 0.035, 0.14, 8, C.glass, { transparent: true, opacity: 0.5 });
    at(glass, -0.16 + i * 0.5, 0.88, -0.24 + i * 0.1);
    g.add(glass);
  }

  const candle = cl(0.05, 0.05, 0.12, 8, C.cream);
  at(candle, 0, 0.87, 0);
  g.add(candle);
  const flame = sp(0.045, C.sun);
  at(flame, 0, 0.96, 0);
  flame.castShadow = false;
  g.add(flame);
  const flameGlow = halo(C.sun, 0.7, 0.35);
  at(flameGlow, 0, 0.96, 0);
  g.add(flameGlow);

  return {
    group: g,
    set: () => undefined,
    tick: (_dt, t) => {
      flame.scale.setScalar(0.85 + Math.sin(t * 8) * 0.12);
      (flameGlow.material as THREE.SpriteMaterial).opacity = 0.3 + Math.sin(t * 6) * 0.06;
    },
  };
}
