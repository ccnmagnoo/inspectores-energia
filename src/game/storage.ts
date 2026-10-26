const KEY = 'detectives-energia:v1';

export type LevelProgress = {
  stars: number;
  best: number;
  done: boolean;
};

export type SaveData = {
  version: 1;
  levels: Record<string, LevelProgress>;
  muted: boolean;
  music: boolean;
  hintsSeen: boolean;
};

const fallback = (): SaveData => ({
  version: 1,
  levels: {},
  muted: false,
  music: true,
  hintsSeen: false,
});

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      version: 1,
      levels: (parsed.levels ?? {}) as Record<string, LevelProgress>,
      muted: Boolean(parsed.muted),
      music: parsed.music !== false,
      hintsSeen: Boolean(parsed.hintsSeen),
    };
  } catch {
    return fallback();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}

export function resetSave(): SaveData {
  const fresh = fallback();
  writeSave(fresh);
  return fresh;
}
