import * as THREE from 'three';
import { mat } from '../art/materials';

type Particle = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  max: number;
  spin: THREE.Vector3;
  gravity: number;
};

const geo = new THREE.IcosahedronGeometry(1, 0);

export type BurstOpts = {
  count?: number;
  spread?: number;
  up?: number;
  size?: number;
  gravity?: number;
  life?: number;
};

/** Confeti low-poly: partículas simples con gravedad y desvanecido por escala. */
export class ParticleField {
  private items: Particle[] = [];
  private pool: THREE.Mesh[] = [];

  constructor(private readonly scene: THREE.Scene) {}

  burst(origin: THREE.Vector3, color: number, opts: BurstOpts = {}): void {
    const count = opts.count ?? 14;
    const spread = opts.spread ?? 0.9;
    const up = opts.up ?? 2.4;
    const size = opts.size ?? 0.075;
    const gravity = opts.gravity ?? 6;
    const life = opts.life ?? 1.1;

    for (let i = 0; i < count; i += 1) {
      const mesh = this.pool.pop() ?? new THREE.Mesh(geo, mat(color));
      mesh.material = mat(color, { emissive: color, emissiveIntensity: 0.35, rough: 0.6 });
      mesh.position.copy(origin);
      mesh.position.x += (Math.random() - 0.5) * 0.2;
      mesh.position.z += (Math.random() - 0.5) * 0.2;
      mesh.scale.setScalar(size * (0.7 + Math.random() * 0.7));
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = spread * (0.4 + Math.random() * 0.8);
      this.items.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * speed, up * (0.5 + Math.random()), Math.sin(angle) * speed),
        life,
        max: life,
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
        ),
        gravity,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.pool.push(p.mesh);
        this.items.splice(i, 1);
        continue;
      }
      p.vel.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
      p.mesh.rotation.z += p.spin.z * dt;
      const k = p.life / p.max;
      p.mesh.scale.multiplyScalar(1 - dt * 0.6);
      if (p.mesh.position.y < 0.02 && p.vel.y < 0) {
        p.mesh.position.y = 0.02;
        p.vel.multiplyScalar(0.4);
        p.vel.y = Math.abs(p.vel.y) * 0.3;
      }
      void k;
    }
  }

  clear(): void {
    for (const p of this.items) {
      this.scene.remove(p.mesh);
      this.pool.push(p.mesh);
    }
    this.items.length = 0;
  }
}
