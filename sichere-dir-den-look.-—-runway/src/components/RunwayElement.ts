import {
  clamp,
  wrapN,
  shortestDelta,
  normalizeWheelDelta,
  computeWheelTarget,
  resolveWheelSnapTarget,
  signedRingRank,
  computeRingSlot,
  computeClassicSlot,
  stepSpring,
} from '../utils/runwayMath';
import { stylingBag } from '../utils/bagController';
import type { Variant } from '../data/catalog';

interface BodySlot {
  a: number;
  lookIdx: number;
  el: HTMLElement;
  hit: HTMLButtonElement | null;
  w: number;
  lastBlur: string;
  // Classic mode per-body spring state
  x: number;
  g: number;
  vel: number;
  from: number;
  goal: number;
  onTrip: boolean;
}

const SHEET_TOKENS = [
  '--rw-panel',
  '--rw-text',
  '--rw-muted',
  '--rw-line',
  '--rw-accent',
  '--rw-on-accent',
  '--rw-btn-bg',
  '--rw-btn-fg',
  '--rw-btn-radius',
  '--rw-pill-radius',
  '--rw-bar-r',
  '--rw-thumb-radius',
  '--rw-pt-size',
  '--rw-price',
  '--rw-opt',
  '--rw-ease',
  '--rw-ease-sheet',
  '--rw-ease-spring',
];

export class RunwaySection extends HTMLElement {
  private initialized = false;
  private n = 6;
  private N = 12;
  private index = 0;
  private target = 0;
  private cur = 0;
  private vel = 0;
  private still = false;
  private reducedMotion = false;
  private isMobile = false;
  private W = 1000;
  private H = 700;
  private fs = 1.08;
  private unit = 300;
  private latchedVh = 0;
  private latchedVw = 0;

  private bodies: BodySlot[] = [];
  private heroes: HTMLElement[] = [];
  private ticks: HTMLButtonElement[] = [];
  private panels: HTMLElement[] = [];

  private stageEl!: HTMLElement;
  private actorsEl!: HTMLElement;
  private heroesEl!: HTMLElement;
  private liveEl!: HTMLElement | null;
  private piecesLabelEl!: HTMLElement | null;
  private autoBtn!: HTMLButtonElement | null;
  private panelEl!: HTMLElement | null;
  private lbEl!: HTMLElement | null;
  private lbStageEl!: HTMLElement | null;
  private lbKickerEl!: HTMLElement | null;
  private lbNameEl!: HTMLElement | null;
  private lbCloseBtn!: HTMLButtonElement | null;
  private cursorEl!: HTMLElement | null;

  private rafId: number | null = null;
  private lastFrameTime = 0;
  private visible = true;
  private playing = false;
  private engaged = false;
  private panelHover = false;
  private zoomed = false;
  private autoTimer: number | null = null;
  private lbCleanupTimer: number | null = null;
  private resizeTimer: number | null = null;

  // Drag state
  private pointerActive = false;
  private dragging = false;
  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private startTarget = 0;
  private samples: { x: number; time: number }[] = [];
  private suppressClickUntil = 0;

  // Wheel state
  private wheelAcc = 0;
  private wheelScrolling = false;
  private wheelStartTarget = 0;
  private wheelSnapTimer: number | null = null;

  // Cursor state
  private cursorRaf: number | null = null;
  private cursorX = 0;
  private cursorY = 0;
  private cursorTX = 0;
  private cursorTY = 0;
  private cursorEntered = false;

  // Mobile sheet host
  private sheetHost: HTMLElement | null = null;
  private activeSheetCard: HTMLElement | null = null;
  private activeSheetPicker: HTMLElement | null = null;

  // Observers & bound listeners
  private visObserver: IntersectionObserver | null = null;
  private revealObserver: IntersectionObserver | null = null;
  private stageResizeObserver: ResizeObserver | null = null;

  private boundOnResize = () => this.onWindowResize();
  private boundOnVisibility = () => this.onDocVisibility();
  private boundOnKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
  private boundOnClick = (e: MouseEvent) => this.onSectionClick(e);
  private boundOnCaptureClick = (e: MouseEvent) => this.onCaptureClick(e);
  private boundOnChange = (e: Event) => this.onOptionChange(e);

  connectedCallback() {
    if (this.initialized) return;
    const stage = this.querySelector<HTMLElement>('[data-rw-stage]');
    const actors = this.querySelector<HTMLElement>('[data-rw-actors]');
    if (!stage || !actors) return;

    this.initialized = true;
    this.stageEl = stage;
    this.actorsEl = actors;
    this.heroesEl = this.querySelector<HTMLElement>('[data-rw-heroes]')!;
    this.liveEl = this.querySelector<HTMLElement>('[data-rw-live]');
    this.piecesLabelEl = this.querySelector<HTMLElement>('[data-rw-pieces]');
    this.autoBtn = this.querySelector<HTMLButtonElement>('[data-rw-auto]');
    this.panelEl = this.querySelector<HTMLElement>('.rw__panel');
    this.lbEl = this.querySelector<HTMLElement>('[data-rw-lb]');
    this.lbStageEl = this.querySelector<HTMLElement>('[data-rw-lb-stage]');
    this.lbKickerEl = this.querySelector<HTMLElement>('[data-rw-lb-kicker]');
    this.lbNameEl = this.querySelector<HTMLElement>('[data-rw-lb-name]');
    this.lbCloseBtn = this.querySelector<HTMLButtonElement>('[data-rw-zoom-close]');
    this.cursorEl = this.querySelector<HTMLElement>('[data-rw-cursor]');

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.classList.add('rw--js');

    // Clone bodies 0..5 into 6..11 if not already cloned
    const origModels = Array.from(
      this.actorsEl.querySelectorAll<HTMLElement>('[data-rw-model]:not([data-rw-clone])')
    );
    this.n = origModels.length || 6;
    this.N = this.n * Math.ceil(8 / this.n);

    if (this.actorsEl.querySelectorAll('[data-rw-clone]').length === 0) {
      for (let a = this.n; a < this.N; a++) {
        const orig = origModels[a % this.n];
        const clone = orig.cloneNode(true) as HTMLElement;
        clone.setAttribute('data-rw-clone', '');
        clone.dataset.index = String(a % this.n);
        clone.querySelectorAll('img').forEach((img) => {
          img.setAttribute('loading', 'lazy');
        });
        this.actorsEl.appendChild(clone);
      }
    }

    const allModels = Array.from(this.actorsEl.querySelectorAll<HTMLElement>('[data-rw-model]'));
    const startOffset = this.reducedMotion ? 0 : 1.15;
    this.target = 0;
    this.cur = -startOffset;
    this.vel = 0;

    this.bodies = allModels.map((el, a) => {
      const goal = wrapN(a - this.target, this.N);
      const initX = goal + startOffset;
      return {
        a,
        lookIdx: a % this.n,
        el,
        hit: el.querySelector<HTMLButtonElement>('.rw__hit'),
        w: 300,
        lastBlur: '',
        x: initX,
        g: initX,
        vel: 0,
        from: initX,
        goal,
        onTrip: false,
      };
    });

    this.heroes = Array.from(this.querySelectorAll<HTMLElement>('[data-rw-hero]'));
    this.ticks = Array.from(this.querySelectorAll<HTMLButtonElement>('[data-rw-tick]'));
    this.panels = Array.from(this.querySelectorAll<HTMLElement>('[data-rw-panel]'));

    // Initialize all pickers and default selected variants
    this.querySelectorAll<HTMLElement>('.rw__item').forEach((card) => {
      this.syncCardOptions(card, true);
    });

    // Decode model images
    this.decodeImages(this);

    // Probe feet offsets
    this.probeAllFeet();

    // Custom cursor setup
    this.setupCursor();

    // Event listeners
    this.addEventListener('click', this.boundOnCaptureClick, true);
    this.addEventListener('click', this.boundOnClick);
    this.addEventListener('change', this.boundOnChange);
    this.addEventListener('keydown', this.boundOnKeyDown);

    this.setupStageGestures();
    this.setupPanelHover();

    window.addEventListener('resize', this.boundOnResize, { passive: true });
    document.addEventListener('visibilitychange', this.boundOnVisibility);

    this.latchedVw = window.innerWidth;
    this.latchedVh = window.innerHeight;
    this.measure();
    this.setIndex(0, true);
    this.renderAll();

    if (this.reducedMotion) {
      this.classList.add('is-revealed');
      this.setStill(true);
      this.renderAll();
    } else {
      this.revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  this.classList.add('is-revealed');
                });
              });
              this.revealObserver?.disconnect();
              break;
            }
          }
        },
        { threshold: 0, rootMargin: '0px 0px -22% 0px' }
      );
      this.revealObserver.observe(this);
    }

    this.visObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          this.visible = entry.isIntersecting;
          if (this.visible) {
            this.kick();
            if (this.playing) this.restartAutoBar();
          }
        }
      },
      { threshold: 0 }
    );
    this.visObserver.observe(this);

    this.stageResizeObserver = new ResizeObserver(() => {
      this.measure();
      this.renderAll();
    });
    this.stageResizeObserver.observe(this.stageEl);

    if (this.dataset.autoplay === 'true' && !this.reducedMotion) {
      this.play(true);
    }

    this.kick();
  }

  disconnectedCallback() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.cursorRaf !== null) cancelAnimationFrame(this.cursorRaf);
    if (this.autoTimer !== null) clearTimeout(this.autoTimer);
    if (this.lbCleanupTimer !== null) clearTimeout(this.lbCleanupTimer);
    if (this.resizeTimer !== null) clearTimeout(this.resizeTimer);
    if (this.wheelSnapTimer !== null) clearTimeout(this.wheelSnapTimer);

    this.visObserver?.disconnect();
    this.revealObserver?.disconnect();
    this.stageResizeObserver?.disconnect();

    window.removeEventListener('resize', this.boundOnResize);
    document.removeEventListener('visibilitychange', this.boundOnVisibility);

    this.dockSheetPicker();
    if (this.sheetHost) {
      this.sheetHost.remove();
      this.sheetHost = null;
    }
  }

  private decodeImages(root: ParentNode) {
    root.querySelectorAll<HTMLImageElement>('img[data-model-image]').forEach((img) => {
      const mark = () => img.classList.add('is-decoded');
      if (img.complete && img.naturalWidth > 0) {
        mark();
        return;
      }
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(mark)
          .catch(() => {
            if (img.naturalWidth > 0) mark();
            else img.addEventListener('load', mark, { once: true });
          });
      } else {
        img.addEventListener('load', mark, { once: true });
      }
    });
  }

  private probeAllFeet() {
    this.heroes.forEach((hero, lookIdx) => {
      const url = hero.dataset.probe;
      if (!url) return;
      const probeImg = new Image();
      probeImg.crossOrigin = 'anonymous';
      probeImg.onload = () => {
        try {
          const cw = 48;
          const ch = Math.max(1, Math.round((probeImg.naturalHeight / probeImg.naturalWidth) * cw));
          const canvas = document.createElement('canvas');
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(probeImg, 0, 0, cw, ch);
          const data = ctx.getImageData(0, 0, cw, ch).data;
          let lastRow = ch - 1;
          outer: for (let y = ch - 1; y >= 0; y--) {
            const rowStart = y * cw * 4;
            for (let x = 0; x < cw; x++) {
              if (data[rowStart + x * 4 + 3] > 40) {
                lastRow = y;
                break outer;
              }
            }
          }
          const footOffset = clamp((ch - 1 - lastRow) / ch, 0, 0.4);
          const val = footOffset.toFixed(4);
          hero.style.setProperty('--rw-foot', val);
          this.bodies
            .filter((b) => b.lookIdx === lookIdx)
            .forEach((b) => b.el.style.setProperty('--rw-foot', val));
        } catch {
          // Tainted canvas or security block: keep 0
        }
      };
      probeImg.src = url;
    });
  }

  private onWindowResize() {
    if (this.resizeTimer !== null) window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw !== this.latchedVw || Math.abs(vh - this.latchedVh) >= 160) {
        this.latchedVw = vw;
        this.latchedVh = vh;
      }
      this.measure();
      this.renderAll();
      this.kick();
    }, 120);
  }

  private onDocVisibility() {
    if (!document.hidden && this.visible) {
      this.kick();
      if (this.playing) this.restartAutoBar();
    }
  }

  public measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wasMobile = this.isMobile;
    this.isMobile = vw <= 749;

    if (wasMobile && !this.isMobile) {
      this.dockSheetPicker();
    }

    if (!this.isMobile) {
      let headerH = 0;
      document
        .querySelectorAll<HTMLElement>(
          '.shopify-section-group-header-group, #shopify-section-header, #shopify-section-announcement-bar'
        )
        .forEach((el) => {
          if (!el.contains(this) && el.offsetParent !== null) {
            headerH += el.getBoundingClientRect().height;
          }
        });
      const frameH = Math.max(380, Math.round(vh - headerH));
      this.style.setProperty('--rw-frame-h', `${frameH}px`);
    } else {
      const mvh = clamp(Number(this.dataset.mheightVh || 109), 50, 120);
      const baseVh = this.latchedVh || vh;
      const frameH = Math.round((baseVh * mvh) / 100);
      this.style.setProperty('--rw-frame-h', `${frameH}px`);
    }

    const rect = this.stageEl.getBoundingClientRect();
    this.W = Math.max(240, rect.width || vw);
    this.H = Math.max(240, rect.height || 560);

    const isRing = !this.isMobile && this.dataset.style === 'ring';
    this.fs = isRing ? 1.08 : 1;
    this.style.setProperty('--rw-fs', String(this.fs));

    const modelH = isRing
      ? Math.max(200, Math.round((this.H - 34 - 18) / 1.08))
      : Math.max(200, Math.round(this.H - (this.isMobile ? 24 : 36) - 18));

    this.stageEl.style.setProperty('--rw-model-h', `${modelH}px`);

    const hx = isRing ? 0.5 * this.W : (this.isMobile ? 0.3 : 0.4) * this.W;
    const hy = isRing ? 34 : this.isMobile ? 22 : 36;
    this.stageEl.style.setProperty('--rw-hx', `${hx.toFixed(1)}px`);
    this.stageEl.style.setProperty('--rw-hy', `${hy}px`);
    this.style.setProperty('--rw-ax', `${((hx / this.W) * 100).toFixed(1)}%`);

    if (isRing) {
      this.unit = Math.max(this.isMobile ? 90 : 120, 0.3 * this.W);
    } else {
      const sx = this.isMobile ? 0.32 : 0.125;
      this.unit = Math.max(90, this.W * sx * 1.6);
    }

    const approxW = Math.round(modelH * 0.5625);
    for (const b of this.bodies) {
      b.w = b.el.offsetWidth || approxW;
    }
  }

  private put(
    s: BodySlot,
    x: number,
    bottom: number,
    scale: number,
    opacity: number,
    blur: number,
    z: number
  ) {
    let op = opacity;
    if (x + (s.w * scale) / 2 < -4 || x - (s.w * scale) / 2 > this.W + 4) {
      op = 0;
    }

    const el = s.el;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${(-bottom).toFixed(1)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
    el.style.opacity = op.toFixed(3);
    el.style.zIndex = String(z);
    el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
    el.style.pointerEvents = op < 0.5 ? 'none' : 'auto';

    if (this.dataset.blur === 'true') {
      const bRound = Math.round(blur * 10) / 10;
      const bStr = bRound <= 0.05 ? '' : `blur(${bRound}px)`;
      if (s.lastBlur !== bStr) {
        s.lastBlur = bStr;
        el.style.filter = bStr;
      }
    }
  }

  private renderAll() {
    const isRing = !this.isMobile && this.dataset.style === 'ring';
    for (const s of this.bodies) {
      if (isRing) {
        const pose = computeRingSlot(
          s.a,
          this.cur,
          this.W,
          this.H,
          this.fs,
          this.isMobile,
          this.still,
          this.N
        );
        this.put(s, pose.x, pose.bottom, pose.scale, pose.opacity, pose.blur, pose.z);
      } else {
        const pose = computeClassicSlot(
          s.x,
          s.from,
          s.goal,
          s.onTrip,
          this.W,
          this.H,
          this.isMobile,
          this.still
        );
        this.put(s, pose.x, pose.bottom, pose.scale, pose.opacity, pose.blur, pose.z);
      }
    }
  }

  private setStill(val: boolean) {
    if (this.still === val) return;
    this.still = val;
    this.classList.toggle('rw--still', val);
  }

  private kick() {
    if (this.rafId !== null || !this.visible || document.hidden) return;
    this.lastFrameTime = 0;
    this.rafId = requestAnimationFrame((t) => this.tickLoop(t));
  }

  private tickLoop(now: number) {
    this.rafId = null;
    if (!this.visible || document.hidden) return;

    const dt =
      this.lastFrameTime === 0
        ? 1 / 60
        : Math.min(0.034, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    const isRing = !this.isMobile && this.dataset.style === 'ring';

    if (this.reducedMotion) {
      this.cur = this.target;
      this.vel = 0;
      for (const s of this.bodies) {
        const g = wrapN(s.a - this.target, this.N);
        s.goal = g;
        s.g = g;
        s.x = g;
        s.vel = 0;
        s.onTrip = false;
      }
      this.setStill(true);
      this.renderAll();
      return;
    }

    let allSettled = false;
    const isBusy = this.dragging || this.wheelScrolling;

    if (isRing) {
      const res = stepSpring(this.cur, this.vel, this.target, dt, 95, 0.0005);
      this.cur = res.cur;
      this.vel = res.vel;
      allSettled = res.settled && !isBusy;
    } else {
      allSettled = !isBusy;
      for (const s of this.bodies) {
        const newGoal = wrapN(s.a - this.target, this.N);
        if (Math.abs(newGoal - s.goal) > this.N / 2) {
          s.onTrip = true;
          s.from = s.x;
        }
        s.goal = newGoal;
        const tau = isBusy
          ? 0.016
          : s.onTrip
            ? 0.1
            : 0.03 + 0.04 * Math.min(s.goal, 4);
        s.g += (s.goal - s.g) * (1 - Math.exp(-dt / tau));

        const res = stepSpring(s.x, s.vel, s.g, dt, 95, 0.0006);
        s.x = res.cur;
        s.vel = res.vel;
        if (s.onTrip && Math.abs(s.x - s.goal) < 0.02) {
          s.onTrip = false;
        }
        if (Math.abs(s.x - s.goal) > 0.0006 || Math.abs(s.vel) > 0.0006) {
          allSettled = false;
        } else {
          s.x = s.goal;
          s.g = s.goal;
          s.vel = 0;
        }
      }
    }

    if (allSettled) {
      this.setStill(true);
      this.renderAll();
    } else {
      this.setStill(false);
      this.renderAll();
      this.kick();
    }
  }

  public setIndex(newIndex: number, silent = false) {
    const i = wrapN(newIndex, this.n);
    const prevIndex = this.index;
    const changed = i !== prevIndex || silent;
    this.index = i;
    this.kick();

    // Update queue body accessibility
    const isRing = !this.isMobile && this.dataset.style === 'ring';
    for (const s of this.bodies) {
      const k = isRing
        ? signedRingRank(s.a, this.target, this.N)
        : wrapN(s.a - Math.round(this.target), this.N);
      const reachable = isRing ? k !== 0 && Math.abs(k) <= 2 : k !== 0 && k <= 3;
      if (reachable) {
        s.el.removeAttribute('aria-hidden');
        if (s.hit) {
          s.hit.tabIndex = 0;
          s.hit.removeAttribute('aria-hidden');
        }
      } else {
        s.el.setAttribute('aria-hidden', 'true');
        if (s.hit) {
          s.hit.tabIndex = -1;
          s.hit.setAttribute('aria-hidden', 'true');
        }
      }
    }

    if (!changed) return;

    if (!silent) {
      if (this.zoomed) this.closePopup();
      if (this.isMobile) this.dockSheetPicker();
    }

    this.style.setProperty('--rw-progress', ((i + 1) / this.n).toFixed(3));

    // Toggle heroes
    this.heroes.forEach((hero, idx) => {
      const isOn = idx === i;
      const wasOn = !silent && idx === prevIndex && idx !== i;
      hero.classList.toggle('is-on', isOn);
      hero.classList.toggle('was', wasOn);
      hero.setAttribute('aria-hidden', isOn ? 'false' : 'true');
      const zoomBtn = hero.querySelector<HTMLButtonElement>('[data-rw-zoom]');
      if (zoomBtn) {
        zoomBtn.tabIndex = isOn ? 0 : -1;
      }
    });

    if (!silent && !this.reducedMotion) {
      this.stageEl.classList.remove('is-sweep');
      void this.stageEl.offsetWidth;
      this.stageEl.classList.add('is-sweep');
    }

    if (!silent && this.liveEl) {
      const activeHero = this.heroes[i];
      this.liveEl.textContent = activeHero?.dataset.label || '';
    }

    // Update ticks
    this.ticks.forEach((tick, j) => {
      tick.setAttribute('aria-current', j === i ? 'true' : 'false');
      tick.classList.toggle('is-past', j < i);
    });

    // Update panels
    this.panels.forEach((panel, idx) => {
      if (idx === i) {
        panel.hidden = false;
        if (!silent) {
          panel.classList.remove('is-in');
          void panel.offsetWidth;
          panel.classList.add('is-in');
        } else {
          panel.classList.add('is-in');
        }
      } else {
        panel.hidden = true;
        panel.classList.remove('is-in');
      }
    });

    // Update pieces label
    const activePanel = this.panels[i];
    const tpl = activePanel?.querySelector<HTMLTemplateElement>('[data-rw-pieces-text]');
    if (this.piecesLabelEl && tpl) {
      this.piecesLabelEl.textContent = tpl.innerHTML.trim();
      if (!silent && !this.reducedMotion) {
        this.piecesLabelEl.classList.remove('is-swap');
        void this.piecesLabelEl.offsetWidth;
        this.piecesLabelEl.classList.add('is-swap');
      }
    }

    this.hot(null);
    this.restartAutoBar();
  }

  public moveTo(T: number) {
    this.target = T;
    this.setStill(false);
    this.setIndex(wrapN(Math.round(T), this.n));
  }

  public next() {
    this.moveTo(Math.round(this.target) + 1);
  }

  public prev() {
    this.moveTo(Math.round(this.target) - 1);
  }

  public go(i: number) {
    const d = shortestDelta(this.index, i, this.n);
    this.moveTo(Math.round(this.target) + d);
  }

  public play(on: boolean) {
    this.playing = on;
    this.classList.toggle('is-playing', on);
    if (this.autoBtn) {
      this.autoBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    this.restartAutoBar();
  }

  private engage() {
    this.engaged = true;
    if (this.playing) {
      this.play(false);
    }
  }

  private restartAutoBar() {
    if (this.autoTimer !== null) {
      window.clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }

    this.ticks.forEach((t) => t.classList.remove('is-run'));
    if (!this.playing) return;

    const currentTick = this.ticks[this.index];
    if (currentTick) {
      void currentTick.offsetWidth;
      currentTick.classList.add('is-run');
    }

    const speed = Number(this.dataset.speed || 5000);
    this.autoTimer = window.setTimeout(() => {
      if (
        this.playing &&
        this.visible &&
        !this.dragging &&
        !this.wheelScrolling &&
        !document.hidden &&
        !this.panelHover &&
        !this.zoomed &&
        !this.engaged
      ) {
        this.next();
      } else {
        this.restartAutoBar();
      }
    }, speed);
  }

  private setupPanelHover() {
    if (!this.panelEl) return;
    this.panelEl.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') {
        this.panelHover = true;
      }
    });
    this.panelEl.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.panelHover = false;
        if (this.playing) this.restartAutoBar();
      }
    });

    // Hot linking on mouse hover over panel cards
    this.panelEl.addEventListener('pointerover', (e) => {
      if ((e as PointerEvent).pointerType !== 'mouse') return;
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-rw-card]');
      if (card) {
        this.hot(Number(card.dataset.rwCard), false);
      }
    });
    this.panelEl.addEventListener('pointerout', (e) => {
      if ((e as PointerEvent).pointerType !== 'mouse') return;
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-rw-card]');
      const rel = (e as PointerEvent).relatedTarget as HTMLElement | null;
      if (card && (!rel || !card.contains(rel))) {
        this.hot(null);
      }
    });
  }

  private setupStageGestures() {
    this.stageEl.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.pointerActive = true;
      this.dragging = false;
      this.pointerId = e.pointerId;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startTarget = this.target;
      this.samples = [{ x: e.clientX, time: performance.now() }];
    });

    this.stageEl.addEventListener('pointermove', (e: PointerEvent) => {
      this.updateCursorMove(e);

      if (!this.pointerActive || e.pointerId !== this.pointerId) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) {
        this.endPointerDrag(e);
        return;
      }

      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;

      if (!this.dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
          this.pointerActive = false;
          this.pointerId = null;
          return;
        }
        if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
          this.dragging = true;
          this.classList.add('is-dragging');
          try {
            this.stageEl.setPointerCapture(e.pointerId);
          } catch {
            // ignore capture error
          }
        }
      }

      if (this.dragging) {
        const now = performance.now();
        this.samples.push({ x: e.clientX, time: now });
        if (this.samples.length > 6) this.samples.shift();

        this.target = this.startTarget - dx / this.unit;
        this.setStill(false);
        this.kick();
      }
    });

    const onUp = (e: PointerEvent) => {
      if (!this.pointerActive || e.pointerId !== this.pointerId) return;
      this.endPointerDrag(e);
    };
    this.stageEl.addEventListener('pointerup', onUp);
    this.stageEl.addEventListener('pointercancel', onUp);

    // Mouse wheel & trackpad scroll (vertical and horizontal) spins models continuously
    const wheelTargetEl = this.querySelector<HTMLElement>('.rw__left') || this.stageEl;
    wheelTargetEl.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        if (this.zoomed) return;
        const delta = normalizeWheelDelta(e.deltaX, e.deltaY, e.deltaMode);
        if (Math.abs(delta) < 0.5) return;
        e.preventDefault();

        if (!this.wheelScrolling) {
          this.wheelScrolling = true;
          this.wheelStartTarget = this.target;
          this.wheelAcc = 0;
        }

        this.wheelAcc += delta;
        this.target = computeWheelTarget(this.wheelStartTarget, this.wheelAcc, 220);
        this.setStill(false);

        const liveIdx = wrapN(Math.round(this.target), this.n);
        if (liveIdx !== this.index) {
          this.setIndex(liveIdx);
        } else {
          this.kick();
        }

        if (this.wheelSnapTimer !== null) window.clearTimeout(this.wheelSnapTimer);
        this.wheelSnapTimer = window.setTimeout(() => {
          this.wheelScrolling = false;
          const dest = resolveWheelSnapTarget(
            this.wheelStartTarget,
            this.target,
            this.wheelAcc
          );
          this.wheelAcc = 0;
          this.moveTo(dest);
        }, 160);
      },
      { passive: false }
    );
  }

  private endPointerDrag(e: PointerEvent) {
    this.pointerActive = false;
    this.pointerId = null;
    if (!this.dragging) return;

    this.dragging = false;
    this.classList.remove('is-dragging');
    this.suppressClickUntil = performance.now() + 60;

    const dx = e.clientX - this.startX;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dt = Math.max(1, last.time - first.time);
    const vx = (last.x - first.x) / dt;
    const sign = -1;
    const from = Math.round(this.startTarget);

    if (this.isMobile) {
      if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) {
        this.moveTo(from + sign * (dx > 0 ? 1 : -1));
      } else {
        this.moveTo(from);
      }
    } else {
      let dest = Math.round(this.target + (sign * vx * 160) / this.unit);
      if (dest === from && Math.abs(vx) > 0.3) {
        dest = from + sign * (vx > 0 ? 1 : -1);
      }
      dest = clamp(dest, from - 2, from + 2);
      this.moveTo(dest);
    }
  }

  private setupCursor() {
    if (!this.cursorEl) return;
    const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fineHover) {
      this.cursorEl.remove();
      this.cursorEl = null;
      return;
    }

    this.classList.add('rw--cursor');

    this.stageEl.addEventListener('pointerleave', () => {
      if (!this.cursorEl) return;
      this.cursorEntered = false;
      this.cursorEl.classList.remove('is-on', 'is-link', 'is-view');
    });
  }

  private updateCursorMove(e: PointerEvent) {
    if (!this.cursorEl || e.pointerType !== 'mouse') return;
    const rect = this.stageEl.getBoundingClientRect();
    this.cursorTX = e.clientX - rect.left;
    this.cursorTY = e.clientY - rect.top;

    if (!this.cursorEntered) {
      this.cursorEntered = true;
      this.cursorX = this.cursorTX;
      this.cursorY = this.cursorTY;
      this.cursorEl.style.transform = `translate3d(${this.cursorX.toFixed(1)}px, ${this.cursorY.toFixed(1)}px, 0)`;
      this.cursorEl.classList.add('is-on');
    } else {
      this.cursorEl.classList.add('is-on');
    }

    const target = e.target as HTMLElement | null;
    const overZoom = Boolean(!this.dragging && target?.closest('[data-rw-zoom]'));
    const overLink = Boolean(
      !this.dragging && (target?.closest('[data-rw-pin]') || target?.closest('.rw__hit'))
    );
    this.cursorEl.classList.toggle('is-view', overZoom);
    this.cursorEl.classList.toggle('is-link', overLink);

    if (this.cursorRaf === null) {
      this.cursorRaf = requestAnimationFrame(() => this.stepCursor());
    }
  }

  private stepCursor() {
    this.cursorRaf = null;
    if (!this.cursorEl) return;
    const factor = this.reducedMotion ? 1 : 0.18;
    this.cursorX += (this.cursorTX - this.cursorX) * factor;
    this.cursorY += (this.cursorTY - this.cursorY) * factor;
    this.cursorEl.style.transform = `translate3d(${this.cursorX.toFixed(1)}px, ${this.cursorY.toFixed(1)}px, 0)`;

    if (
      Math.abs(this.cursorTX - this.cursorX) > 0.2 ||
      Math.abs(this.cursorTY - this.cursorY) > 0.2
    ) {
      this.cursorRaf = requestAnimationFrame(() => this.stepCursor());
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.activeSheetPicker && this.activeSheetCard) {
        e.preventDefault();
        const addBtn = this.activeSheetCard.querySelector<HTMLButtonElement>('[data-rw-add]');
        this.closePicker(this.activeSheetCard);
        addBtn?.focus();
        return;
      }
      if (this.zoomed) {
        e.preventDefault();
        this.closePopup();
        return;
      }
    }

    if (document.activeElement === this.stageEl) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
    }
  }

  private onCaptureClick(e: MouseEvent) {
    if (performance.now() < this.suppressClickUntil) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  private onSectionClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Engage if shopper interacts inside panel
    if (
      this.panelEl?.contains(target) &&
      target.closest('button, a, input, select, label')
    ) {
      this.engage();
    }

    // 1. pick-close
    if (target.closest('[data-rw-pick-close]')) {
      e.preventDefault();
      if (this.activeSheetCard) {
        this.closePicker(this.activeSheetCard);
      } else {
        const card = target.closest<HTMLElement>('.rw__item');
        if (card) this.closePicker(card);
      }
      return;
    }

    // 2. popup close button
    if (target.closest('[data-rw-zoom-close]')) {
      e.preventDefault();
      this.closePopup();
      return;
    }

    // 3. popup backdrop or stage outside model
    if (
      this.zoomed &&
      (target === this.lbEl ||
        (target === this.lbStageEl && !target.closest('.rw__lb-model')))
    ) {
      e.preventDefault();
      this.closePopup();
      return;
    }

    // 4. [data-rw-zoom] opens popup
    if (target.closest('[data-rw-zoom]')) {
      e.preventDefault();
      this.openPopup();
      return;
    }

    // 5. next
    if (target.closest('[data-rw-next]')) {
      e.preventDefault();
      this.next();
      return;
    }

    // 6. prev
    if (target.closest('[data-rw-prev]')) {
      e.preventDefault();
      this.prev();
      return;
    }

    // 7. tick
    const tickBtn = target.closest<HTMLButtonElement>('[data-rw-tick]');
    if (tickBtn) {
      e.preventDefault();
      this.go(Number(tickBtn.dataset.rwTick));
      return;
    }

    // 8. autoplay toggle
    if (target.closest('[data-rw-auto]')) {
      e.preventDefault();
      if (!this.playing) this.engaged = false;
      this.play(!this.playing);
      return;
    }

    // 9. pin
    const pinBtn = target.closest<HTMLButtonElement>('[data-rw-pin]');
    if (pinBtn) {
      e.preventDefault();
      this.engage();
      this.hot(Number(pinBtn.dataset.rwPin), true);
      return;
    }

    // 10. queue body [data-rw-go]
    const hitBtn = target.closest<HTMLButtonElement>('[data-rw-go]');
    if (hitBtn) {
      e.preventDefault();
      const bodyEl = hitBtn.closest<HTMLElement>('[data-rw-model]');
      const slot = this.bodies.find((b) => b.el === bodyEl);
      if (slot) {
        const isRing = !this.isMobile && this.dataset.style === 'ring';
        const k = isRing
          ? signedRingRank(slot.a, this.target, this.N)
          : wrapN(slot.a - Math.round(this.target), this.N);
        if (k === 0) {
          this.openPopup();
        } else if (Math.abs(k) < 6) {
          this.moveTo(Math.round(this.target) + k);
        }
      }
      return;
    }

    // 11. size confirm
    const confirmBtn = target.closest<HTMLButtonElement>('[data-rw-confirm]');
    if (confirmBtn) {
      e.preventDefault();
      const card =
        target.closest<HTMLElement>('.rw__item') || this.activeSheetCard;
      if (card) {
        this.confirmSinglePiece(card);
      }
      return;
    }

    // 12. plus button
    const addBtn = target.closest<HTMLButtonElement>('[data-rw-add]');
    if (addBtn) {
      e.preventDefault();
      const card = addBtn.closest<HTMLElement>('.rw__item');
      if (card) {
        this.togglePicker(card);
      }
      return;
    }

    // 13. add full look
    const allBtn = target.closest<HTMLButtonElement>('[data-rw-all]');
    if (allBtn) {
      e.preventDefault();
      this.addFullLook();
      return;
    }
  }

  public hot(n: number | null, scroll = false) {
    this.querySelectorAll('.is-hot').forEach((el) => el.classList.remove('is-hot'));
    if (n === null) return;

    const pinScope = this.zoomed ? this.lbStageEl : this.heroes[this.index];
    const pin = pinScope?.querySelector<HTMLElement>(`[data-rw-pin="${n}"]`);
    pin?.classList.add('is-hot');

    const activePanel = this.panels[this.index];
    const card = activePanel?.querySelector<HTMLElement>(`[data-rw-card="${n}"]`);
    if (card) {
      card.classList.add('is-hot');
      if (scroll) {
        this.revealCard(card);
      }
    }
  }

  private revealCard(card: HTMLElement) {
    const list = card.closest<HTMLElement>('.rw__items');
    if (!list) return;
    const behavior: ScrollBehavior = this.reducedMotion ? 'auto' : 'smooth';

    if (list.scrollWidth > list.clientWidth + 4) {
      const cardRect = card.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      list.scrollBy({
        left: cardRect.left - listRect.left - 20,
        behavior,
      });
    } else if (list.scrollHeight > list.clientHeight + 4) {
      list.scrollTo({
        top: card.offsetTop - list.offsetTop - 12,
        behavior,
      });
    } else {
      const rect = card.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight - 140) {
        window.scrollBy({
          top: rect.top - 0.3 * window.innerHeight,
          behavior,
        });
      }
    }
  }

  private openPopup() {
    if (!this.lbEl || !this.lbStageEl) return;
    const activeHero = this.heroes[this.index];
    if (!activeHero) return;

    if (this.lbCleanupTimer !== null) {
      clearTimeout(this.lbCleanupTimer);
      this.lbCleanupTimer = null;
    }

    this.engage();
    this.hot(null);

    this.lbStageEl.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'rw__lb-model';

    const footVal = activeHero.style.getPropertyValue('--rw-foot') || '0';
    wrapper.style.setProperty('--rw-foot', footVal);

    const shadow = activeHero.querySelector('.rw__shadow')?.cloneNode(true) as HTMLElement | null;
    const figure = activeHero.querySelector('.rw__figure')?.cloneNode(true) as HTMLElement | null;

    if (shadow) wrapper.appendChild(shadow);
    if (figure) {
      figure.querySelector('[data-rw-zoom]')?.remove();
      figure.querySelectorAll<HTMLButtonElement>('[data-rw-pin]').forEach((pin) => {
        pin.tabIndex = 0;
      });
      wrapper.appendChild(figure);
    }

    const stageRect = this.lbStageEl.getBoundingClientRect();
    const sW = stageRect.width || this.W - 96;
    const sH = stageRect.height || this.H - 136;
    const h = Math.max(160, Math.min(sH, sW / 0.5625));
    wrapper.style.setProperty('--rw-model-h', `${Math.round(h)}px`);

    wrapper.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      img.loading = 'eager';
      img.sizes = `${Math.round(h * 0.5625)}px`;
      img.classList.add('is-decoded');
    });

    this.lbStageEl.appendChild(wrapper);

    const word = this.lbEl.dataset.word || 'Look';
    const numStr = String(this.index + 1).padStart(2, '0');
    if (this.lbKickerEl) this.lbKickerEl.textContent = `${word} ${numStr}`;
    if (this.lbNameEl) this.lbNameEl.textContent = activeHero.dataset.name || '';

    const heroFig = activeHero.querySelector<HTMLElement>('.rw__figure');
    const popFig = wrapper.querySelector<HTMLElement>('.rw__figure');

    if (!this.reducedMotion && heroFig && popFig) {
      const a = heroFig.getBoundingClientRect();
      const b = popFig.getBoundingClientRect();
      if (b.height > 0) {
        const dx = a.left - b.left;
        const dy = a.bottom - b.bottom;
        const sc = a.height / b.height;
        wrapper.style.transition = 'none';
        wrapper.style.transformOrigin = '0 100%';
        wrapper.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
        void wrapper.offsetWidth;
        wrapper.style.transition = '';
        wrapper.style.transform = '';
      }
    }

    this.zoomed = true;
    this.classList.add('rw--zoom');
    this.lbEl.setAttribute('aria-hidden', 'false');
    this.lbCloseBtn?.focus();
  }

  private closePopup() {
    if (!this.zoomed || !this.lbEl || !this.lbStageEl) return;
    const wrapper = this.lbStageEl.querySelector<HTMLElement>('.rw__lb-model');
    const activeHero = this.heroes[this.index];
    const heroFig = activeHero?.querySelector<HTMLElement>('.rw__figure');
    const popFig = wrapper?.querySelector<HTMLElement>('.rw__figure');

    if (!this.reducedMotion && wrapper && heroFig && popFig) {
      const a = heroFig.getBoundingClientRect();
      const b = popFig.getBoundingClientRect();
      if (b.height > 0) {
        const dx = a.left - b.left;
        const dy = a.bottom - b.bottom;
        const sc = a.height / b.height;
        wrapper.style.transformOrigin = '0 100%';
        wrapper.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
      }
    }

    const focusWasInside = this.lbEl.contains(document.activeElement);
    this.zoomed = false;
    this.classList.remove('rw--zoom');
    this.lbEl.setAttribute('aria-hidden', 'true');
    this.hot(null);

    if (focusWasInside) {
      this.stageEl.focus();
    }

    if (this.lbCleanupTimer !== null) clearTimeout(this.lbCleanupTimer);
    this.lbCleanupTimer = window.setTimeout(
      () => {
        if (!this.zoomed && this.lbStageEl) {
          this.lbStageEl.innerHTML = '';
        }
      },
      this.reducedMotion ? 0 : 950
    );
  }

  private ensureSheetHost(): HTMLElement {
    if (this.sheetHost) return this.sheetHost;
    const host = document.createElement('div');
    host.className = 'rw-sheet-host';
    const scrim = document.createElement('button');
    scrim.type = 'button';
    scrim.className = 'rw__pick-scrim';
    scrim.setAttribute('data-rw-pick-close', '');
    scrim.tabIndex = -1;
    scrim.setAttribute('aria-hidden', 'true');
    host.appendChild(scrim);

    host.addEventListener('click', this.boundOnClick);
    host.addEventListener('change', (e) => {
      this.engage();
      this.onOptionChange(e);
    });
    host.addEventListener('keydown', this.boundOnKeyDown);

    document.body.appendChild(host);
    this.sheetHost = host;
    return host;
  }

  private syncSheetTokens() {
    if (!this.sheetHost) return;
    const cs = getComputedStyle(this);
    for (const token of SHEET_TOKENS) {
      this.sheetHost.style.setProperty(token, cs.getPropertyValue(token));
    }
    this.sheetHost.style.fontFamily = cs.fontFamily;
    this.sheetHost.style.color = cs.color;
  }

  private dockSheetPicker() {
    if (this.activeSheetPicker && this.activeSheetCard) {
      this.activeSheetPicker.hidden = true;
      this.activeSheetCard.appendChild(this.activeSheetPicker);
      this.activeSheetCard.classList.remove('is-picking');
      const addBtn = this.activeSheetCard.querySelector<HTMLButtonElement>('[data-rw-add]');
      addBtn?.setAttribute('aria-expanded', 'false');
    }
    this.activeSheetPicker = null;
    this.activeSheetCard = null;
    this.classList.remove('rw--picking');
    if (this.sheetHost) {
      this.sheetHost.classList.remove('is-open');
    }
  }

  private togglePicker(card: HTMLElement) {
    if (card.classList.contains('is-added') || card.classList.contains('is-loading')) return;
    if (card.classList.contains('is-picking')) {
      this.closePicker(card);
    } else {
      this.openPicker(card);
    }
  }

  private openPicker(card: HTMLElement) {
    if (card.classList.contains('is-added')) return;
    const picker =
      card.querySelector<HTMLElement>('[data-rw-picker]') ||
      (this.activeSheetCard === card ? this.activeSheetPicker : null);
    if (!picker) return;

    const addBtn = card.querySelector<HTMLButtonElement>('[data-rw-add]');

    if (this.isMobile) {
      if (this.activeSheetCard && this.activeSheetCard !== card) {
        this.dockSheetPicker();
      }
      const host = this.ensureSheetHost();
      this.syncSheetTokens();
      this.activeSheetCard = card;
      this.activeSheetPicker = picker;
      card.classList.add('is-picking');
      addBtn?.setAttribute('aria-expanded', 'true');
      picker.hidden = false;
      host.appendChild(picker);
      this.classList.add('rw--picking');
      requestAnimationFrame(() => {
        host.classList.add('is-open');
      });
    } else {
      card.classList.add('is-picking');
      addBtn?.setAttribute('aria-expanded', 'true');
      picker.hidden = false;
      this.revealCard(card);
    }

    const checkedRadio = picker.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    checkedRadio?.focus({ preventScroll: true });
  }

  private closePicker(card: HTMLElement) {
    if (this.activeSheetCard === card) {
      this.dockSheetPicker();
      return;
    }
    const picker = card.querySelector<HTMLElement>('[data-rw-picker]');
    if (picker) picker.hidden = true;
    card.classList.remove('is-picking');
    const addBtn = card.querySelector<HTMLButtonElement>('[data-rw-add]');
    addBtn?.setAttribute('aria-expanded', 'false');
  }

  private onOptionChange(e: Event) {
    const input = e.target as HTMLInputElement | null;
    if (!input || input.type !== 'radio') return;
    this.engage();
    const card =
      input.closest<HTMLElement>('.rw__item') || this.activeSheetCard;
    if (card) {
      this.syncCardOptions(card, false);
    }
  }

  private syncCardOptions(card: HTMLElement, initial: boolean) {
    const picker =
      card.querySelector<HTMLElement>('[data-rw-picker]') ||
      (this.activeSheetCard === card ? this.activeSheetPicker : null);
    if (!picker) return;

    const variantsScript = picker.querySelector<HTMLScriptElement>('[data-rw-variants]');
    if (!variantsScript) return;
    let variants: Variant[] = [];
    try {
      variants = JSON.parse(variantsScript.textContent || '[]');
    } catch {
      variants = [];
    }

    const checked = Array.from(
      picker.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked')
    ).map((r) => r.value);

    // Check availability per radio
    picker.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio) => {
      const val = radio.value;
      const isAvail = variants.some((v) => v.a && v.o[0] === val);
      const pill = radio.closest('.rw__pill');
      pill?.classList.toggle('is-unavailable', !isAvail);
    });

    const match = variants.find((v) => v.a && v.o[0] === checked[0]);
    const confirmBtn = picker.querySelector<HTMLButtonElement>('[data-rw-confirm]');
    const confirmLabel = picker.querySelector<HTMLElement>('[data-rw-confirm-label]');

    if (match) {
      card.dataset.selected = String(match.id);
      if (confirmBtn) confirmBtn.disabled = false;
      if (confirmLabel) {
        confirmLabel.textContent = confirmLabel.dataset.add || 'In die Tasche';
      }
    } else {
      delete card.dataset.selected;
      if (confirmBtn) confirmBtn.disabled = true;
      if (confirmLabel) {
        confirmLabel.textContent = this.dataset.msgSoldout || 'Ausverkauft';
      }
    }

    if (!initial) {
      card.dataset.touched = '1';
    }
  }

  private async confirmSinglePiece(card: HTMLElement) {
    if (card.classList.contains('is-added') || card.classList.contains('is-loading')) return;
    card.dataset.touched = '1';
    const variantId = Number(card.dataset.selected);
    const activePanel = this.panels[this.index];
    const msgEl = activePanel?.querySelector<HTMLElement>('[data-rw-msg]');
    if (msgEl) msgEl.textContent = '';

    if (!variantId) return;

    card.classList.add('is-loading');
    try {
      await stylingBag.add([{ id: variantId, quantity: 1 }]);
      this.markCardAdded(card);
      this.checkPanelComplete(activePanel);
    } catch {
      card.classList.remove('is-loading');
      if (msgEl) {
        msgEl.textContent =
          this.dataset.msgError || 'Konnte nicht hinzugefügt werden. Bitte erneut versuchen.';
      }
    }
  }

  private markCardAdded(card: HTMLElement) {
    card.classList.remove('is-loading', 'is-picking');
    card.classList.add('is-added');
    this.closePicker(card);
    const addBtn = card.querySelector<HTMLButtonElement>('[data-rw-add]');
    if (addBtn) {
      const addedLabel = addBtn.dataset.addedLabel || 'In der Tasche';
      addBtn.setAttribute('aria-label', addedLabel);
      addBtn.removeAttribute('aria-expanded');
    }
    if (
      this.isMobile &&
      !this.reducedMotion &&
      typeof navigator.vibrate === 'function'
    ) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore vibrate errors
      }
    }
  }

  private checkPanelComplete(panel: HTMLElement | undefined) {
    if (!panel) return;
    const cards = Array.from(panel.querySelectorAll<HTMLElement>('.rw__item'));
    if (cards.length >= 2 && cards.every((c) => c.classList.contains('is-added'))) {
      panel.classList.add('is-complete');
      const msgEl = panel.querySelector<HTMLElement>('[data-rw-msg]');
      if (msgEl) msgEl.textContent = '';
    }
  }

  private async addFullLook() {
    const activePanel = this.panels[this.index];
    if (!activePanel || activePanel.classList.contains('is-complete')) return;

    const ctaBtn = activePanel.querySelector<HTMLButtonElement>('[data-rw-all]');
    if (!ctaBtn || ctaBtn.classList.contains('is-loading')) return;

    const msgEl = activePanel.querySelector<HTMLElement>('[data-rw-msg]');
    if (msgEl) msgEl.textContent = '';

    const remainingCards = Array.from(
      activePanel.querySelectorAll<HTMLElement>('.rw__item')
    ).filter((c) => !c.classList.contains('is-added'));

    const readyCards: HTMLElement[] = [];
    const pendingCards: HTMLElement[] = [];

    for (const card of remainingCards) {
      if (card.dataset.touched === '1' && card.dataset.selected) {
        readyCards.push(card);
      } else {
        pendingCards.push(card);
      }
    }

    if (readyCards.length > 0) {
      ctaBtn.classList.add('is-loading');
      readyCards.forEach((c) => c.classList.add('is-loading'));
      try {
        await stylingBag.add(
          readyCards.map((c) => ({
            id: Number(c.dataset.selected),
            quantity: 1,
          }))
        );
        readyCards.forEach((c) => this.markCardAdded(c));
        ctaBtn.classList.remove('is-loading');
        this.checkPanelComplete(activePanel);
      } catch {
        readyCards.forEach((c) => c.classList.remove('is-loading'));
        ctaBtn.classList.remove('is-loading');
        if (msgEl) {
          msgEl.textContent =
            this.dataset.msgError ||
            'Konnte nicht hinzugefügt werden. Bitte erneut versuchen.';
        }
        return;
      }
    }

    if (pendingCards.length > 0) {
      if (this.isMobile) {
        this.openPicker(pendingCards[0]);
      } else {
        pendingCards.forEach((c) => this.openPicker(c));
      }
      this.revealCard(pendingCards[0]);

      if (msgEl) {
        const titles = pendingCards
          .map((c) => c.dataset.title || '')
          .filter(Boolean)
          .join(', ');
        const tpl = this.dataset.msgChoose || 'Wähle deine Größe für: [items]';
        msgEl.textContent = tpl.replace('[items]', titles);
      }
    }
  }
}

if (!customElements.get('runway-section')) {
  customElements.define('runway-section', RunwaySection);
}
