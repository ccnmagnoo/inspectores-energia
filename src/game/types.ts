import type * as THREE from 'three';
import type { Device } from '../art/props';

export type FindingSpec = {
  id: string;
  /** Nombre visible del objeto: "Lámpara de pie". */
  name: string;
  /** true = ineficiencia; false = señuelo bien usado. */
  isWaste: boolean;
  /** Frase-hábito que se muestra al acertar (≤ 90 caracteres). */
  tip: string;
  /** Pista amable que se muestra al equivocarse. */
  hint: string;
};

export type Finding = FindingSpec & {
  object: THREE.Object3D;
  /** Animación de corrección: solo las ineficiencias la tienen. */
  fix?: () => void;
};

export type LevelSize = { w: number; d: number };

export type LevelContent = {
  root: THREE.Group;
  findings: Finding[];
  devices: Device[];
  size: LevelSize;
  /** Animaciones continuas de decoración (paisaje, etc.). */
  tickers?: ((dt: number, t: number) => void)[];
};

export type LevelDef = {
  id: string;
  index: number;
  name: string;
  place: string;
  mission: string;
  greeting: string;
  /** Color de acento en CSS. */
  accent: string;
  difficulty: 1 | 2 | 3 | 4;
  /** Número de ineficiencias reales (para menús, sin construir la escena). */
  wasteCount: number;
  /** Número de señuelos bien usados. */
  decoyCount: number;
  size: LevelSize;
  build: () => LevelContent;
};

export type HudState = {
  place: string;
  found: number;
  wasteTotal: number;
  points: number;
  percent: number;
  streak: number;
  hints: number;
};

export type ResultKind = 'waste-ok' | 'decoy-ok' | 'wrong';

export type ResultPayload = {
  kind: ResultKind;
  message: string;
  detail: string;
  delta: number;
};

export type SummaryPayload = {
  levelId: string;
  levelName: string;
  points: number;
  stars: 1 | 2 | 3;
  errors: number;
  found: Finding[];
  decoysOk: number;
  decoysTotal: number;
  nextLevelId: string | null;
  isBest: boolean;
};
