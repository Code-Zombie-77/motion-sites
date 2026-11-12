export const SW = 2048;
export const SH = 1360;
export const CW = 409.6;
export const CH = 530;
export const PAD = 50;
export const BW = CW + 2 * PAD; // 509.6
export const ROWY = [80, 700] as const;
export const N = 10;
export const SLOT = 108;
export const OPEN = 86;
export const CX = 750;

export interface ProductItem {
  name: string;
  price: string;
}

export const PRODUCTS: readonly ProductItem[] = [
  { name: 'Schädel-Schwingen — Kurzarmshirt', price: '€48' },
  { name: 'Schweres Rohling-Shirt — Nachtschwarz', price: '€38' },
  { name: 'Schweres Rohling-Shirt — Kreideweiß', price: '€38' },
  { name: 'Offcut Atelier — Langarmshirt', price: '€55' },
  { name: 'Dornenrose & Kette — Kurzarmshirt', price: '€52' },
  { name: 'Archiv-Collegejacke — Schwere Wolle', price: '€240' },
  { name: 'Letzte Auflage — Langarmshirt', price: '€58' },
  { name: 'Bogen-Signet — Kapuzenpullover', price: '€95' },
  { name: 'Stacheldraht-Herz — Kurzarmshirt', price: '€48' },
  { name: 'Reißverschluss-Kapuzenjacke — Schwarz', price: '€98' },
];

export function computeFit(innerWidth: number, innerHeight: number) {
  const k = Math.min(innerWidth / 1500, innerHeight / 1000);
  const left = (innerWidth - 1500 * k) / 2;
  const top = (innerHeight - 1000 * k) / 2;
  return { k, left, top };
}

export function computeSpriteMetrics(k: number, ew: number, eh: number) {
  const col = k % 5;
  const row = Math.floor(k / 5);
  const xBox = col * CW - PAD;
  const yBox = ROWY[row];
  const sx = ew / BW;
  const sy = eh / CH;
  return {
    bgWidth: SW * sx,
    bgHeight: SH * sy,
    bgPosX: -xBox * sx,
    bgPosY: -yBox * sy,
  };
}

export function computeSlotX(k: number, hov: number): number {
  let x = CX + (k - (N - 1) / 2) * SLOT;
  if (hov >= 0 && k !== hov) {
    x += Math.sign(k - hov) * OPEN;
  }
  return x;
}

export function formatCounter(k: number, total: number = N): string {
  const idx = String(k + 1).padStart(2, '0');
  const tot = String(total).padStart(2, '0');
  return `${idx} / ${tot}`;
}

export function stepIndex(current: number, d: number, total: number = N): number {
  return (current + d + total) % total;
}
