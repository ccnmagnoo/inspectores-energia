import * as THREE from 'three';
import { C } from './palette';
import { mat, matUnique } from './materials';
import { at, bx, cl, halo, motes, sp, tube } from './props';
import type { Device } from './props';

/* ------------------------------------------------------------------ */
/* Compresor de aire con fuga                                          */
/* ------------------------------------------------------------------ */

function airLeak(): { group: THREE.Group; tick: (dt: number, t: number) => void } {
  const group = new THREE.Group();
  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i += 1) {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.05, 0),
      matUnique(C.white, { transparent: true, opacity: 0.55, rough: 1 }),
    );
    m.castShadow = false;
    m.position.set(0, 0, 0);
    group.add(m);
    puffs.push(m);
  }
  return {
    group,
    tick: (dt, t) => {
      for (let i = 0; i < puffs.length; i += 1) {
        const p = (((t * 0.8 + i * 0.2) % 1) + 1) % 1;
        const m = puffs[i];
        m.position.set(p * 0.85, Math.sin(p * 6) * 0.05 + p * 0.1, p * 0.2);
        m.scale.setScalar(0.4 + Math.sin(p * Math.PI) * 1.0);
        (m.material as THREE.MeshStandardMaterial).opacity = 0.5 * Math.sin(p * Math.PI);
      }
      void dt;
    },
  };
}

export function compressorUnit(): Device {
  const g = new THREE.Group();

  const tank = cl(0.34, 0.34, 1.05, 12, C.terracotta);
  at(tank, 0, 0.57, 0);
  g.add(tank);
  const topDome = sp(0.34, C.terracotta);
  at(topDome, 0, 1.1, 0);
  topDome.scale.y = 0.55;
  g.add(topDome);

  const motor = bx(0.42, 0.36, 0.42, C.metalDark);
  at(motor, 0, 0.28, 0.28);
  g.add(motor);
  const motorFan = cl(0.14, 0.14, 0.06, 10, C.gray);
  at(motorFan, 0, 0.28, 0.5, 0, Math.PI / 2);
  g.add(motorFan);

  const gauge = cl(0.09, 0.09, 0.05, 10, C.cream);
  at(gauge, 0.3, 0.95, 0.06, 0, Math.PI / 2);
  g.add(gauge);

  for (const x of [-0.22, 0.22]) {
    const wheel = cl(0.1, 0.1, 0.06, 8, C.ink);
    at(wheel, x, 0.1, 0.42, 0, 0, Math.PI / 2);
    g.add(wheel);
  }

  const hose = tube(
    [
      [0.3, 0.85, 0.05],
      [0.62, 0.6, 0.12],
      [0.8, 0.24, 0.3],
      [0.98, 0.1, 0.5],
      [1.12, 0.08, 0.62],
    ],
    0.035,
    C.ink,
  );
  g.add(hose);

  const nozzle = cl(0.05, 0.06, 0.14, 8, C.metal);
  at(nozzle, 1.16, 0.09, 0.66, 0, Math.PI / 2);
  g.add(nozzle);

  const leak = airLeak();
  at(leak.group, 1.18, 0.1, 0.66);
  g.add(leak.group);

  const set = (on: boolean) => {
    leak.group.visible = on;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (leak.group.visible) leak.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Soldadora encendida sin usar                                        */
/* ------------------------------------------------------------------ */

export function welderUnit(): Device {
  const g = new THREE.Group();

  const cart = bx(0.6, 0.5, 0.44, C.sun);
  at(cart, 0, 0.4, 0);
  g.add(cart);
  const panel = bx(0.5, 0.26, 0.03, C.ink);
  at(panel, 0, 0.46, 0.23);
  g.add(panel);

  const dial = cl(0.06, 0.06, 0.04, 8, C.coral);
  at(dial, -0.1, 0.5, 0.26, 0, Math.PI / 2);
  g.add(dial);
  const ledMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.6 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018, 0), ledMat);
  at(led, 0.14, 0.5, 0.26);
  led.castShadow = false;
  g.add(led);

  for (const x of [-0.24, 0.24]) {
    for (const z of [-0.16, 0.16]) {
      const wheel = cl(0.07, 0.07, 0.05, 8, C.ink);
      at(wheel, x, 0.07, z, 0, 0, Math.PI / 2);
      g.add(wheel);
    }
  }

  const handle = tube(
    [
      [0.3, 0.62, 0.16],
      [0.5, 0.85, 0.2],
      [0.55, 0.88, 0.0],
      [0.3, 0.62, -0.16],
    ],
    0.025,
    C.ink,
  );
  g.add(handle);

  const cable = tube(
    [
      [0.1, 0.66, 0.1],
      [0.35, 0.5, 0.35],
      [0.55, 0.2, 0.5],
      [0.7, 0.06, 0.62],
    ],
    0.022,
    C.ink,
  );
  g.add(cable);

  const electrode = bx(0.04, 0.04, 0.34, C.metalDark);
  at(electrode, 0.72, 0.08, 0.66, 0, 0.3);
  g.add(electrode);

  const arcMat = matUnique(C.fire, { emissive: C.fire, emissiveIntensity: 2, transparent: true, opacity: 0 });
  const arc = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), arcMat);
  at(arc, 0.78, 0.09, 0.78);
  arc.castShadow = false;
  g.add(arc);

  const arcGlow = halo(C.fire, 0.9, 0);
  at(arcGlow, 0.78, 0.09, 0.78);
  g.add(arcGlow);

  const sparks = motes(4, C.fire, { spread: 0.1, depth: 0.1, speed: 1.4, rise: true, size: 0.025 });
  at(sparks.group, 0.78, 0.1, 0.78);
  g.add(sparks.group);

  let on = true;
  let t0 = 0;
  const set = (active: boolean) => {
    on = active;
    ledMat.emissiveIntensity = active ? 1.6 : 0.1;
    sparks.group.visible = active;
    arc.visible = active;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      t0 += dt;
      if (!on) {
        arcMat.opacity = 0;
        (arcGlow.material as THREE.SpriteMaterial).opacity = 0;
        return;
      }
      const flicker = 0.65 + Math.abs(Math.sin(t0 * 11)) * 0.35;
      arcMat.opacity = flicker;
      (arcGlow.material as THREE.SpriteMaterial).opacity = 0.35 * flicker;
      sparks.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Taladro cargando desde ayer                                         */
/* ------------------------------------------------------------------ */

export function drillCharging(): Device {
  const g = new THREE.Group();

  const dock = bx(0.34, 0.1, 0.4, C.ink);
  at(dock, 0, 0.05, 0);
  g.add(dock);
  const ledMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.8 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02, 0), ledMat);
  at(led, 0.12, 0.11, 0.16);
  led.castShadow = false;
  g.add(led);
  const glow = halo(C.save, 0.7, 0.3);
  at(glow, 0.12, 0.11, 0.16);
  g.add(glow);

  const drillBody = bx(0.16, 0.16, 0.34, C.coral);
  at(drillBody, 0, 0.2, -0.04);
  g.add(drillBody);
  const grip = bx(0.1, 0.28, 0.12, C.ink);
  at(grip, 0, 0.34, 0.06);
  grip.rotation.x = 0.18;
  g.add(grip);
  const battery = bx(0.14, 0.1, 0.16, C.ink);
  at(battery, 0, 0.12, 0.14);
  g.add(battery);

  const chuck = cl(0.05, 0.05, 0.1, 8, C.metal);
  at(chuck, 0, 0.2, -0.24, 0, Math.PI / 2);
  g.add(chuck);
  const bit = cl(0.015, 0.01, 0.22, 5, C.metal);
  at(bit, 0, 0.2, -0.38, 0, Math.PI / 2);
  g.add(bit);

  const cable = tube(
    [
      [0.14, 0.03, 0.16],
      [0.34, 0.02, 0.22],
      [0.5, 0.02, 0.3],
    ],
    0.014,
    C.ink,
  );
  g.add(cable);

  const set = (on: boolean) => {
    ledMat.emissiveIntensity = on ? 1.8 : 0;
    (glow.material as THREE.SpriteMaterial).opacity = on ? 0.3 : 0;
  };
  set(true);

  return { group: g, set };
}

/* ------------------------------------------------------------------ */
/* Esmeriladora de banco girando sola                                  */
/* ------------------------------------------------------------------ */

export function benchGrinder(): Device {
  const g = new THREE.Group();

  const pedestal = cl(0.12, 0.16, 0.85, 10, C.metalDark);
  at(pedestal, 0, 0.43, 0);
  g.add(pedestal);
  const baseFoot = cl(0.26, 0.3, 0.06, 10, C.ink);
  at(baseFoot, 0, 0.03, 0);
  g.add(baseFoot);

  const motor = cl(0.16, 0.16, 0.5, 10, C.forest);
  at(motor, 0, 0.94, 0, 0, Math.PI / 2);
  g.add(motor);

  const wheels: THREE.Mesh[] = [];
  for (const x of [-0.34, 0.34]) {
    const wheel = cl(0.15, 0.15, 0.07, 14, C.grayDark);
    at(wheel, x, 0.94, 0, 0, 0, 0);
    wheel.rotation.z = Math.PI / 2;
    g.add(wheel);
    wheels.push(wheel);
  }

  const guard = bx(0.3, 0.08, 0.12, C.metal);
  at(guard, -0.34, 1.08, 0);
  g.add(guard);

  const sparks = motes(3, C.fire, { spread: 0.16, depth: 0.12, speed: 1.6, rise: false, size: 0.022 });
  at(sparks.group, -0.34, 0.9, 0.12);
  g.add(sparks.group);

  let on = true;
  const set = (active: boolean) => {
    on = active;
    sparks.group.visible = active;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      if (!on) return;
      for (const w of wheels) w.rotation.y += dt * 14;
      sparks.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Torno (señuelo: trabajando de verdad)                               */
/* ------------------------------------------------------------------ */

export function latheMachine(): Device {
  const g = new THREE.Group();

  const bed = bx(1.5, 0.14, 0.4, C.metalDark);
  at(bed, 0, 0.86, 0);
  g.add(bed);
  for (const x of [-0.6, 0.6]) {
    const leg = bx(0.16, 0.8, 0.36, C.forest);
    at(leg, x, 0.4, 0);
    g.add(leg);
  }

  const head = bx(0.34, 0.4, 0.36, C.forest);
  at(head, -0.56, 1.1, 0);
  g.add(head);

  const chuck = cl(0.15, 0.15, 0.14, 10, C.metal);
  at(chuck, -0.32, 1.1, 0, 0, 0, Math.PI / 2);
  g.add(chuck);

  const work = cl(0.06, 0.06, 0.6, 8, C.wood);
  at(work, 0.05, 1.1, 0, 0, 0, Math.PI / 2);
  g.add(work);

  const tail = bx(0.16, 0.24, 0.28, C.forest);
  at(tail, 0.6, 1.06, 0);
  g.add(tail);

  const toolPost = bx(0.1, 0.22, 0.12, C.metal);
  at(toolPost, 0.05, 1.0, 0.22);
  g.add(toolPost);

  const chips = motes(4, C.wood, { spread: 0.14, depth: 0.1, speed: 1.1, rise: false, size: 0.028 });
  at(chips.group, 0.06, 1.0, 0.22);
  g.add(chips.group);

  let on = true;
  return {
    group: g,
    set: (active: boolean) => {
      on = active;
      chips.group.visible = active;
    },
    tick: (dt, t) => {
      if (!on) return;
      chuck.rotation.z += dt * 6;
      work.rotation.z += dt * 6;
      chips.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Horno de secado abierto y vacío                                     */
/* ------------------------------------------------------------------ */

export function dryingOven(): Device {
  const g = new THREE.Group();

  const body = bx(1.0, 1.2, 0.7, C.metalDark);
  at(body, 0, 0.6, 0);
  g.add(body);
  const bodyTop = bx(1.04, 0.06, 0.74, C.metal);
  at(bodyTop, 0, 1.22, 0);
  g.add(bodyTop);

  const cavityMat = matUnique(0x2a1a12, { emissive: C.fire, emissiveIntensity: 1.2 });
  const cavity = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.72), cavityMat);
  at(cavity, 0, 0.68, 0.36);
  cavity.castShadow = false;
  g.add(cavity);

  const racks = new THREE.Group();
  for (let i = 0; i < 2; i += 1) {
    const rack = bx(0.72, 0.03, 0.5, C.metal);
    at(rack, 0, 0.5 + i * 0.34, 0.08);
    racks.add(rack);
  }
  g.add(racks);

  const hinge = new THREE.Group();
  at(hinge, -0.5, 0.68, 0.36);
  g.add(hinge);
  const door = bx(0.98, 0.9, 0.07, C.metalDark);
  at(door, 0.49, 0, 0);
  hinge.add(door);
  const windowMat = matUnique(C.fire, { emissive: C.fire, emissiveIntensity: 0.8, transparent: true, opacity: 0.75 });
  const doorWin = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.3), windowMat);
  at(doorWin, 0.49, 0.18, 0.045);
  doorWin.castShadow = false;
  hinge.add(doorWin);
  const handle = bx(0.4, 0.06, 0.06, C.ink);
  at(handle, 0.49, -0.32, 0.06);
  hinge.add(handle);

  const heat = motes(5, C.fire, { spread: 0.6, depth: 0.3, speed: 0.35, rise: true, size: 0.05 });
  at(heat.group, 0, 0.5, 0.45);
  g.add(heat.group);

  const ledMat = matUnique(C.save, { emissive: C.save, emissiveIntensity: 1.4 });
  const led = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02, 0), ledMat);
  at(led, 0.4, 1.06, 0.37);
  led.castShadow = false;
  g.add(led);

  let target = -0.9;
  let current = -0.9;
  hinge.rotation.y = current;

  const set = (on: boolean) => {
    target = on ? -0.9 : 0;
    cavityMat.emissiveIntensity = on ? 1.2 : 0.05;
    heat.group.visible = on;
    ledMat.emissiveIntensity = on ? 1.4 : 0;
    windowMat.emissiveIntensity = on ? 0.8 : 0.05;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt, t) => {
      current += (target - current) * Math.min(1, dt * 3.5);
      hinge.rotation.y = current;
      if (heat.group.visible) heat.tick(dt, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Extractor de pared                                                  */
/* ------------------------------------------------------------------ */

export function extractorFan(): Device {
  const g = new THREE.Group();

  const housing = cl(0.36, 0.36, 0.18, 12, C.metalDark);
  at(housing, 0, 0, 0, 0, Math.PI / 2);
  g.add(housing);

  const grill = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1 + i * 0.09, 0.012, 4, 16), mat(C.metal));
    at(ring, 0, 0, 0.1);
    grill.add(ring);
  }
  g.add(grill);

  const blades = new THREE.Group();
  at(blades, 0, 0, 0.06);
  for (let i = 0; i < 4; i += 1) {
    const blade = bx(0.22, 0.04, 0.02, C.gray);
    at(blade, 0.11, 0, 0);
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / 4) * Math.PI * 2;
    pivot.add(blade);
    blades.add(pivot);
  }
  g.add(blades);

  let on = true;
  return {
    group: g,
    set: (active: boolean) => {
      on = active;
    },
    tick: (dt) => {
      if (!on) return;
      blades.rotation.z += dt * 12;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Lámpara industrial colgante                                         */
/* ------------------------------------------------------------------ */

export function industrialLamp(cord = 0.8): Device {
  const g = new THREE.Group();

  const cordMesh = cl(0.015, 0.015, cord, 4, C.ink);
  at(cordMesh, 0, cord / 2, 0);
  g.add(cordMesh);

  const shadeMat = matUnique(C.metalDark, { emissive: C.sun, emissiveIntensity: 0, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.3, 10, 1, true), shadeMat);
  at(shade, 0, -0.14, 0, 0, Math.PI);
  shade.castShadow = true;
  g.add(shade);

  const bulbMat = matUnique(C.cream, { emissive: C.sun, emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), bulbMat);
  at(bulb, 0, -0.24, 0);
  g.add(bulb);

  const glow = halo(C.sun, 1.5, 0);
  at(glow, 0, -0.24, 0);
  g.add(glow);

  const coneMat = new THREE.MeshBasicMaterial({
    color: C.sun,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.6, 12, 1, true), coneMat);
  at(cone, 0, -0.95, 0);
  cone.castShadow = false;
  g.add(cone);

  const set = (on: boolean) => {
    shadeMat.emissiveIntensity = on ? 0.25 : 0;
    bulbMat.emissiveIntensity = on ? 1.8 : 0;
    (glow.material as THREE.SpriteMaterial).opacity = on ? 0.32 : 0;
    coneMat.opacity = on ? 0.06 : 0;
  };
  set(true);

  return { group: g, set };
}

/* ------------------------------------------------------------------ */
/* Banco de trabajo                                                    */
/* ------------------------------------------------------------------ */

export function workbench(w = 2.4, h = 0.98, d = 0.9): THREE.Group {
  const g = new THREE.Group();
  const top = bx(w, 0.1, d, C.wood);
  at(top, 0, h, 0);
  g.add(top);
  for (const [x, z] of [
    [-w / 2 + 0.12, -d / 2 + 0.12],
    [w / 2 - 0.12, -d / 2 + 0.12],
    [-w / 2 + 0.12, d / 2 - 0.12],
    [w / 2 - 0.12, d / 2 - 0.12],
  ]) {
    const leg = bx(0.1, h, 0.1, C.woodDark);
    at(leg, x, h / 2, z);
    g.add(leg);
  }
  const lower = bx(w - 0.3, 0.06, d - 0.2, C.woodDark);
  at(lower, 0, 0.3, 0);
  g.add(lower);
  return g;
}

/* ------------------------------------------------------------------ */
/* Puerta entreabierta                                                 */
/* ------------------------------------------------------------------ */

export function openDoor(): Device {
  const g = new THREE.Group();

  const frame = bx(1.16, 2.2, 0.14, C.woodDark);
  at(frame, 0, 1.1, 0);
  g.add(frame);
  const hole = bx(1.0, 2.06, 0.16, C.ink);
  at(hole, 0, 1.09, 0.01);
  g.add(hole);

  const hinge = new THREE.Group();
  at(hinge, -0.5, 1.06, 0.09);
  g.add(hinge);
  const leaf = bx(0.98, 2.04, 0.07, C.wood);
  at(leaf, 0.49, 0, 0);
  hinge.add(leaf);
  const knob = sp(0.05, C.sun);
  at(knob, 0.9, 0, 0.06);
  hinge.add(knob);
  for (const y of [-0.55, 0.55]) {
    const panel = bx(0.7, 0.7, 0.02, C.woodDark);
    at(panel, 0.49, y, 0.045);
    hinge.add(panel);
  }

  let target = -1.15;
  let current = -1.15;
  hinge.rotation.y = current;

  const set = (open: boolean) => {
    target = open ? -1.15 : 0;
  };
  set(true);

  return {
    group: g,
    set,
    tick: (dt) => {
      current += (target - current) * Math.min(1, dt * 4);
      hinge.rotation.y = current;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Tablero de herramientas                                             */
/* ------------------------------------------------------------------ */

export function pegboard(w = 2.2, h = 1.2): THREE.Group {
  const g = new THREE.Group();
  const board = bx(w, h, 0.06, C.sand);
  g.add(board);
  const colors = [C.coral, C.sky, C.sun, C.terracotta, C.purple];
  for (let i = 0; i < 5; i += 1) {
    const tool = bx(0.08, 0.3 + (i % 3) * 0.12, 0.05, colors[i]);
    at(tool, -w / 2 + 0.3 + i * 0.4, h / 2 - 0.32, 0.06);
    g.add(tool);
  }
  for (let i = 0; i < 4; i += 1) {
    const peg = cl(0.03, 0.03, 0.04, 6, C.woodDark);
    at(peg, -w / 2 + 0.3 + i * 0.4, h / 2 - 0.12, 0.06, 0, Math.PI / 2);
    g.add(peg);
  }
  return g;
}
