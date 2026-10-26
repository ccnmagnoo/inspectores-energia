import * as THREE from 'three';
import { C } from '../art/palette';
import type { Finding, HudState, LevelDef, ResultPayload } from './types';
import { Scoring } from './scoring';
import { sound } from './audio';
import { ParticleField } from './particles';

const ELEVATION = THREE.MathUtils.degToRad(32);
const AZIMUTH = THREE.MathUtils.degToRad(45);

export type CompletionPayload = {
  points: number;
  stars: 1 | 2 | 3;
  errors: number;
  found: Finding[];
  decoysOk: number;
  decoysTotal: number;
};

export type GameCallbacks = {
  onHover: (info: { name: string; x: number; y: number } | null) => void;
  onInspect: (finding: Finding) => void;
  onResult: (payload: ResultPayload) => void;
  onProgress: (state: HudState) => void;
  onComplete: (payload: CompletionPayload) => void;
  onHintUsed: (finding: Finding, left: number) => void;
};

type Ripple = { mesh: THREE.Mesh; life: number; max: number; growth: number };

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private raycaster = new THREE.Raycaster();
  private particleField: ParticleField;

  private level: LevelDef | null = null;
  private levelRoot: THREE.Object3D | null = null;
  private findings: Finding[] = [];
  private resolved = new Set<string>();
  private pickables: THREE.Object3D[] = [];
  private scoring: Scoring | null = null;

  private tickers = new Set<(dt: number, t: number) => void>();
  private ripples: Ripple[] = [];
  private marker: THREE.Group;
  private markerPin!: THREE.Mesh;
  private markerRing!: THREE.Mesh;

  private pointer = new THREE.Vector2(0, 0);
  private pointerClient = { x: 0, y: 0 };
  private hasPointer = false;
  private hovered: Finding | null = null;
  private forced: Finding | null = null;
  private locked = false;
  private pending: Finding | null = null;

  private hints = 3;
  private time = 0;
  private clock = new THREE.Clock();
  private running = false;
  private rafId = 0;
  private completeToken = 0;

  private target = new THREE.Vector3(0, 1.1, 0);
  private panOffset = new THREE.Vector3();
  private panLimit = new THREE.Vector2(3, 3);
  private viewSize = 14;
  private aspect = 1;
  private zoomAnim: { from: number; to: number; t: number; dur: number } | null = null;

  private drag: { x: number; y: number; px: number; py: number; moved: boolean } | null = null;
  private activePointers = new Map<number, { x: number; y: number }>();
  private pinchStart = 0;
  private pinchZoom = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly cb: GameCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 200);
    this.scene.add(this.camera);

    this.setupLights();
    this.particleField = new ParticleField(this.scene);
    this.marker = this.buildMarker();
    this.scene.add(this.marker);

    window.addEventListener('resize', this.onResize);
    this.bindInput();
    this.resize();
  }

  /* ---------------------------------------------------------------- */
  /* Escena base                                                      */
  /* ---------------------------------------------------------------- */

  private setupLights(): void {
    const hemi = new THREE.HemisphereLight(0xfff6e6, 0x9a7a5c, 0.75);
    this.scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xfff1e0, 0.42);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff4e2, 2.05);
    sun.position.set(-11, 17, 13);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 3;
    const span = 16;
    sun.shadow.camera.left = -span;
    sun.shadow.camera.right = span;
    sun.shadow.camera.top = span;
    sun.shadow.camera.bottom = -span;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    this.scene.add(sun);
    this.scene.add(sun.target);

    const fill = new THREE.DirectionalLight(0xd8ecff, 0.35);
    fill.position.set(14, 9, -10);
    this.scene.add(fill);
  }

  private buildMarker(): THREE.Group {
    const g = new THREE.Group();

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.markerRing = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.44, 30), ringMat);
    this.markerRing.rotation.x = -Math.PI / 2;
    this.markerRing.castShadow = false;
    this.markerRing.receiveShadow = false;
    g.add(this.markerRing);

    const innerMat = new THREE.MeshBasicMaterial({
      color: C.sun,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), innerMat);
    inner.rotation.x = -Math.PI / 2;
    g.add(inner);

    this.markerPin = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshBasicMaterial({ color: C.sun }),
    );
    this.markerPin.castShadow = false;
    g.add(this.markerPin);

    g.visible = false;
    return g;
  }

  /* ---------------------------------------------------------------- */
  /* Carga de nivel                                                   */
  /* ---------------------------------------------------------------- */

  loadLevel(def: LevelDef): void {
    this.clearLevel();
    this.level = def;

    const content = def.build();
    this.scene.add(content.root);
    this.levelRoot = content.root;
    this.findings = content.findings;
    this.resolved.clear();
    this.pending = null;
    this.locked = false;
    this.hints = 3;
    this.completeToken += 1;

    for (const f of content.findings) {
      f.object.traverse((o) => {
        o.userData.findingId = f.id;
      });
    }
    this.pickables = content.findings.map((f) => f.object);

    for (const d of content.devices) {
      if (d.tick) {
        const t = d.tick;
        this.tickers.add(t);
      }
    }

    const wasteTotal = content.findings.filter((f) => f.isWaste).length;
    const decoyTotal = content.findings.length - wasteTotal;
    this.scoring = new Scoring(wasteTotal, decoyTotal);

    this.panLimit.set(content.size.w * 0.28, content.size.d * 0.28);
    this.panOffset.set(0, 0, 0);
    this.computeViewSize(content.size.w, content.size.d);
    this.camera.zoom = 0.78;
    this.zoomAnim = { from: 0.78, to: 1, t: 0, dur: 1.1 };
    this.updateProjection();
    this.updateCamera();
    this.emitProgress();

    this.time = 0;
    if (!this.running) this.start();
  }

  private computeViewSize(w: number, d: number): void {
    const diag = (w + d) / Math.SQRT2;
    const spanX = diag * 1.1;
    const spanY = diag * Math.sin(ELEVATION) + 4.2;
    this.viewSize = Math.max(spanY, spanX / this.aspect);
  }

  private clearLevel(): void {
    this.completeToken += 1;
    if (this.levelRoot) {
      this.scene.remove(this.levelRoot);
      this.disposeSubtree(this.levelRoot);
      this.levelRoot = null;
    }
    this.tickers.clear();
    this.particleField.clear();
    for (const r of this.ripples) {
      this.scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    }
    this.ripples.length = 0;
    this.findings = [];
    this.pickables = [];
    this.hovered = null;
    this.forced = null;
    this.marker.visible = false;
    this.level = null;
  }

  private disposeSubtree(root: THREE.Object3D): void {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const material of mats) {
          const anyMat = material as THREE.MeshStandardMaterial;
          if (anyMat.map) anyMat.map.dispose();
        }
      }
      const sp = o as THREE.Sprite;
      if (sp.isSprite && sp.material.map) sp.material.map.dispose();
    });
  }

  /* ---------------------------------------------------------------- */
  /* Bucle                                                            */
  /* ---------------------------------------------------------------- */

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  /** Detiene el bucle y descarga la escena actual (para volver al menú). */
  unload(): void {
    this.stop();
    this.clearLevel();
  }

  private loop = (): void => {
    if (!this.running) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;

    for (const t of this.tickers) t(dt, this.time);
    this.particleField.update(dt);
    this.updateRipples(dt);
    this.updateHover();
    this.updateMarker(dt);
    this.updateZoom(dt);
    this.updateCamera();

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private updateZoom(dt: number): void {
    if (!this.zoomAnim) return;
    const a = this.zoomAnim;
    a.t = Math.min(a.dur, a.t + dt);
    const k = a.t / a.dur;
    const eased = 1 - Math.pow(1 - k, 3);
    this.camera.zoom = a.from + (a.to - a.from) * eased;
    this.camera.updateProjectionMatrix();
    if (a.t >= a.dur) this.zoomAnim = null;
  }

  private updateCamera(): void {
    const tx = this.target.x + this.panOffset.x;
    const tz = this.target.z + this.panOffset.z;
    const dir = new THREE.Vector3(
      Math.cos(ELEVATION) * Math.cos(AZIMUTH),
      Math.sin(ELEVATION),
      Math.cos(ELEVATION) * Math.sin(AZIMUTH),
    );
    const look = new THREE.Vector3(tx, this.target.y, tz);
    this.camera.position.copy(look).addScaledVector(dir, 40);
    this.camera.lookAt(look);
  }

  private updateHover(): void {
    if (!this.hasPointer || this.locked || !this.level) {
      this.setHovered(null);
      return;
    }
    const f = this.pickAt(this.pointerClient.x, this.pointerClient.y);
    this.setHovered(f);
  }

  private setHovered(f: Finding | null): void {
    if (f === this.hovered) return;
    this.hovered = f;
    if (f) {
      this.cb.onHover({ name: f.name, x: this.pointerClient.x, y: this.pointerClient.y });
    } else {
      this.cb.onHover(null);
    }
  }

  private updateMarker(dt: number): void {
    const f = this.hovered ?? this.forced;
    if (!f) {
      this.marker.visible = false;
      return;
    }
    this.marker.visible = true;

    const box = new THREE.Box3().setFromObject(f.object);
    const center = box.getCenter(new THREE.Vector3());
    this.marker.position.set(center.x, box.min.y + 0.02, center.z);
    this.markerRing.rotation.z += dt * 0.7;
    this.markerPin.position.y = box.max.y - box.min.y + 0.4 + Math.sin(this.time * 3) * 0.07;
    this.markerPin.rotation.y += dt * 1.6;
  }

  private updateRipples(dt: number): void {
    for (let i = this.ripples.length - 1; i >= 0; i -= 1) {
      const r = this.ripples[i];
      r.life -= dt;
      if (r.life <= 0) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        (r.mesh.material as THREE.Material).dispose();
        this.ripples.splice(i, 1);
        continue;
      }
      const k = 1 - r.life / r.max;
      const s = 1 + k * r.growth;
      r.mesh.scale.setScalar(s);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - k);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Interacción                                                      */
  /* ---------------------------------------------------------------- */

  private bindInput(): void {
    const c = this.canvas;
    c.addEventListener('pointermove', this.onPointerMove);
    c.addEventListener('pointerdown', this.onPointerDown);
    c.addEventListener('pointerup', this.onPointerUp);
    c.addEventListener('pointercancel', this.onPointerUp);
    c.addEventListener('pointerleave', this.onPointerLeave);
    c.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerClient = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    this.pointer.set(
      (this.pointerClient.x / rect.width) * 2 - 1,
      -(this.pointerClient.y / rect.height) * 2 + 1,
    );
    this.hasPointer = true;

    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (this.activePointers.size === 2) {
      const pts = [...this.activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (this.pinchStart > 0) {
        const factor = dist / this.pinchStart;
        this.camera.zoom = THREE.MathUtils.clamp(this.pinchZoom * factor, 0.85, 2.4);
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    if (this.drag) {
      const dx = e.clientX - this.drag.px;
      const dy = e.clientY - this.drag.py;
      if (Math.abs(e.clientX - this.drag.x) > 6 || Math.abs(e.clientY - this.drag.y) > 6) {
        this.drag.moved = true;
      }
      if (this.drag.moved) {
        const scale = (this.viewSize / this.canvas.clientHeight) / this.camera.zoom;
        const right = new THREE.Vector3(1, 0, -1).normalize();
        const up = new THREE.Vector3(-1, 0, -1).normalize();
        this.panOffset.addScaledVector(right, -dx * scale);
        this.panOffset.addScaledVector(up, dy * scale);
        this.panOffset.x = THREE.MathUtils.clamp(this.panOffset.x, -this.panLimit.x, this.panLimit.x);
        this.panOffset.z = THREE.MathUtils.clamp(this.panOffset.z, -this.panLimit.y, this.panLimit.y);
        this.setHovered(null);
      }
      this.drag.px = e.clientX;
      this.drag.py = e.clientY;
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    sound.unlock();
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.activePointers.size === 2) {
      const pts = [...this.activePointers.values()];
      this.pinchStart = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.pinchZoom = this.camera.zoom;
      this.drag = null;
      return;
    }
    this.drag = { x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, moved: false };
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size < 2) this.pinchStart = 0;

    const wasClick = this.drag && !this.drag.moved;
    this.drag = null;
    if (!wasClick) return;

    const rect = this.canvas.getBoundingClientRect();
    const f = this.pickAt(e.clientX - rect.left, e.clientY - rect.top);
    if (f && !this.locked) {
      this.inspect(f);
    }
  };

  private onPointerLeave = (): void => {
    this.hasPointer = false;
    this.setHovered(null);
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const next = this.camera.zoom * Math.pow(0.9992, e.deltaY);
    this.camera.zoom = THREE.MathUtils.clamp(next, 0.85, 2.4);
    this.camera.updateProjectionMatrix();
  };

  private pickAt(x: number, y: number): Finding | null {
    if (!this.level) return null;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.findingId) o = o.parent;
      if (!o) continue;
      const id = o.userData.findingId as string;
      const f = this.findings.find((it) => it.id === id);
      if (f && !this.resolved.has(f.id)) return f;
    }
    return null;
  }

  /* ---------------------------------------------------------------- */
  /* API pública                                                      */
  /* ---------------------------------------------------------------- */

  inspect(f: Finding): void {
    if (this.resolved.has(f.id)) return;
    this.pending = f;
    this.locked = true;
    this.forced = f;
    this.marker.visible = true;
    sound.sfx('pop');
    this.cb.onInspect(f);
  }

  cancelInspect(): void {
    this.pending = null;
    this.locked = false;
    this.forced = null;
  }

  decide(saysWaste: boolean): void {
    const f = this.pending;
    const s = this.scoring;
    if (!f || !s) return;

    this.pending = null;
    this.locked = false;
    this.forced = null;

    const correct = saysWaste === f.isWaste;

    if (!correct) {
      const delta = s.wrong();
      sound.sfx('wrong');
      this.pulse(f.object, C.coral);
      this.cb.onResult({
        kind: 'wrong',
        message: f.hint,
        detail: f.name,
        delta,
      });
      this.emitProgress();
      return;
    }

    this.resolved.add(f.id);

    if (f.isWaste) {
      const delta = s.correctWaste();
      f.fix?.();
      this.sparkle(f.object);
      sound.sfx('correct');
      this.cb.onResult({
        kind: 'waste-ok',
        message: f.tip,
        detail: f.name,
        delta,
      });
    } else {
      const delta = s.correctDecoy();
      this.sparkle(f.object);
      sound.sfx('whoosh');
      this.cb.onResult({
        kind: 'decoy-ok',
        message: f.tip,
        detail: f.name,
        delta,
      });
    }

    this.emitProgress();

    if (s.complete) {
      const token = ++this.completeToken;
      window.setTimeout(() => {
        if (token !== this.completeToken || !this.level) return;
        sound.sfx('fanfare');
        this.cb.onComplete({
          points: s.points,
          stars: s.stars,
          errors: s.errors,
          found: this.findings.filter((it) => it.isWaste),
          decoysOk: s.decoysOk,
          decoysTotal: s.decoysTotal,
        });
      }, 1400);
    }
  }

  useHint(): void {
    if (!this.level || this.hints <= 0 || this.locked) return;
    const candidates = this.findings.filter((f) => f.isWaste && !this.resolved.has(f.id));
    if (candidates.length === 0) return;

    this.hints -= 1;
    const f = candidates[Math.floor(Math.random() * candidates.length)];
    const box = new THREE.Box3().setFromObject(f.object);
    const center = box.getCenter(new THREE.Vector3());

    const angle = Math.random() * Math.PI * 2;
    const dist = 1.6 + Math.random() * 1.2;
    const spot = new THREE.Vector3(
      center.x + Math.cos(angle) * dist,
      box.min.y + 0.03,
      center.z + Math.sin(angle) * dist,
    );

    this.rippleAt(spot, C.sun, 2.6);

    this.panOffset.x = THREE.MathUtils.clamp(
      this.panOffset.x * 0.4 + (center.x - this.target.x) * 0.55,
      -this.panLimit.x,
      this.panLimit.x,
    );
    this.panOffset.z = THREE.MathUtils.clamp(
      this.panOffset.z * 0.4 + (center.z - this.target.z) * 0.55,
      -this.panLimit.y,
      this.panLimit.y,
    );

    this.cb.onHintUsed(f, this.hints);
  }

  private emitProgress(): void {
    const state = this.hud;
    if (state) this.cb.onProgress(state);
  }

  get hud(): HudState | null {
    if (!this.level || !this.scoring) return null;
    return {
      place: this.level.place,
      found: this.scoring.foundWaste,
      wasteTotal: this.scoring.wasteTotal,
      points: this.scoring.points,
      percent: this.scoring.percent,
      streak: this.scoring.streak,
      hints: this.hints,
    };
  }

  /** Objetos que todavía no se resolvieron (para la lista accesible). */
  get openFindings(): Finding[] {
    return this.findings.filter((f) => !this.resolved.has(f.id));
  }

  highlight(findingId: string): void {
    const f = this.findings.find((it) => it.id === findingId);
    if (!f) return;
    this.forced = f;
    this.marker.visible = true;
  }

  clearHighlight(): void {
    this.forced = null;
  }

  /* ---------------------------------------------------------------- */
  /* Efectos                                                          */
  /* ---------------------------------------------------------------- */

  private sparkle(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    const p = box.getCenter(new THREE.Vector3());
    p.y = box.max.y + 0.2;
    this.particleField.burst(p, C.save, { count: 16, spread: 1.1, up: 2.8, size: 0.075 });
    this.particleField.burst(p, C.sun, { count: 8, spread: 0.8, up: 2.2, size: 0.055 });
  }

  private pulse(object: THREE.Object3D, color: number): void {
    const box = new THREE.Box3().setFromObject(object);
    const p = box.getCenter(new THREE.Vector3());
    p.y = box.min.y + 0.04;
    this.rippleAt(p, color, 1.4);
  }

  private rippleAt(pos: THREE.Vector3, color: number, growth: number): void {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 26), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    mesh.castShadow = false;
    this.scene.add(mesh);
    this.ripples.push({ mesh, life: 1.2, max: 1.2, growth });
  }

  /* ---------------------------------------------------------------- */
  /* Redimensionado                                                   */
  /* ---------------------------------------------------------------- */

  private onResize = (): void => {
    this.resize();
  };

  private resize(): void {
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth ?? window.innerWidth;
    const h = parent?.clientHeight ?? window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.aspect = w / Math.max(1, h);
    if (this.level) this.computeViewSize(this.level.size.w, this.level.size.d);
    this.updateProjection();
  }

  private updateProjection(): void {
    const halfH = this.viewSize / 2;
    const halfW = halfH * this.aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.clearLevel();
    this.renderer.dispose();
  }
}
