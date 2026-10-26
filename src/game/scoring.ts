export const POINTS_WASTE = 100;
export const POINTS_DECOY = 100;
export const PENALTY = 25;
export const STREAK_BONUS = 25;
export const MAX_STREAK_BONUS = 3;

export class Scoring {
  points = 0;
  streak = 0;
  bestStreak = 0;
  errors = 0;
  foundWaste = 0;
  decoysOk = 0;

  constructor(
    readonly wasteTotal: number,
    readonly decoysTotal: number,
  ) {}

  correctWaste(): number {
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.foundWaste += 1;
    const bonus = Math.min(this.streak - 1, MAX_STREAK_BONUS) * STREAK_BONUS;
    this.points += POINTS_WASTE + bonus;
    return POINTS_WASTE + bonus;
  }

  correctDecoy(): number {
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.decoysOk += 1;
    this.points += POINTS_DECOY;
    return POINTS_DECOY;
  }

  wrong(): number {
    this.streak = 0;
    this.errors += 1;
    const before = this.points;
    this.points = Math.max(0, this.points - PENALTY);
    return this.points - before;
  }

  get percent(): number {
    if (this.wasteTotal === 0) return 0;
    return Math.round((this.foundWaste / this.wasteTotal) * 100);
  }

  get complete(): boolean {
    return this.foundWaste >= this.wasteTotal;
  }

  get stars(): 1 | 2 | 3 {
    if (this.errors === 0) return 3;
    if (this.errors <= 2) return 2;
    return 1;
  }
}
