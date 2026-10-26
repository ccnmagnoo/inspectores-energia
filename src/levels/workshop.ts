import * as THREE from 'three';
import { C } from '../art/palette';
import {
  at,
  bx,
  cardboardBox,
  cl,
  crate,
  deskLamp,
  plant,
  roomBase,
  sp,
  tableTop,
  tube,
} from '../art/props';
import type { Device } from '../art/props';
import {
  benchGrinder,
  compressorUnit,
  drillCharging,
  dryingOven,
  extractorFan,
  industrialLamp,
  latheMachine,
  openDoor,
  pegboard,
  welderUnit,
  workbench,
} from '../art/tools';
import type { LevelContent, LevelDef } from '../game/types';
import { makeKit } from './kit';

const W = 12;
const D = 11;

function build(): LevelContent {
  const k = makeKit();

  k.put(roomBase(W, D, { floor: 0xb9b3a8, side: C.woodDark, wall: C.creamDark, trim: C.wood }), 0, 0, 0);

  /* ---------------- Estructura ---------------- */
  k.put(pegboard(2.6, 1.3), 0.2, 2.15, -5.42);
  k.put(workbench(6.0, 0.98, 0.95), 0, 0, -4.85);

  // Tubería industrial sobre la pared del fondo (da altura sin tapar la escena).
  k.put(
    tube(
      [
        [-5.6, 2.78, -5.44],
        [-1.4, 2.78, -5.44],
        [1.4, 2.78, -5.44],
        [5.8, 2.78, -5.44],
      ],
      0.055,
      C.metalDark,
    ),
    0,
    0,
    0,
  );
  for (const x of [-4.4, 2.6]) {
    const flange = k.put(cl(0.09, 0.09, 0.16, 8, C.metalDark), x, 2.78, -5.4);
    flange.rotation.x = Math.PI / 2;
  }

  /* ---------------- Máquinas (decoración) ---------------- */
  k.dev(plant(1.0, C.olive), 5.3, 0, 4.7);

  k.put(crate(0.7, C.wood), 3.2, 0, 3.2);
  k.put(crate(0.55, C.olive), 3.9, 0, 2.9);
  k.put(cardboardBox(0.6), -5.2, 0, 4.4);
  k.put(cardboardBox(0.5), -4.7, 0, 4.7);

  const spool = cl(0.22, 0.22, 0.4, 10, C.metalDark);
  k.put(spool, -3.4, 0.22, 3.9);
  spool.rotation.z = Math.PI / 2;

  /* ---------------- Hallazgos ---------------- */

  // 1. Compresor con fuga de aire
  const compressor = k.dev(compressorUnit(), -5.0, 0, -4.4);
  k.add(
    {
      id: 'shop-compressor',
      name: 'Compresor de aire',
      isWaste: true,
      tip: 'Una fuga de aire obliga al compresor a trabajar el doble.',
      hint: 'Escucha: el aire se escapa por el extremo de la manguera.',
    },
    compressor.group,
    () => compressor.set(false),
  );

  // 2. Soldadora encendida sin usar
  const welder = k.dev(welderUnit(), 1.8, 0, -3.0);
  k.add(
    {
      id: 'shop-welder',
      name: 'Soldadora',
      isWaste: true,
      tip: 'Dejar la soldadora encendida sin usarla es energía que se va al aire.',
      hint: 'La soldadora sigue enchufada y con la luz encendida, sin nadie cerca.',
    },
    welder.group,
    () => welder.set(false),
  );

  // 3. Reflectores industriales encendidos sin gente
  const lampGroup = new THREE.Group();
  const lamps: Device[] = [];
  for (const x of [-3.2, 2.6]) {
    const l = industrialLamp(0.85);
    at(l.group, x, 2.2, -4.3);
    lampGroup.add(l.group);
    lamps.push(l);
  }
  lampGroup.add(at(bx(6.6, 0.07, 0.07, C.ink), -0.3, 3.05, -4.3));
  for (const x of [-2.8, 2.2]) {
    lampGroup.add(at(bx(0.06, 0.06, 1.15, C.ink), x, 3.05, -4.88));
  }
  k.put(lampGroup, 0, 0, 0);
  k.devices.push({ group: lampGroup, set: (on) => lamps.forEach((l) => l.set(on)) });
  k.add(
    {
      id: 'shop-lamps',
      name: 'Reflectores del techo',
      isWaste: true,
      tip: 'Apagar los reflectores cuando no hay nadie trabajando ahorra mucho.',
      hint: 'El taller está vacío y, aun así, todo está iluminado.',
    },
    lampGroup,
    () => lamps.forEach((l) => l.set(false)),
  );

  // 4. Taladro cargando desde ayer
  k.put(tableTop(1.0, 0.62, 0.86, C.wood), -5.0, 0, 1.7);
  const drill = k.dev(drillCharging(), -5.0, 0.9, 1.7);
  k.add(
    {
      id: 'shop-drill',
      name: 'Taladro cargando',
      isWaste: true,
      tip: 'Dejar el taladro cargando toda la noche desgasta la batería.',
      hint: 'Ese cargador lleva horas encendido con la batería ya completa.',
    },
    drill.group,
    () => drill.set(false),
  );

  // 5. Puerta abierta con el extractor encendido
  const draft = new THREE.Group();
  const door = openDoor();
  at(door.group, -5.92, 0, 3.3, Math.PI / 2);
  draft.add(door.group);
  const extractor = extractorFan();
  at(extractor.group, 5.2, 2.7, -5.38);
  draft.add(extractor.group);
  k.put(draft, 0, 0, 0);
  k.devices.push({
    group: draft,
    set: (on) => {
      door.set(on);
      extractor.set(on);
    },
    tick: extractor.tick,
  });
  k.add(
    {
      id: 'shop-draft',
      name: 'Puerta y extractor',
      isWaste: true,
      tip: 'Con la puerta abierta, el extractor tira aire que hay que recuperar.',
      hint: 'El extractor está funcionando… y la puerta del taller quedó abierta.',
    },
    draft,
    () => {
      door.set(false);
      extractor.set(false);
    },
  );

  // 6. Esmeriladora girando sola
  const grinder = k.dev(benchGrinder(), -4.4, 0, -1.6);
  k.add(
    {
      id: 'shop-grinder',
      name: 'Esmeriladora',
      isWaste: true,
      tip: 'Una máquina que gira sola solo gasta energía y hace ruido.',
      hint: 'Algo gira y chisporrotea sin que nadie lo esté usando.',
    },
    grinder.group,
    () => grinder.set(false),
  );

  // 7. Horno de secado abierto y vacío
  const oven = k.dev(dryingOven(), 5.1, 0, 1.3, -Math.PI / 2);
  k.add(
    {
      id: 'shop-oven',
      name: 'Horno de secado',
      isWaste: true,
      tip: 'Un horno abierto y vacío pierde todo el calor que produce.',
      hint: 'El horno está caliente, abierto y sin ninguna pieza adentro.',
    },
    oven.group,
    () => oven.set(false),
  );

  // 8. Señuelo: torno trabajando con una pieza
  const lathe = k.dev(latheMachine(), 4.3, 0, 0.2);
  k.add(
    {
      id: 'shop-lathe',
      name: 'Torno',
      isWaste: false,
      tip: 'El torno está trabajando una pieza: su energía se aprovecha.',
      hint: 'Ese torno tiene una pieza montada y virutas frescas debajo.',
    },
    lathe.group,
  );

  // 9. Señuelo: lámpara de trabajo sobre la pieza
  const benchLamp = new THREE.Group();
  const taskLamp = deskLamp(C.sun);
  at(taskLamp.group, 0, 1.03, 0);
  benchLamp.add(taskLamp.group);
  const piece = bx(0.4, 0.14, 0.22, C.wood);
  at(piece, 0.38, 1.1, 0.05);
  benchLamp.add(piece);
  const pieceTop = bx(0.34, 0.05, 0.16, C.woodDark);
  at(pieceTop, 0.38, 1.2, 0.05);
  benchLamp.add(pieceTop);
  const chips = sp(0.03, C.woodDark);
  at(chips, 0.52, 1.04, 0.16);
  benchLamp.add(chips);
  k.put(benchLamp, -1.9, 0, -4.75);
  k.devices.push({
    group: benchLamp,
    set: (on) => taskLamp.set(on),
    tick: (dt, t) => taskLamp.tick?.(dt, t),
  });
  k.add(
    {
      id: 'shop-tasklamp',
      name: 'Lámpara de trabajo',
      isWaste: false,
      tip: 'La lámpara ilumina una pieza en proceso: está bien usada.',
      hint: 'Esa lámpara apunta justo a la pieza que se está trabajando.',
    },
    benchLamp,
  );

  return k.content(W, D);
}

export const workshopLevel: LevelDef = {
  id: 'workshop',
  index: 2,
  name: 'El Taller',
  place: 'Taller Roble',
  mission:
    'El taller cerró por la tarde pero quedaron máquinas y luces encendidas. Encuentra las siete ineficiencias.',
  greeting:
    '¡Este taller es un desastre de energía! Herramientas encendidas, luces prendidas… ¿me ayudas?',
  accent: '#7c9c5a',
  difficulty: 3,
  wasteCount: 7,
  decoyCount: 2,
  size: { w: W, d: D },
  build,
};
