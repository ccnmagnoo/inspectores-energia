import * as THREE from 'three';

export type MatOpts = {
  rough?: number;
  metal?: number;
  flat?: boolean;
  transparent?: boolean;
  opacity?: number;
  emissive?: number;
  emissiveIntensity?: number;
  side?: THREE.Side;
};

const cache = new Map<string, THREE.MeshStandardMaterial>();

function build(color: number, o: MatOpts): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.88,
    metalness: o.metal ?? 0,
    flatShading: o.flat ?? true,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
  });
  if (o.emissive !== undefined) {
    m.emissive = new THREE.Color(o.emissive);
    m.emissiveIntensity = o.emissiveIntensity ?? 1;
  }
  return m;
}

/** Material compartido (cacheado). Nunca debe mutarse en tiempo de ejecución. */
export function mat(color: number, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = [
    color,
    o.rough,
    o.metal,
    o.flat,
    o.transparent,
    o.opacity,
    o.emissive,
    o.emissiveIntensity,
    o.side,
  ].join('|');
  const hit = cache.get(key);
  if (hit) return hit;
  const created = build(color, o);
  cache.set(key, created);
  return created;
}

/** Material exclusivo: se puede mutar (luces que se apagan, brillos, etc.). */
export function matUnique(color: number, o: MatOpts = {}): THREE.MeshStandardMaterial {
  return build(color, o);
}
