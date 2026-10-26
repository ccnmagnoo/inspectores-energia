import * as THREE from 'three';
import { C } from '../art/palette';
import { at, bigWindow, bx, chair, mergeTicks, plant, roomBase, rug } from '../art/props';
import type { Device } from '../art/props';
import {
  cafeTable,
  displayCase,
  drinksFridge,
  espressoMachine,
  heaterUnit,
  menuBoard,
  neonSign,
  pendantLamp,
  phoneCharging,
  posRegister,
  sinkUnit,
  standFan,
} from '../art/cafe';
import { shelfUnit, counterRun, deskLamp } from '../art/props';
import type { LevelContent, LevelDef } from '../game/types';
import { makeKit } from './kit';

const W = 12;
const D = 10;

function build(): LevelContent {
  const k = makeKit();

  k.put(roomBase(W, D, { floor: C.creamDark, side: C.woodDark, wall: C.cream, trim: C.wood }), 0, 0, 0);

  /* ---------------- Barra ---------------- */
  k.put(counterRun(8, 0.85, 1.06, C.terracotta), 0, 0, -4.25);
  k.put(shelfUnit(6.4, 0.9, 0.32, C.wood), 0, 2.15, -4.85);
  k.put(menuBoard().group, 4.85, 2.4, -4.9);
  k.put(bigWindow(2.4, 1.5), -5.86, 1.95, 2.2, Math.PI / 2);
  const register = posRegister();
  k.dev(register, 2.35, 1.08, -4.25);

  /* ---------------- Mobiliario ---------------- */
  k.put(rug(4.2, 3.2, C.olive), -2.2, 0, 2.6);
  k.put(rug(3.4, 2.8, C.sky), 1.8, 0, 2.2);

  const extraTable = cafeTable();
  k.put(extraTable.group, 1.8, 0, 2.2);
  k.devices.push(extraTable);
  for (const x of [1.0, 2.6]) {
    k.put(chair(C.terracotta), x, 0, 2.2, x < 1.8 ? Math.PI / 2 : -Math.PI / 2);
  }

  k.dev(plant(1.1, C.leaf), 5.35, 0, 3.5);
  k.dev(plant(0.9, C.olive), -5.2, 0, -0.4);

  /* ---------------- Hallazgos ---------------- */

  // 1. Cafetera espresso encendida con la jarra vacía
  const espresso = k.dev(espressoMachine(), -2.2, 1.08, -4.25);
  k.add(
    {
      id: 'cafe-espresso',
      name: 'Cafetera espresso',
      isWaste: true,
      tip: 'Apagar la cafetera cuando la jarra está vacía evita calentar de más.',
      hint: 'La máquina sigue encendida y su jarra está vacía.',
    },
    espresso.group,
    () => espresso.set(false),
  );

  // 2. Vitrina refrigerada abierta
  const showcase = k.dev(displayCase(), 0.7, 1.08, -4.25);
  k.add(
    {
      id: 'cafe-case',
      name: 'Vitrina refrigerada',
      isWaste: true,
      tip: 'Cada vez que queda abierta, el frío de la vitrina se escapa.',
      hint: 'Mira la puerta de vidrio de la vitrina: quedó abierta.',
    },
    showcase.group,
    () => showcase.set(false),
  );

  // 3. Luces del techo encendidas de día
  const pendantGroup = new THREE.Group();
  const rail = bx(6.4, 0.06, 0.06, C.ink);
  at(rail, 0, 0.9, 0);
  pendantGroup.add(rail);
  // La barra va sujeta a la pared del fondo con dos brazos cortos.
  for (const x of [-3.0, 3.0]) {
    pendantGroup.add(at(bx(0.06, 0.06, 0.52, C.ink), x, 0.9, -0.26));
    pendantGroup.add(at(bx(0.18, 0.18, 0.05, C.ink), x, 0.9, -0.5));
  }
  const pendants: Device[] = [];
  for (const x of [-2.4, 0, 2.4]) {
    const p = pendantLamp(0.9);
    at(p.group, x, 0, 0);
    pendantGroup.add(p.group);
    pendants.push(p);
  }
  k.put(pendantGroup, 0, 2.1, -4.55);
  k.devices.push({
    group: pendantGroup,
    set: (on) => pendants.forEach((p) => p.set(on)),
  });
  k.add(
    {
      id: 'cafe-lights',
      name: 'Luces del techo',
      isWaste: true,
      tip: 'Con luz de día, apagar las luces del techo ahorra un montón.',
      hint: 'Afuera es de día y las lámparas del techo siguen encendidas.',
    },
    pendantGroup,
    () => pendants.forEach((p) => p.set(false)),
  );

  // 4. Ventilador y calefactor funcionando a la vez
  const climate = new THREE.Group();
  const fan = standFan();
  at(fan.group, 0, 0, 0);
  climate.add(fan.group);
  const heater = heaterUnit();
  at(heater.group, 0.15, 0, 1.35);
  climate.add(heater.group);
  k.put(climate, -5.0, 0, 0.6);
  k.devices.push({
    group: climate,
    set: (on) => {
      fan.set(on);
      heater.set(on);
    },
    tick: mergeTicks(fan.tick, heater.tick),
  });
  k.add(
    {
      id: 'cafe-climate',
      name: 'Ventilador y calefactor',
      isWaste: true,
      tip: 'Calentar y ventilar al mismo tiempo es energía que se pelea.',
      hint: 'Dos aparatos están haciendo trabajos opuestos al mismo tiempo.',
    },
    climate,
    () => {
      fan.set(false);
      heater.set(false);
    },
  );

  // 5. Grifo con agua caliente goteando
  const sink = k.dev(sinkUnit(), 3.45, 1.08, -4.25);
  k.add(
    {
      id: 'cafe-sink',
      name: 'Grifo del lavabo',
      isWaste: true,
      tip: 'Un grifo que gotea agua caliente gasta agua y energía a la vez.',
      hint: 'Escucha el lavabo: algo está cayendo y soltando vapor.',
    },
    sink.group,
    () => sink.set(false),
  );

  // 6. Letrero luminoso encendido de día
  const neon = k.dev(neonSign(), -5.86, 2.15, -1.4, Math.PI / 2);
  k.add(
    {
      id: 'cafe-neon',
      name: 'Letrero luminoso',
      isWaste: true,
      tip: 'Un letrero encendido de día se nota poco y gasta igual.',
      hint: 'Ese cartel brilla mucho… y afuera hay sol.',
    },
    neon.group,
    () => neon.set(false),
  );

  // 7. Señuelo: mesa con lámpara y servicio en uso
  const table = cafeTable();
  const lamp = deskLamp(C.sun);
  lamp.group.position.set(-0.18, 0.8, 0.02);
  table.group.add(lamp.group);
  const tableDev: Device = {
    group: table.group,
    set: (on) => lamp.set(on),
    tick: (dt, t) => lamp.tick?.(dt, t),
  };
  k.dev(tableDev, -2.2, 0, 2.6);
  k.put(chair(C.terracotta), -3.05, 0, 2.6, Math.PI / 2);
  k.put(chair(C.terracotta), -1.35, 0, 2.6, -Math.PI / 2);
  k.add(
    {
      id: 'cafe-table',
      name: 'Mesa con lámpara',
      isWaste: false,
      tip: 'La lámpara alumbra una mesa ocupada: está bien usada.',
      hint: 'En esa mesa hay café servido y una computadora abierta.',
    },
    table.group,
  );

  // 8. Señuelo: refrigerador de bebidas cerrado
  const drinks = k.dev(drinksFridge(), 5.1, 0, -3.2);
  k.add(
    {
      id: 'cafe-drinks',
      name: 'Refrigerador de bebidas',
      isWaste: false,
      tip: 'Un refrigerador bien cerrado hace su trabajo sin desperdiciar.',
      hint: 'Las bebidas están frías y la puerta está cerrada: todo en orden.',
    },
    drinks.group,
  );

  // 9. Señuelo: celular cargando en el mostrador
  const phone = k.dev(phoneCharging(), 1.55, 1.08, -4.25);
  k.add(
    {
      id: 'cafe-phone',
      name: 'Celular cargando',
      isWaste: false,
      tip: 'Cargar el celular es un uso necesario, no un desperdicio.',
      hint: 'Ese cable sí tiene un celular conectado y cargando.',
    },
    phone.group,
  );

  return k.content(W, D);
}

export const cafeLevel: LevelDef = {
  id: 'cafe',
  index: 1,
  name: 'La Cafetería',
  place: 'Café Roble',
  mission:
    'El café está abierto y hay varias cosas encendidas de más. Encuentra las seis ineficiencias.',
  greeting:
    '¡Bienvenido al café! El sol entra por la ventana… y aun así hay luces encendidas. ¿Las encuentras?',
  accent: '#b4794a',
  difficulty: 2,
  wasteCount: 6,
  decoyCount: 3,
  size: { w: W, d: D },
  build,
};
