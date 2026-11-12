import type { CatalogData, CatalogItem, Variant } from '../data/catalog';

export interface BagEntry {
  id: number;
  quantity: number;
}

export interface SlotPose {
  x: number;
  bottom: number;
  scale: number;
  opacity: number;
  blur: number;
  z: number;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function wrapN(v: number, n: number): number {
  return ((v % n) + n) % n;
}

export function shortestDelta(fromIndex: number, toIndex: number, n: number): number {
  let d = wrapN(toIndex - fromIndex, n);
  if (d > n / 2) d -= n;
  return d;
}

export function normalizeWheelDelta(
  deltaX: number,
  deltaY: number,
  deltaMode = 0
): number {
  const raw = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX;
  const multiplier = deltaMode === 1 ? 32 : deltaMode === 2 ? 300 : 1;
  return clamp(raw * multiplier, -360, 360);
}

export function computeWheelTarget(
  startTarget: number,
  accumulatedDelta: number,
  scrollUnit = 220
): number {
  return startTarget + accumulatedDelta / Math.max(80, scrollUnit);
}

export function resolveWheelSnapTarget(
  startTarget: number,
  currentTarget: number,
  accumulatedDelta: number
): number {
  const from = Math.round(startTarget);
  let dest = Math.round(currentTarget);
  if (dest === from && Math.abs(accumulatedDelta) >= 15) {
    dest = from + (accumulatedDelta > 0 ? 1 : -1);
  }
  return dest;
}

export function signedRingRank(a: number, target: number, N: number): number {
  let k = wrapN(a - Math.round(target), N);
  if (k > N / 2) k -= N;
  return k;
}

export function computeRingSlot(
  a: number,
  cur: number,
  W: number,
  H: number,
  fs: number,
  isMobile: boolean,
  still: boolean,
  N = 12
): SlotPose {
  const cx = 0.5 * W;
  const R = (isMobile ? 0.72 : 0.62) * W;
  const P = (isMobile ? 1.9 : 1.65) * W;
  const floor = H - 34;
  const horizon = 0.36 * H;
  const step = (2 * Math.PI) / N;

  let phi = ((a - cur) * step) % (2 * Math.PI);
  if (phi <= -Math.PI) phi += 2 * Math.PI;
  else if (phi > Math.PI) phi -= 2 * Math.PI;

  const zDepth = R * (1 - Math.cos(phi));
  const persp = P / (P + zDepth);
  const sl = Math.abs(phi) / step;
  const scale = persp * (1 + (fs - 1) * clamp(1 - sl, 0, 1));
  const x = cx + R * Math.sin(phi) * persp;
  const feet = horizon + (floor - horizon) * persp;
  const bottom = H - feet;
  const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
  let opacity = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);

  if (still && sl < 0.02) {
    opacity = 0;
  }

  const z = Math.round(scale * 1000);
  return { x, bottom, scale, opacity, blur, z };
}

export function computeClassicSlot(
  xPos: number,
  from: number,
  goal: number,
  onTrip: boolean,
  W: number,
  H: number,
  isMobile: boolean,
  still: boolean
): SlotPose {
  const ax = isMobile ? 0.3 : 0.4;
  const ay = isMobile ? 22 : 36;
  const sx = isMobile ? 0.32 : 0.125;
  const sy = isMobile ? 22 : 58;
  const sr = 0.76;
  const ex = isMobile ? 0.55 : 0.38;
  const d = isMobile ? 4 : 5;

  let k = xPos;
  let e = -1;

  if (onTrip) {
    const denom = Math.abs(goal - from) || 1;
    const u = clamp(Math.abs(xPos - from) / denom, 0, 1);
    if (goal > from) {
      if (u < 0.5) {
        e = 2 * u * 1.4;
      } else {
        k = goal + 2 * (1 - u);
      }
    } else {
      if (u < 0.5) {
        k = from + 2 * u;
      } else {
        e = 2 * (1 - u) * 1.4;
      }
    }
  } else if (k < 0) {
    e = Math.min(-k, 1.4);
  }

  if (e >= 0) {
    const x = W * (ax - ex * e);
    const bottom = ay - 22 * e;
    const scale = 1 + 0.14 * e;
    const opacity = Math.max(0, 1 - 1.05 * e);
    const blur = 4 * Math.min(e, 1);
    const z = 1100;
    return { x, bottom, scale, opacity, blur, z };
  }

  const x = W * (ax + sx * k);
  const bottom = ay + sy * k;
  const scale = Math.pow(sr, k);
  let opacity = k <= d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (d - k));
  const blur = Math.min(0.9 * Math.max(0, k), 3.2);
  const z = 1000 - Math.round(10 * k);

  if (still && Math.abs(k) < 0.02) {
    opacity = 0;
  }

  return { x, bottom, scale, opacity, blur, z };
}

export function stepSpring(
  cur: number,
  vel: number,
  target: number,
  dt: number,
  K = 95,
  tolerance = 0.0005
): { cur: number; vel: number; settled: boolean } {
  const C = 2 * Math.sqrt(K);
  const clampedDt = Math.min(0.034, Math.max(0.001, dt));
  const h = clampedDt / 3;
  let c = cur;
  let v = vel;

  for (let s = 0; s < 3; s++) {
    const acc = -K * (c - target) - C * v;
    v += acc * h;
    c += v * h;
  }

  if (Math.abs(c - target) <= tolerance && Math.abs(v) <= tolerance) {
    return { cur: target, vel: 0, settled: true };
  }

  return { cur: c, vel: v, settled: false };
}

export function validateCatalog(cat: unknown): CatalogData {
  if (!cat || typeof cat !== 'object') {
    throw new Error('Die Produktliste ist derzeit nicht verfügbar.');
  }
  const c = cat as CatalogData;
  if (!Array.isArray(c.items) || c.items.length === 0) {
    throw new Error('Die Produktliste ist derzeit nicht verfügbar.');
  }
  for (const item of c.items) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.price !== 'number' ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      !Array.isArray(item.variants)
    ) {
      throw new Error('Die Produktliste ist derzeit nicht verfügbar.');
    }
    for (const v of item.variants) {
      if (
        !v ||
        !Number.isSafeInteger(v.id) ||
        typeof v.a !== 'boolean' ||
        !Array.isArray(v.o) ||
        !v.o.every((opt) => typeof opt === 'string')
      ) {
        throw new Error('Die Produktliste ist derzeit nicht verfügbar.');
      }
    }
  }
  return c;
}

export function sanitizeBagEntries(raw: unknown): BagEntry[] {
  if (!Array.isArray(raw)) return [];
  const valid: BagEntry[] = [];
  for (const entry of raw) {
    if (
      entry &&
      typeof entry === 'object' &&
      Number.isSafeInteger((entry as BagEntry).id) &&
      Number.isSafeInteger((entry as BagEntry).quantity) &&
      (entry as BagEntry).quantity >= 1 &&
      (entry as BagEntry).quantity <= 20
    ) {
      valid.push({
        id: (entry as BagEntry).id,
        quantity: (entry as BagEntry).quantity,
      });
      if (valid.length >= 50) break;
    }
  }
  return valid;
}

export function findVariantInCatalog(
  variantId: number,
  catalog: CatalogData
): { item: CatalogItem; variant: Variant } | null {
  for (const item of catalog.items) {
    for (const variant of item.variants) {
      if (variant.id === variantId) {
        return { item, variant };
      }
    }
  }
  return null;
}

export function addBagItems(
  current: BagEntry[],
  toAdd: BagEntry[],
  catalog: CatalogData
): BagEntry[] {
  const next = current.map((e) => ({ ...e }));
  for (const req of toAdd) {
    const match = findVariantInCatalog(req.id, catalog);
    if (!match || !match.variant.a) {
      throw new Error('Bitte wähle eine verfügbare Größe.');
    }
    const existing = next.find((e) => e.id === req.id);
    const addQty = clamp(req.quantity || 1, 1, 20);
    if (existing) {
      existing.quantity = Math.min(20, existing.quantity + addQty);
    } else if (next.length < 50) {
      next.push({ id: req.id, quantity: addQty });
    }
  }
  return next;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatShortlistText(entries: BagEntry[], catalog: CatalogData): string {
  const lines: string[] = [
    'RUNWAY — DEINE STYLING-MERKLISTE',
    'Unverbindliche Referenzpreise; es wurde noch keine Bestellung oder Zahlung ausgelöst.',
    '',
  ];
  for (const entry of entries) {
    const found = findVariantInCatalog(entry.id, catalog);
    if (!found) continue;
    const size = found.variant.o[0] || '';
    lines.push(
      `${found.item.name} · Größe ${size} · Anzahl ${entry.quantity}\n${found.item.url}`
    );
  }
  return lines.join('\n\n');
}
