import { Game } from '../game/Game';
import type { CompletionPayload } from '../game/Game';
import { sound } from '../game/audio';
import { loadSave, writeSave, resetSave } from '../game/storage';
import type { SaveData } from '../game/storage';
import type { Finding, HudState, LevelDef, ResultPayload } from '../game/types';
import { homeLevel } from '../levels/home';
import { cafeLevel } from '../levels/cafe';
import { workshopLevel } from '../levels/workshop';
import { restaurantLevel } from '../levels/restaurant';

const LEVELS: LevelDef[] = [homeLevel, cafeLevel, workshopLevel, restaurantLevel];

const DIFFICULTY = ['Fácil', 'Fácil', 'Medio', 'Difícil'];

const MASCOT = `
<svg class="mascot" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  <ellipse cx="50" cy="93" rx="23" ry="4.5" fill="rgba(90,60,30,.14)"/>
  <ellipse cx="50" cy="24" rx="27" ry="6.5" fill="#8A5533"/>
  <path d="M32 24c0-10 8-17 18-17s18 7 18 17z" fill="#B4794A"/>
  <circle cx="50" cy="45" r="28" fill="#FFC94D"/>
  <circle cx="50" cy="45" r="28" fill="none" stroke="#E0A62E" stroke-width="2" opacity=".45"/>
  <circle cx="39" cy="34" r="8" fill="#FFF3D0" opacity=".7"/>
  <rect x="38" y="69" width="24" height="7" rx="3" fill="#B9C0C7"/>
  <rect x="39" y="77" width="22" height="6" rx="3" fill="#9AA0A6"/>
  <rect x="41" y="84" width="18" height="5" rx="2.5" fill="#7D858C"/>
  <circle cx="42" cy="48" r="4" fill="#33352F"/>
  <circle cx="58" cy="48" r="4" fill="#33352F"/>
  <circle cx="43.4" cy="46.6" r="1.3" fill="#fff"/>
  <circle cx="59.4" cy="46.6" r="1.3" fill="#fff"/>
  <path d="M43 58c2 3.2 4.6 4.8 7 4.8s5-1.6 7-4.8" fill="none" stroke="#33352F" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="77" cy="61" r="10.5" fill="rgba(191,217,230,.5)" stroke="#B4794A" stroke-width="3.4"/>
  <path d="M84.5 68.5l6.5 7.5" stroke="#B4794A" stroke-width="4.4" stroke-linecap="round"/>
</svg>`;

function q<T extends Element>(root: ParentNode, sel: string): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento no encontrado: ${sel}`);
  return el;
}

function starRow(count: number, size = ''): string {
  const stars = [0, 1, 2]
    .map((i) => `<span class="${i < count ? '' : 'off'}">★</span>`)
    .join('');
  return `<span class="stars ${size}" aria-label="${count} de 3 estrellas">${stars}</span>`;
}

export class App {
  private save: SaveData;
  private game: Game;
  private current: LevelDef | null = null;
  private muted: boolean;
  private toastTimer = 0;

  private ui: HTMLElement;
  private screens: Record<string, HTMLElement>;
  private els: {
    grid: HTMLElement;
    intro: HTMLElement;
    summaryCard: HTMLElement;
    hudPlace: HTMLElement;
    hudDot: HTMLElement;
    hudFound: HTMLElement;
    hudPoints: HTMLElement;
    hudPct: HTMLElement;
    hudFill: HTMLElement;
    hintBtn: HTMLButtonElement;
    hintCount: HTMLElement;
    soundBtn: HTMLButtonElement;
    inspect: HTMLElement;
    inspectName: HTMLElement;
    scrim: HTMLElement;
    tooltip: HTMLElement;
    toast: HTMLElement;
    toastIcon: HTMLElement;
    toastTitle: HTMLElement;
    toastMsg: HTMLElement;
    toastDelta: HTMLElement;
    a11y: HTMLElement;
  };

  constructor(root: HTMLElement, canvas: HTMLCanvasElement) {
    this.save = loadSave();
    this.muted = this.save.muted;
    this.ui = root;
    this.ui.innerHTML = this.buildShell();

    this.screens = {
      menu: q(this.ui, '#screen-menu'),
      intro: q(this.ui, '#screen-intro'),
      game: q(this.ui, '#screen-game'),
      summary: q(this.ui, '#screen-summary'),
    };

    this.els = {
      grid: q(this.ui, '#level-grid'),
      intro: q(this.ui, '#intro-card'),
      summaryCard: q(this.ui, '#summary-card'),
      hudPlace: q(this.ui, '#hud-place'),
      hudDot: q(this.ui, '#hud-dot'),
      hudFound: q(this.ui, '#hud-found'),
      hudPoints: q(this.ui, '#hud-points'),
      hudPct: q(this.ui, '#hud-pct'),
      hudFill: q(this.ui, '#hud-fill'),
      hintBtn: q<HTMLButtonElement>(this.ui, '#btn-hint'),
      hintCount: q(this.ui, '#hint-count'),
      soundBtn: q<HTMLButtonElement>(this.ui, '#btn-sound'),
      inspect: q(this.ui, '#inspect'),
      inspectName: q(this.ui, '#inspect-name'),
      scrim: q(this.ui, '#scrim'),
      tooltip: q(this.ui, '#tooltip'),
      toast: q(this.ui, '#toast'),
      toastIcon: q(this.ui, '#toast-icon'),
      toastTitle: q(this.ui, '#toast-title'),
      toastMsg: q(this.ui, '#toast-msg'),
      toastDelta: q(this.ui, '#toast-delta'),
      a11y: q(this.ui, '#a11y-list'),
    };

    this.game = new Game(canvas, {
      onHover: (info) => this.onHover(info),
      onInspect: (f) => this.onInspect(f),
      onResult: (r) => this.onResult(r),
      onProgress: (s) => this.onProgress(s),
      onComplete: (c) => this.onComplete(c),
      onHintUsed: (f, left) => this.onHintUsed(f, left),
    });

    this.bind();
    this.updateSoundButton();
    this.renderMenu();
    this.showScreen('menu');

    // Enlaces directos: ?level=home&play=1
    const params = new URLSearchParams(window.location.search);
    const deep = params.get('level');
    if (deep) {
      const level = LEVELS.find((l) => l.id === deep);
      if (level) {
        this.openIntro(level);
        if (params.get('play') === '1') this.startLevel(level);
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Estructura                                                       */
  /* ---------------------------------------------------------------- */

  private buildShell(): string {
    return `
      <section class="screen" id="screen-menu" aria-label="Menú principal">
        <div class="menu">
          <header class="brand">
            <div class="brand__row">
              ${MASCOT}
              <h1>Detectives de la <em>Energía</em></h1>
            </div>
            <p class="tagline">Encuentra lo que gasta de más, corrígelo y devuélvele energía al lugar. Cuatro escenarios, muchas pistas y cero números difíciles.</p>
          </header>
          <div class="level-grid" id="level-grid"></div>
          <footer class="menu__footer">
            <span>Para jugar en familia o en clase · 10 a 15 minutos</span>
            <button class="link-btn" id="reset-progress">Reiniciar progreso</button>
          </footer>
        </div>
      </section>

      <section class="screen" id="screen-intro" aria-label="Presentación del lugar">
        <div class="intro">
          <div class="intro-card" id="intro-card"></div>
        </div>
      </section>

      <section class="screen" id="screen-game" aria-label="Juego">
        <div class="hud">
          <div class="hud__top">
            <div class="hud__group">
              <span class="pill"><span class="pill__dot" id="hud-dot"></span><span id="hud-place">Lugar</span></span>
              <span class="pill">
                <span class="pill__label">Ineficiencias</span>
                <span class="pill__value" id="hud-found">0/0</span>
              </span>
            </div>
            <div class="meter" role="group" aria-label="Medidor de ahorro">
              <div class="meter__row"><span>Ahorro</span><span class="meter__pct" id="hud-pct">0%</span></div>
              <div class="meter__track"><div class="meter__fill" id="hud-fill"></div></div>
            </div>
            <div class="hud__group">
              <span class="pill pill--score">
                <span class="pill__label">Puntos</span>
                <span class="pill__value" id="hud-points">0</span>
              </span>
            </div>
          </div>
          <div class="hud__bottom">
            <button class="btn hint-btn" id="btn-hint" type="button">
              <span aria-hidden="true">💡</span> Pista
              <span class="hint-btn__count" id="hint-count">3</span>
            </button>
            <div class="tools">
              <button class="icon-btn" id="btn-sound" type="button" aria-label="Silenciar sonido" aria-pressed="false">🔊</button>
              <button class="icon-btn" id="btn-restart" type="button" aria-label="Reiniciar el nivel">↺</button>
              <button class="icon-btn" id="btn-exit" type="button" aria-label="Volver al menú">✕</button>
            </div>
          </div>
        </div>

        <div class="scrim" id="scrim"></div>
        <div class="inspect" id="inspect" role="dialog" aria-modal="true" aria-labelledby="inspect-name" hidden>
          <span class="inspect__kicker">Objeto encontrado</span>
          <h2 class="inspect__name" id="inspect-name">Objeto</h2>
          <p class="inspect__q">¿Está gastando energía de más o está bien así?</p>
          <div class="inspect__actions">
            <button class="btn btn--primary" type="button" data-decide="waste">Gasta de más</button>
            <button class="btn" type="button" data-decide="ok">Está bien así</button>
          </div>
          <button class="inspect__cancel" id="inspect-cancel" type="button">Mejor lo dejo para después</button>
        </div>

        <div class="a11y-list" id="a11y-list" role="group" aria-label="Objetos del lugar"></div>
      </section>

      <section class="screen" id="screen-summary" aria-label="Resumen del nivel">
        <div class="summary">
          <div class="summary-card" id="summary-card"></div>
        </div>
      </section>

      <div class="tooltip" id="tooltip" role="status"></div>

      <div class="toast" id="toast" role="status" aria-live="polite">
        <span class="toast__icon" id="toast-icon" aria-hidden="true">✓</span>
        <span class="toast__body">
          <span class="toast__title" id="toast-title"></span>
          <span class="toast__msg" id="toast-msg"></span>
        </span>
        <span class="toast__delta" id="toast-delta"></span>
      </div>
    `;
  }

  private bind(): void {
    this.els.grid.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-level]');
      if (!card || card.disabled) return;
      const level = LEVELS.find((l) => l.id === card.dataset.level);
      if (level) this.openIntro(level);
    });

    q(this.ui, '#reset-progress').addEventListener('click', () => {
      const ok = window.confirm('¿Seguro que quieres borrar los niveles completados y las estrellas?');
      if (!ok) return;
      this.save = resetSave();
      this.renderMenu();
    });

    this.els.hintBtn.addEventListener('click', () => {
      sound.sfx('click');
      this.game.useHint();
    });

    q(this.ui, '#btn-restart').addEventListener('click', () => {
      if (this.current) this.startLevel(this.current, true);
    });

    q(this.ui, '#btn-exit').addEventListener('click', () => this.backToMenu());

    this.els.soundBtn.addEventListener('click', () => {
      this.muted = !this.muted;
      this.save.muted = this.muted;
      writeSave(this.save);
      sound.setMuted(this.muted);
      this.updateSoundButton();
      if (!this.muted) sound.sfx('click');
    });

    this.els.inspect.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-decide]');
      if (!btn) return;
      const saysWaste = btn.dataset.decide === 'waste';
      this.closeInspect();
      this.game.decide(saysWaste);
    });

    q(this.ui, '#inspect-cancel').addEventListener('click', () => {
      this.closeInspect();
      this.game.cancelInspect();
    });

    this.els.scrim.addEventListener('click', () => {
      this.closeInspect();
      this.game.cancelInspect();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.els.inspect.classList.contains('is-active')) {
          this.closeInspect();
          this.game.cancelInspect();
        }
        return;
      }
      if (this.els.inspect.classList.contains('is-active') && (e.key === '1' || e.key === '2')) {
        e.preventDefault();
        const saysWaste = e.key === '1';
        this.closeInspect();
        this.game.decide(saysWaste);
      }
    });

    const unlock = () => {
      sound.unlock();
      sound.setMuted(this.muted);
      sound.setMusic(this.save.music);
      document.removeEventListener('pointerdown', unlock);
    };
    document.addEventListener('pointerdown', unlock);
  }

  /* ---------------------------------------------------------------- */
  /* Navegación                                                       */
  /* ---------------------------------------------------------------- */

  private showScreen(name: 'menu' | 'intro' | 'game' | 'summary'): void {
    for (const [key, el] of Object.entries(this.screens)) {
      el.classList.toggle('is-active', key === name);
    }
    if (name !== 'game') this.hideTooltip();
  }

  private isUnlocked(index: number): boolean {
    if (index === 0) return true;
    const prev = LEVELS[index - 1];
    return Boolean(this.save.levels[prev.id]?.done);
  }

  private renderMenu(): void {
    this.els.grid.innerHTML = LEVELS.map((level, i) => {
      const progress = this.save.levels[level.id];
      const unlocked = this.isUnlocked(i);
      const stars = progress?.stars ?? 0;
      const label = `${level.name}. ${level.place}. ${level.wasteCount} ineficiencias. ${unlocked ? 'Disponible' : 'Bloqueado'}.`;
      return `
        <button class="level-card" type="button" data-level="${level.id}" style="--accent:${level.accent}"
          ${unlocked ? '' : 'disabled aria-disabled="true"'} aria-label="${label}">
          <span class="level-card__top">
            <span class="level-card__num">Lugar ${String(level.index + 1).padStart(2, '0')}</span>
            <span class="level-card__lock" aria-hidden="true">${unlocked ? '' : '🔒'}</span>
          </span>
          <span class="level-card__name">${level.name}</span>
          <span class="level-card__place">${level.place}</span>
          <span class="level-card__meta">
            <span>${DIFFICULTY[level.difficulty - 1]} · ${level.wasteCount} ineficiencias</span>
            ${starRow(stars)}
          </span>
        </button>
      `;
    }).join('');
  }

  private openIntro(level: LevelDef): void {
    this.current = level;
    this.game.loadLevel(level);

    this.els.intro.style.setProperty('--accent', level.accent);
    this.els.intro.innerHTML = `
      <div class="intro-card__head">
        ${MASCOT}
        <div>
          <span class="kicker">Lugar ${level.index + 1} de ${LEVELS.length} · ${DIFFICULTY[level.difficulty - 1]}</span>
          <h2>${level.name}</h2>
          <p class="intro-card__place">${level.place}</p>
        </div>
      </div>
      <p class="intro-card__mission">${level.mission}</p>
      <div class="bubble">“${level.greeting}”</div>
      <div class="chips">
        <span class="chip chip--waste">🔥 ${level.wasteCount} ineficiencias</span>
        <span class="chip">🪤 ${level.decoyCount} señuelos bien usados</span>
        <span class="chip chip--save">💡 3 pistas</span>
      </div>
      <div class="intro-card__actions">
        <button class="btn btn--primary" id="intro-start" type="button">Empezar la búsqueda</button>
        <button class="btn btn--ghost" id="intro-back" type="button">Volver</button>
      </div>
    `;

    q(this.els.intro, '#intro-start').addEventListener('click', () => this.startLevel(level));
    q(this.els.intro, '#intro-back').addEventListener('click', () => this.backToMenu());

    this.showScreen('intro');
  }

  private startLevel(level: LevelDef, reload = false): void {
    this.current = level;
    if (reload) this.game.loadLevel(level);
    this.els.hudDot.style.background = level.accent;
    this.els.hudPlace.textContent = level.place;
    this.closeInspect();
    this.hideToast();
    this.showScreen('game');
    this.game.start();
    this.els.hintBtn.focus({ preventScroll: true });
  }

  private backToMenu(): void {
    this.game.unload();
    this.current = null;
    this.closeInspect();
    this.hideToast();
    this.renderMenu();
    this.showScreen('menu');
  }

  /* ---------------------------------------------------------------- */
  /* HUD                                                              */
  /* ---------------------------------------------------------------- */

  private onProgress(state: HudState): void {
    this.els.hudPlace.textContent = state.place;
    this.els.hudFound.textContent = `${state.found}/${state.wasteTotal}`;
    this.els.hudPoints.textContent = String(state.points);
    this.els.hudPct.textContent = `${state.percent}%`;
    this.els.hudFill.style.width = `${state.percent}%`;
    this.els.hintCount.textContent = String(state.hints);
    this.els.hintBtn.disabled = state.hints <= 0;
    this.renderA11y();
  }

  private renderA11y(): void {
    const buttons = this.game.openFindings.map(
      (finding) => `<button type="button" data-finding="${finding.id}">${finding.name}</button>`,
    );
    this.els.a11y.innerHTML = buttons.join('');

    for (const btn of Array.from(this.els.a11y.querySelectorAll<HTMLButtonElement>('button'))) {
      const id = btn.dataset.finding ?? '';
      btn.addEventListener('focus', () => this.game.highlight(id));
      btn.addEventListener('blur', () => this.game.clearHighlight());
      btn.addEventListener('click', () => {
        const f = this.game.openFindings.find((it) => it.id === id);
        if (f) this.game.inspect(f);
      });
    }
  }

  private onHover(info: { name: string; x: number; y: number } | null): void {
    if (!info) {
      this.hideTooltip();
      return;
    }
    this.els.tooltip.textContent = info.name;
    this.els.tooltip.style.left = `${info.x}px`;
    this.els.tooltip.style.top = `${info.y}px`;
    this.els.tooltip.classList.add('is-visible');
  }

  private hideTooltip(): void {
    this.els.tooltip.classList.remove('is-visible');
  }

  /* ---------------------------------------------------------------- */
  /* Inspección y resultados                                          */
  /* ---------------------------------------------------------------- */

  private onInspect(finding: Finding): void {
    this.els.inspectName.textContent = finding.name;
    this.els.scrim.classList.add('is-active');
    this.els.inspect.hidden = false;
    this.els.inspect.classList.add('is-active');
    this.hideTooltip();
    const first = this.els.inspect.querySelector<HTMLButtonElement>('[data-decide="waste"]');
    first?.focus({ preventScroll: true });
  }

  private closeInspect(): void {
    this.els.scrim.classList.remove('is-active');
    this.els.inspect.classList.remove('is-active');
    this.els.inspect.hidden = true;
  }

  private onResult(payload: ResultPayload): void {
    const good = payload.kind !== 'wrong';
    this.showToast(
      good ? 'good' : 'bad',
      good ? '¡Bien visto!' : 'Casi…',
      payload.message,
      payload.delta,
      payload.detail,
    );
  }

  private onHintUsed(finding: Finding, left: number): void {
    void finding;
    sound.sfx('pop');
    this.showToast('good', `Pista (${left} restantes)`, 'Busca por la zona que acaba de brillar.', 0, '');
  }

  private showToast(
    kind: 'good' | 'bad',
    title: string,
    message: string,
    delta: number,
    detail: string,
  ): void {
    const t = this.els.toast;
    t.classList.remove('toast--bad', 'is-visible');
    if (kind === 'bad') t.classList.add('toast--bad');
    this.els.toastIcon.textContent = kind === 'good' ? '✓' : '↺';
    this.els.toastTitle.textContent = detail ? `${title} · ${detail}` : title;
    this.els.toastMsg.textContent = message;
    this.els.toastDelta.textContent = delta === 0 ? '' : `${delta > 0 ? '+' : ''}${delta}`;
    window.requestAnimationFrame(() => t.classList.add('is-visible'));

    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.hideToast(), 4600);
  }

  private hideToast(): void {
    this.els.toast.classList.remove('is-visible');
  }

  /* ---------------------------------------------------------------- */
  /* Resumen                                                          */
  /* ---------------------------------------------------------------- */

  private onComplete(payload: CompletionPayload): void {
    const level = this.current;
    if (!level) return;

    const prev = this.save.levels[level.id];
    const isBest = !prev || payload.points > prev.best;
    this.save.levels[level.id] = {
      stars: Math.max(prev?.stars ?? 0, payload.stars),
      best: Math.max(prev?.best ?? 0, payload.points),
      done: true,
    };
    writeSave(this.save);

    this.closeInspect();
    this.hideToast();
    this.renderSummary(payload, level, isBest);
    this.showScreen('summary');
  }

  private renderSummary(payload: CompletionPayload, level: LevelDef, isBest: boolean): void {
    const next = LEVELS[level.index + 1];
    const recall = payload.found.slice(0, 3);
    const stars = [0, 1, 2]
      .map(
        (i) =>
          `<span class="${i < payload.stars ? '' : 'off'}" style="animation-delay:${i * 0.14}s">★</span>`,
      )
      .join('');

    this.els.summaryCard.innerHTML = `
      <div class="summary-card__head">
        ${MASCOT}
        <h2>${payload.errors === 0 ? '¡Perfecto, detective!' : '¡Misión cumplida!'}</h2>
        <p class="summary-card__sub">${level.name} · ${level.place}</p>
        <div class="big-stars" role="img" aria-label="${payload.stars} de 3 estrellas">${stars}</div>
      </div>

      <div class="score-line">
        <div class="score-line__item">
          <span class="score-line__num score-line__num--accent">${payload.points}</span>
          <span class="score-line__label">Puntos de ahorro</span>
        </div>
        <div class="score-line__item">
          <span class="score-line__num">${payload.found.length}</span>
          <span class="score-line__label">Ineficiencias</span>
        </div>
        <div class="score-line__item">
          <span class="score-line__num">${payload.decoysOk}/${payload.decoysTotal}</span>
          <span class="score-line__label">Señuelos</span>
        </div>
        <div class="score-line__item">
          <span class="score-line__num">${payload.errors}</span>
          <span class="score-line__label">Errores</span>
        </div>
      </div>

      ${isBest ? '<p class="summary-card__sub" style="text-align:center">🌟 ¡Nuevo récord en este lugar!</p>' : ''}

      <span class="section-title">Recuerda estas tres ideas</span>
      <div class="recall">
        ${recall
          .map(
            (f) => `
          <div class="recall-card">${f.tip}</div>
        `,
          )
          .join('')}
      </div>

      <span class="section-title">Lo que encontraste</span>
      <ul class="found-list">
        ${payload.found
          .map(
            (f) => `
          <li>
            <span class="check" aria-hidden="true">✓</span>
            <span>
              <strong>${f.name}</strong>
              <span>${f.tip}</span>
            </span>
          </li>
        `,
          )
          .join('')}
      </ul>

      <div class="summary-card__actions">
        <button class="btn" id="sum-replay" type="button">Repetir lugar</button>
        ${
          next
            ? `<button class="btn btn--save" id="sum-next" type="button">Ir a ${next.name}</button>`
            : ''
        }
        <button class="btn btn--ghost" id="sum-menu" type="button">Elegir lugar</button>
      </div>
    `;

    q(this.els.summaryCard, '#sum-replay').addEventListener('click', () => {
      this.startLevel(level, true);
    });
    q(this.els.summaryCard, '#sum-menu').addEventListener('click', () => this.backToMenu());
    const nextBtn = this.els.summaryCard.querySelector<HTMLButtonElement>('#sum-next');
    nextBtn?.addEventListener('click', () => {
      if (next) this.openIntro(next);
    });

    const primary = nextBtn ?? q<HTMLButtonElement>(this.els.summaryCard, '#sum-replay');
    window.setTimeout(() => primary.focus({ preventScroll: true }), 60);
  }

  /* ---------------------------------------------------------------- */
  /* Sonido                                                           */
  /* ---------------------------------------------------------------- */

  private updateSoundButton(): void {
    this.els.soundBtn.textContent = this.muted ? '🔇' : '🔊';
    this.els.soundBtn.setAttribute('aria-pressed', String(this.muted));
    this.els.soundBtn.setAttribute('aria-label', this.muted ? 'Activar sonido' : 'Silenciar sonido');
  }
}
