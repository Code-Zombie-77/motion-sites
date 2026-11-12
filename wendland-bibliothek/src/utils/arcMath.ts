// Pure mathematical functions for the Wendland Bibliothek curved book archive, timeline, and PDF encoding

export interface ArcParams {
  H: number;
  ws: number;
  d: number;
  gap: number;
  U: number;
  P: number;
  XS: number[];
}

export function computeArcParams(H: number, isMobile: boolean): ArcParams {
  const ws = H * 0.15;
  const d = H * 0.667;
  const gap = H * 0.03;
  const U = H * (isMobile ? 1.15 : 1.45);
  const P = 1400;
  const XS: number[] = [];
  const maxSteps = Math.ceil((3 * U) / 2) + 4;
  let sum = 0;
  for (let i = 0; i <= maxSteps; i++) {
    XS.push(sum);
    const u = i * 2;
    sum += 2 / (1 + Math.pow(u / U, 1.6));
  }
  return { H, ws, d, gap, U, P, XS };
}

export function rel(v: number, s: number): number {
  let d = (v - s) % 36;
  if (d < 0) d += 36;
  if (d >= 18) d -= 36;
  return d;
}

export function B(r: number): number {
  if (Math.abs(r) < 1) {
    return (r + Math.sin(Math.PI * r) / Math.PI) / 2;
  }
  return r >= 0 ? 0.5 : -0.5;
}

export function F(r: number, params: Pick<ArcParams, 'ws' | 'd' | 'gap'>): number {
  const { ws, d, gap } = params;
  return r * (ws + gap) + (d - ws + 1.4 * gap) * B(r);
}

export function scl(u: number, U: number): number {
  return 1 / (1 + Math.pow(Math.abs(u) / U, 1.6));
}

export function xsc(u: number, XS: number[]): number {
  const absU = Math.abs(u);
  const idx = absU / 2;
  const i0 = Math.floor(idx);
  const frac = idx - i0;
  const maxIdx = XS.length - 1;
  if (i0 >= maxIdx) {
    return Math.sign(u) * XS[maxIdx];
  }
  const v0 = XS[i0];
  const v1 = XS[i0 + 1];
  return Math.sign(u) * (v0 + (v1 - v0) * frac);
}

export function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export function bookHash(id: string): number {
  const map: Record<string, number> = {
    werther: -0.65,
    sandmann: -0.92,
    schimmelreiter: 0.25,
    effi: 0.88,
    venedig: -0.45,
    verwandlung: 0.0,
    schach: -0.82,
    glasberg: 0.62,
    weissfluss: 0.38,
    zeugen: -0.22,
    geruch: 0.74,
    uhrmacher: 0.96,
  };
  return map[id] ?? 0;
}

export interface BookFrameTransform {
  visible: boolean;
  o: number;
  u: number;
  sc: number;
  k: number;
  x: number;
  y: number;
  z: number;
  rotateY: number;
  rotateX: number;
  zIndex: number;
  spineShade: number;
  coverShade: number;
  topShade: number;
  backShade: number;
}

export function computeBookFrame(
  r: number,
  lift: number,
  ent: number,
  tiltX: number,
  tiltY: number,
  params: ArcParams
): BookFrameTransform {
  const { H, U, P, XS } = params;
  const o = smoothstep(Math.max(0, 1 - Math.abs(r)));
  const u = F(r, params);
  if (Math.abs(u) > U * 1.95) {
    return {
      visible: false,
      o,
      u,
      sc: 1,
      k: 1,
      x: 0,
      y: 0,
      z: 0,
      rotateY: 0,
      rotateX: 0,
      zIndex: 0,
      spineShade: 0,
      coverShade: 0,
      topShade: 0,
      backShade: 0.7,
    };
  }
  const sc = scl(u, U);
  const k = 1 / sc;
  const z = P * (1 - k) + o * H * 0.1;
  const x = xsc(u, XS) * k;
  let y = (H * 0.5 * (1 - sc) * 0.42 + o * H * 0.012 - lift * H * 0.05) * k;
  if (ent < 1) {
    y += (1 - ent) * H * 1.15;
  }
  const signU = u === 0 ? 0 : Math.sign(u);
  const rotateY = signU * Math.min(1, Math.abs(u) / U) * 26 * (1 - o) - 90 * o + tiltY * o;
  const rotateX = tiltX * o;
  const zIndex = Math.round(3000 + z);
  const spineShade = Math.min(0.6, o * 0.55 + (1 - sc) * 0.32);
  const coverShade = (1 - o) * 0.82;
  const topShade = spineShade;
  const backShade = 0.7;

  return {
    visible: true,
    o,
    u,
    sc,
    k,
    x,
    y,
    z,
    rotateY,
    rotateX,
    zIndex,
    spineShade,
    coverShade,
    topShade,
    backShade,
  };
}

export function interpolateTimelineYear(s: number, years: number[]): number {
  const n = years.length;
  const f = Math.floor(s);
  const frac = s - f;
  const i0 = ((f % n) + n) % n;
  const i1 = (i0 + 1) % n;
  const y0 = years[i0];
  const y1 = years[i1];
  // Wrap case (e.g. 2005 -> 1774)
  if (i0 === n - 1 && i1 === 0) {
    return frac < 0.5 ? y0 : y1;
  }
  return y0 + (y1 - y0) * frac;
}

export function yearToTimelineLeft(year: number): number {
  return Math.max(0, Math.min(1, (year - 1770) / 260));
}

export function findNearestBookTarget(currentT: number, targetYear: number, years: number[]): number {
  let bestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < years.length; i++) {
    const diff = Math.abs(years[i] - targetYear);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = i;
    }
  }
  const n = years.length;
  const baseIdx = ((Math.round(currentT) % n) + n) % n;
  let delta = bestIdx - baseIdx;
  if (delta > n / 2) delta -= n;
  if (delta < -n / 2) delta += n;
  return Math.round(currentT) + delta;
}

const WIN1252_MAP: Record<number, number> = {
  0x20AC: 0x80, // €
  0x201A: 0x82, // ‚
  0x0192: 0x83,
  0x201E: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86,
  0x2021: 0x87,
  0x02C6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8A,
  0x2039: 0x8B,
  0x0152: 0x8C,
  0x017D: 0x8E,
  0x2018: 0x91, // ‘
  0x2019: 0x92, // ’
  0x201C: 0x93, // “
  0x201D: 0x94, // ”
  0x2022: 0x95,
  0x2013: 0x96, // –
  0x2014: 0x97, // —
  0x02DC: 0x98,
  0x2122: 0x99,
  0x0161: 0x9A,
  0x203A: 0x9B,
  0x0153: 0x9C,
  0x017E: 0x9E,
  0x0178: 0x9F,
};

export function toWin1252Escaped(str: string): string {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    let byte = code <= 0xFF ? code : (WIN1252_MAP[code] ?? 0x3F);
    const ch = String.fromCharCode(byte);
    if (ch === '(' || ch === ')' || ch === '\\') {
      out += '\\' + ch;
    } else {
      out += ch;
    }
  }
  return out;
}
