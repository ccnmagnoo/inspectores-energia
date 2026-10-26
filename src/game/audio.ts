export type SfxName = 'pop' | 'click' | 'correct' | 'wrong' | 'whoosh' | 'fanfare' | 'star';

const CHORDS: number[][] = [
  [261.63, 329.63, 392.0, 523.25], // C
  [220.0, 261.63, 329.63, 440.0], // Am
  [174.61, 220.0, 261.63, 349.23], // F
  [196.0, 246.94, 293.66, 392.0], // G
];

const EIGHTH = 60 / 84 / 2;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private musicRequested = true;
  private muted = false;

  get ready(): boolean {
    return this.ctx !== null;
  }

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.7;
    master.connect(ctx.destination);
    this.master = master;

    const music = ctx.createGain();
    music.gain.value = this.musicRequested && !this.muted ? 0.16 : 0;
    music.connect(master);
    this.musicBus = music;

    const sfx = ctx.createGain();
    sfx.gain.value = 0.5;
    sfx.connect(master);
    this.sfxBus = sfx;

    this.nextTime = ctx.currentTime + 0.15;
    this.startMusic();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.7, now + 0.12);
  }

  setMusic(on: boolean): void {
    this.musicRequested = on;
    if (!this.musicBus || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.linearRampToValueAtTime(on && !this.muted ? 0.16 : 0, now + 0.2);
  }

  private startMusic(): void {
    if (this.timer !== null) return;
    this.timer = window.setInterval(() => this.scheduleMusic(), 30);
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    while (this.nextTime < ctx.currentTime + 0.22) {
      const chord = CHORDS[Math.floor(this.step / 8) % CHORDS.length];
      const idx = this.step % 8;
      const note = chord[[0, 2, 1, 3, 2, 1, 3, 0][idx]];
      this.blip(note * 2, this.nextTime, 0.9, 0.1, 'triangle');

      if (idx === 0) {
        this.blip(chord[0] / 2, this.nextTime, 1.6, 0.14, 'sine');
      }
      this.step += 1;
      this.nextTime += EIGHTH;
    }
  }

  private blip(
    freq: number,
    time: number,
    dur: number,
    peak: number,
    type: OscillatorType,
    destination?: AudioNode,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const bus = destination ?? this.musicBus;
    if (!bus) return;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.6;

    const gain = ctx.createGain();
    const attack = Math.min(0.08, dur * 0.25);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bus);

    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private tone(freq: number, start: number, dur: number, peak: number, type: OscillatorType): void {
    this.blip(freq, start, dur, peak, type, this.sfxBus ?? undefined);
  }

  sfx(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.muted) return;
    const t = ctx.currentTime + 0.005;

    switch (name) {
      case 'pop':
        this.tone(520, t, 0.09, 0.18, 'sine');
        this.tone(780, t + 0.04, 0.08, 0.1, 'sine');
        break;
      case 'click':
        this.tone(180, t, 0.06, 0.22, 'square');
        this.tone(120, t + 0.02, 0.05, 0.12, 'triangle');
        break;
      case 'correct':
        [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, t + i * 0.07, 0.28, 0.2, 'triangle'));
        break;
      case 'wrong':
        this.tone(320, t, 0.16, 0.18, 'sine');
        this.tone(240, t + 0.1, 0.2, 0.16, 'sine');
        break;
      case 'whoosh':
        this.tone(880, t, 0.22, 0.1, 'sine');
        this.tone(1320, t + 0.06, 0.2, 0.07, 'sine');
        break;
      case 'star':
        this.tone(1046.5, t, 0.2, 0.16, 'triangle');
        this.tone(1318.5, t + 0.08, 0.24, 0.13, 'triangle');
        break;
      case 'fanfare':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this.tone(f, t + i * 0.11, 0.42, 0.2, 'triangle'),
        );
        this.tone(261.63, t, 1.2, 0.12, 'sine');
        break;
    }
  }
}

export const sound = new SoundEngine();
