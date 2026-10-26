import * as THREE from 'three';
import type { Device } from '../art/props';
import type { Finding, FindingSpec, LevelContent } from '../game/types';

export function makeKit() {
  const root = new THREE.Group();
  const findings: Finding[] = [];
  const devices: Device[] = [];
  const tickers: ((dt: number, t: number) => void)[] = [];

  const put = <T extends THREE.Object3D>(obj: T, x: number, y: number, z: number, ry = 0): T => {
    obj.position.set(x, y, z);
    obj.rotation.y = ry;
    root.add(obj);
    const tick = obj.userData.tick;
    if (typeof tick === 'function') tickers.push(tick as (dt: number, t: number) => void);
    return obj;
  };

  const dev = <T extends Device>(d: T, x: number, y: number, z: number, ry = 0): T => {
    put(d.group, x, y, z, ry);
    devices.push(d);
    return d;
  };

  const add = (spec: FindingSpec, object: THREE.Object3D, fix?: () => void): Finding => {
    const f: Finding = { ...spec, object, fix };
    findings.push(f);
    return f;
  };

  const content = (w: number, d: number): LevelContent => ({
    root,
    findings,
    devices,
    size: { w, d },
    tickers,
  });

  return { root, findings, devices, put, dev, add, content };
}
