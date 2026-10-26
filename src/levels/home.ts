import * as THREE from 'three';
import { C } from '../art/palette';
import {
  chair,
  cl,
  counterRun,
  deskLamp,
  plant,
  roomBase,
  rug,
  shelfUnit,
  sofa,
  sp,
  tableTop,
  wallFrame,
} from '../art/props';
import {
  airConWindow,
  coffeeMaker,
  floorLamp,
  fridgeUnit,
  ironUnit,
  readingNook,
  tvUnit,
  wallCharger,
} from '../art/home';
import type { LevelContent, LevelDef } from '../game/types';
import { makeKit } from './kit';

const W = 11;
const D = 10;

function build(): LevelContent {
  const k = makeKit();

  k.put(roomBase(W, D, { floor: C.sand, side: C.woodDark, wall: C.cream, trim: C.wood }), 0, 0, 0);

  /* ---------------- Zona de estar ---------------- */
  k.put(rug(3.0, 3.0, C.terracotta), -3.9, 0, 1.5);
  k.put(sofa(C.olive), -4.55, 0, 1.5, Math.PI / 2);
  k.put(tableTop(1.2, 0.8, 0.42, C.wood), -3.3, 0, 1.5);

  k.put(wallFrame(0.9, 0.7, C.sky), -4.6, 2.15, -4.94);
  k.put(wallFrame(0.7, 0.55, C.sun), -3.4, 1.6, -4.94);

  const shelf = new THREE.Group();
  k.put(shelf, -5.28, 0, -2.9);
  shelf.rotation.y = Math.PI / 2;
  shelf.add(shelfUnit(1.3, 1.7, 0.34, C.wood));

  k.dev(plant(1, C.leaf), -5.0, 0, -4.4);
  k.dev(plant(0.9, C.olive), 5.0, 0, 2.4);

  /* ---------------- Comedor ---------------- */
  k.put(rug(2.9, 2.2, C.olive), 2.8, 0, 2.0);
  k.put(tableTop(1.8, 1.05, 0.74, C.wood), 2.8, 0, 2.0);
  k.put(cl(0.2, 0.16, 0.13, 10, C.coral), 2.8, 0.81, 2.0);
  k.put(sp(0.09, C.sun), 2.78, 0.9, 2.02);
  k.put(cl(0.07, 0.065, 0.11, 8, C.cream), 3.35, 0.85, 1.72);
  k.put(chair(C.terracotta), 2.8, 0, 1.0, 0);
  k.put(chair(C.terracotta), 2.8, 0, 3.0, Math.PI);

  /* ---------------- Cocina ---------------- */
  k.put(counterRun(3.6, 0.65, 0.94, C.forest), 2.35, 0, -4.6);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.04, 0.32),
    new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.9, flatShading: true }),
  );
  k.put(board, 1.15, 0.96, -4.6);
  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.11, 0.12, 10),
    new THREE.MeshStandardMaterial({ color: C.coral, roughness: 0.8, flatShading: true }),
  );
  k.put(bowl, 1.9, 0.99, -4.62);
  const fruit = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.08, 0),
    new THREE.MeshStandardMaterial({ color: C.sun, roughness: 0.7, flatShading: true }),
  );
  k.put(fruit, 1.88, 1.04, -4.6);

  /* ---------------- Hallazgos ---------------- */

  // 1. Lámpara de pie encendida sin nadie
  const lamp = k.dev(floorLamp(), -5.02, 0, 3.5);
  k.add(
    {
      id: 'home-lamp',
      name: 'Lámpara de pie',
      isWaste: true,
      tip: 'Apagar la luz al salir de un cuarto ahorra sin esfuerzo.',
      hint: 'Mira la lámpara de pie: alumbra una sala que está vacía.',
    },
    lamp.group,
    () => lamp.set(false),
  );

  // 2. Televisor en modo dormido
  const tv = k.dev(tvUnit(), -3.4, 0, -4.55);
  k.add(
    {
      id: 'home-tv',
      name: 'Televisor',
      isWaste: true,
      tip: 'Un aparato en espera sigue gastando aunque no lo veas.',
      hint: 'El televisor está apagado, pero esa lucecita roja no se apaga.',
    },
    tv.group,
    () => tv.set(false),
  );

  // 3. Cargador conectado sin celular
  const charger = k.dev(wallCharger(), -1.9, 0, -4.99);
  k.add(
    {
      id: 'home-charger',
      name: 'Cargador',
      isWaste: true,
      tip: 'Un cargador conectado sin celular sigue consumiendo.',
      hint: 'Sigue el cable del enchufe: no hay ningún aparato cargando.',
    },
    charger.group,
    () => charger.set(false),
  );

  // 4. Refrigerador con la puerta abierta
  const fridge = k.dev(fridgeUnit(), 4.7, 0, -3.85);
  k.add(
    {
      id: 'home-fridge',
      name: 'Refrigerador',
      isWaste: true,
      tip: 'Cerrar bien la puerta mantiene el frío adentro y cuida la energía.',
      hint: 'Algo está dejando escapar el frío en la cocina.',
    },
    fridge.group,
    () => fridge.set(false),
  );

  // 5. Ventana abierta con el aire acondicionado encendido
  const acWin = k.dev(airConWindow(), 0, 0, -5.0);
  k.add(
    {
      id: 'home-ac',
      name: 'Ventana y aire acondicionado',
      isWaste: true,
      tip: 'Si el aire acondicionado está encendido, la ventana debe estar cerrada.',
      hint: 'Dos cosas de la misma pared están haciendo fuerza contraria.',
    },
    acWin.group,
    () => acWin.set(false),
  );

  // 6. Plancha encendida y olvidada
  const iron = k.dev(ironUnit(), 0.9, 0, 3.3);
  k.add(
    {
      id: 'home-iron',
      name: 'Plancha',
      isWaste: true,
      tip: 'Apagar la plancha al terminar evita energía y también riesgos.',
      hint: 'Hay algo caliente encendido que nadie está usando.',
    },
    iron.group,
    () => iron.set(false),
  );

  // 7. Señuelo: mesa con libro y lámpara encendida (se está usando)
  const nook = readingNook(deskLamp(C.sun));
  k.put(nook.group, -4.62, 0, -1.4, Math.PI / 2);
  k.devices.push(nook);
  k.add(
    {
      id: 'home-nook',
      name: 'Mesa con libro y lámpara',
      isWaste: false,
      tip: 'Una luz encendida junto a alguien que lee está bien usada.',
      hint: 'Ahí hay un libro abierto y una taza caliente: la luz se está usando.',
    },
    nook.group,
  );

  // 8. Señuelo: cafetera con café listo
  const coffee = k.dev(coffeeMaker(), 3.2, 0.94, -4.6);
  k.add(
    {
      id: 'home-coffee',
      name: 'Cafetera',
      isWaste: false,
      tip: 'La cafetera está calentando café que sí se va a tomar.',
      hint: 'La jarra está llena y humeando: ese café se está usando.',
    },
    coffee.group,
  );

  return k.content(W, D);
}

export const homeLevel: LevelDef = {
  id: 'home',
  index: 0,
  name: 'La Vivienda',
  place: 'Casa de la familia Roble',
  mission:
    'Recorre la sala y la cocina. Toca cada objeto y decide si gasta energía de más o si está bien usado.',
  greeting:
    '¡Hola, detective! Esta casa gasta más de la cuenta. ¿Me ayudas a encontrar las seis pistas?',
  accent: '#d2703f',
  difficulty: 1,
  wasteCount: 6,
  decoyCount: 2,
  size: { w: W, d: D },
  build,
};
