import * as THREE from 'three';
import { C } from '../art/palette';
import { at, bx, chair, cl, plant, roomBase, roundTable, rug, sideboard } from '../art/props';
import type { Device } from '../art/props';
import { drinksFridge, neonSign, pendantLamp } from '../art/cafe';
import { coffeeMaker } from '../art/home';
import { coldRoom, dishwasherUnit, fryerUnit, hoodUnit, ovenUnit, serviceTable } from '../art/kitchen';
import type { LevelContent, LevelDef } from '../game/types';
import { makeKit } from './kit';

const W = 13;
const D = 11;

function build(): LevelContent {
  const k = makeKit();

  k.put(roomBase(W, D, { floor: 0xd9c3a6, side: C.woodDark, wall: C.cream, trim: C.wood }), 0, 0, 0);

  /* ---------------- Estructura ---------------- */
  k.put(bx(12.0, 0.16, 0.16, C.woodDark), 0, 3.2, 1.9);

  /* ---------------- Salón ---------------- */
  // Dos mesas redondas con sus sillas enfrentadas.
  for (const t of [
    { x: -4.2, z: 1.4 },
    { x: -0.4, z: 3.4 },
  ]) {
    k.put(rug(2.6, 2.4, C.terracotta), t.x, 0.004, t.z);
    k.put(roundTable(0.6, 0.74, C.wood), t.x, 0, t.z);
    k.put(cl(0.64, 0.64, 0.05, 14, C.cream), t.x, 0.79, t.z);
    k.put(cl(0.17, 0.17, 0.02, 12, C.white), t.x - 0.24, 0.83, t.z + 0.1);
    k.put(cl(0.17, 0.17, 0.02, 12, C.white), t.x + 0.24, 0.83, t.z - 0.1);
    k.put(chair(C.terracotta), t.x - 0.92, 0, t.z, Math.PI / 2);
    k.put(chair(C.terracotta), t.x + 0.92, 0, t.z, -Math.PI / 2);
  }
  // La tercera mesa es la que está servida (señuelo).
  k.put(chair(C.terracotta), 2.5, 0, 2.2, Math.PI / 2);
  k.put(chair(C.terracotta), 4.3, 0, 2.2, -Math.PI / 2);

  k.dev(plant(1.2, C.leaf), -6.0, 0, 4.6);
  k.dev(plant(1.0, C.olive), 6.0, 0, 4.4);

  /* ---------------- Hallazgos ---------------- */

  // 1. Horno al máximo sin comida
  const oven = k.dev(ovenUnit(), -2.4, 0, -4.85);
  k.add(
    {
      id: 'rest-oven',
      name: 'Horno',
      isWaste: true,
      tip: 'Un horno al máximo sin comida es calor que se va sin servir a nadie.',
      hint: 'El horno brilla naranja y está completamente vacío.',
    },
    oven.group,
    () => oven.set(false),
  );

  // 2. Cámara frigorífica con la puerta mal cerrada
  const cold = k.dev(coldRoom(), -6.28, 0, -2.2, Math.PI / 2);
  k.add(
    {
      id: 'rest-cold',
      name: 'Cámara frigorífica',
      isWaste: true,
      tip: 'La cámara pierde todo su frío si la puerta queda mal cerrada.',
      hint: 'Sale una nube de frío de la cámara: la puerta no cerró bien.',
    },
    cold.group,
    () => cold.set(false),
  );

  // 3. Lavaplatos a media carga
  const dishwasher = k.dev(dishwasherUnit(), 3.2, 0, -4.85);
  k.add(
    {
      id: 'rest-dishwasher',
      name: 'Lavaplatos',
      isWaste: true,
      tip: 'El lavaplatos gasta lo mismo lleno que a media carga.',
      hint: 'La puerta está abierta y adentro hay apenas dos platos.',
    },
    dishwasher.group,
    () => dishwasher.set(false),
  );

  // 4. Letrero de neón encendido de día
  const neon = k.dev(neonSign(), 4.8, 2.75, -5.44);
  k.add(
    {
      id: 'rest-neon',
      name: 'Letrero de neón',
      isWaste: true,
      tip: 'El neón encendido de día se pierde en la luz del sol y gasta igual.',
      hint: 'Ese cartel rosa brilla mucho… y todavía es de día.',
    },
    neon.group,
    () => neon.set(false),
  );

  // 5. Campana extractora encendida sin cocinar
  const hood = k.dev(hoodUnit(), -2.4, 2.05, -4.9);
  k.add(
    {
      id: 'rest-hood',
      name: 'Campana extractora',
      isWaste: true,
      tip: 'La campana extractora solo hace falta cuando se está cocinando.',
      hint: 'La campana zumba y aspira aire… pero el fuego está apagado.',
    },
    hood.group,
    () => hood.set(false),
  );

  // 6. Freidora encendida sin nada adentro
  const fryer = k.dev(fryerUnit(), 0.6, 0, -4.85);
  k.add(
    {
      id: 'rest-fryer',
      name: 'Freidora',
      isWaste: true,
      tip: 'Freír el aire no sirve: la freidora caliente y vacía solo gasta.',
      hint: 'El aceite burbujea sin nada que freír adentro.',
    },
    fryer.group,
    () => fryer.set(false),
  );

  // 7. Luces del salón encendidas sin comensales
  const diningGroup = new THREE.Group();
  const rail = bx(11.4, 0.06, 0.06, C.ink);
  at(rail, 0, 1.0, 0);
  diningGroup.add(rail);
  const pendants: Device[] = [];
  for (const x of [-4.2, -0.4, 3.4]) {
    const p = pendantLamp(1.0);
    at(p.group, x, 0, 0);
    diningGroup.add(p.group);
    pendants.push(p);
  }
  k.put(diningGroup, 0, 2.2, 1.9);
  k.devices.push({ group: diningGroup, set: (on) => pendants.forEach((p) => p.set(on)) });
  k.add(
    {
      id: 'rest-lights',
      name: 'Luces del salón',
      isWaste: true,
      tip: 'Un salón vacío no necesita todas sus luces encendidas.',
      hint: 'Las mesas están vacías y las lámparas del salón siguen prendidas.',
    },
    diningGroup,
    () => pendants.forEach((p) => p.set(false)),
  );

  // 8. Señuelo: refrigerador de bebidas cerrado
  const drinks = k.dev(drinksFridge(), 5.6, 0, -3.0);
  k.add(
    {
      id: 'rest-drinks',
      name: 'Refrigerador de bebidas',
      isWaste: false,
      tip: 'Un refrigerador bien cerrado hace su trabajo sin desperdiciar.',
      hint: 'Las bebidas están frías y la puerta está bien cerrada.',
    },
    drinks.group,
  );

  // 9. Señuelo: mesa montada y lista para servir
  const table = k.dev(serviceTable(), 3.4, 0, 2.2);
  k.add(
    {
      id: 'rest-table',
      name: 'Mesa servida',
      isWaste: false,
      tip: 'La mesa está preparada para servir: su luz tiene sentido.',
      hint: 'Esa mesa tiene platos, copas y una vela encendida: está en uso.',
    },
    table.group,
  );

  // 10. Señuelo: cafetera con café caliente listo
  k.put(sideboard(1.7, 0.85, 0.5, C.wood), 5.4, 0, 1.1);
  const coffee = k.dev(coffeeMaker(), 5.4, 0.87, 1.1);
  k.add(
    {
      id: 'rest-coffee',
      name: 'Cafetera',
      isWaste: false,
      tip: 'La cafetera tiene café caliente listo: se está usando.',
      hint: 'La jarra está llena y humeando: ese café se va a servir.',
    },
    coffee.group,
  );

  return k.content(W, D);
}

export const restaurantLevel: LevelDef = {
  id: 'restaurant',
  index: 3,
  name: 'El Restaurante',
  place: 'Restaurante Roble',
  mission:
    'El servicio terminó y la cocina quedó encendida. Encuentra las siete ineficiencias del restaurante.',
  greeting:
    '¡Buenas! La cocina está lista… pero hay demasiadas cosas encendidas para un solo turno. ¿Me echas una mano?',
  accent: '#9b7fb5',
  difficulty: 4,
  wasteCount: 7,
  decoyCount: 3,
  size: { w: W, d: D },
  build,
};
