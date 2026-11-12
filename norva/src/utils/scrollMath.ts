/**
 * Pure scroll and animation math for the NORVA night-city hero.
 */

export function clamp(val: number, min = 0, max = 1): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, val));
}

export function easeInOutQuad(x: number): number {
  const t = clamp(x, 0, 1);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Progress p = (scrollY - trackTop) / (trackHeight - innerHeight), clamped to 0-1.
 */
export function computeScrollProgress(
  scrollY: number,
  trackTop: number,
  trackHeight: number,
  innerHeight: number
): number {
  const scrollable = trackHeight - innerHeight;
  if (scrollable <= 0) return 0;
  return clamp((scrollY - trackTop) / scrollable, 0, 1);
}

/**
 * Target video time = p * (duration - 1/48).
 */
export function computeTargetVideoTime(p: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const maxTime = Math.max(0, duration - 1 / 48);
  return clamp(p, 0, 1) * maxTime;
}

/**
 * Smooth video time step: cur += (target - cur) * 0.2 (or direct when reducedMotion is true).
 */
export function stepVideoTime(
  current: number,
  target: number,
  reducedMotion = false
): number {
  if (reducedMotion) return target;
  return current + (target - current) * 0.2;
}

export interface HeadlineTransformState {
  h: number;
  translateYVh: number;
  rotateXDeg: number;
  scale: number;
  opacity: number;
  pointerEvents: 'auto' | 'none';
}

/**
 * Headline block:
 * With h = easeInOutQuad(p / .38), apply translateY(-34h vh) rotateX(62h deg) scale(1 - .12h)
 * around its bottom edge. Opacity falls from 1 to 0 between p .10 and .24.
 */
export function computeHeadlineState(p: number): HeadlineTransformState {
  const clampedP = clamp(p, 0, 1);
  const h = easeInOutQuad(clamp(clampedP / 0.38, 0, 1));
  const translateYVh = -34 * h;
  const rotateXDeg = 62 * h;
  const scale = 1 - 0.12 * h;
  const opacity = clamp(1 - (clampedP - 0.10) / (0.24 - 0.10), 0, 1);

  return {
    h,
    translateYVh,
    rotateXDeg,
    scale,
    opacity,
    pointerEvents: opacity > 0.05 ? 'auto' : 'none',
  };
}

export interface ScrollCueState {
  underlineScale: number;
  opacity: number;
}

/**
 * Scroll cue:
 * Underline drains over the first 10% (p 0 -> .10).
 * Cue fades out between p .04 and .12.
 */
export function computeScrollCueState(p: number): ScrollCueState {
  const clampedP = clamp(p, 0, 1);
  const underlineScale = clamp(1 - clampedP / 0.10, 0, 1);
  const opacity = clamp(1 - (clampedP - 0.04) / (0.12 - 0.04), 0, 1);
  return { underlineScale, opacity };
}

export interface ProcessListState {
  translateYPx: number;
  opacity: number;
  activeStepIndex: number; // 0 for step 01, 1 for step 02, etc.
  pointerEvents: 'auto' | 'none';
}

/**
 * Process list:
 * Rises 40px and fades in between p .08 and .24.
 * Step 01 (index 0) is active below p .62, and step 02 (index 1) above it.
 */
export function computeProcessListState(
  p: number,
  manualOverrideIndex: number | null = null
): ProcessListState {
  const clampedP = clamp(p, 0, 1);
  const prog = clamp((clampedP - 0.08) / (0.24 - 0.08), 0, 1);
  const translateYPx = (1 - prog) * 40;
  const opacity = prog;
  const scrollStepIndex = clampedP < 0.62 ? 0 : 1;
  const activeStepIndex =
    manualOverrideIndex !== null ? manualOverrideIndex : scrollStepIndex;

  return {
    translateYPx,
    opacity,
    activeStepIndex,
    pointerEvents: opacity > 0.05 ? 'auto' : 'none',
  };
}

/**
 * Recorder mode (?rec=1):
 * 6.5 s timeline: hold 0.55 s (p=0), linear glide of 5.04 s (p 0->1), then hold until 6.5 s (p=1).
 */
export function computeRecorderProgress(elapsedSeconds: number): number {
  const holdStart = 0.55;
  const glideDuration = 5.04;
  if (elapsedSeconds <= holdStart) return 0;
  if (elapsedSeconds >= holdStart + glideDuration) return 1;
  return clamp((elapsedSeconds - holdStart) / glideDuration, 0, 1);
}
