export const SINK = 240;
export const RISE = 820;
export const DEPTH = 0.27;

export const clamp = (x: number, a = 0, b = 1): number =>
  Math.min(b, Math.max(a, x));

export const smooth = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export interface FrameStepInput {
  d: number;
  animating: boolean;
  from: number;
  target: number;
  k: number;
  swapped: boolean;
}

export interface FrameStepOutput {
  y: number;
  s: number;
  dip: number;
  k: number;
  k2: number;
  swapped: boolean;
  justSwapped: boolean;
  done: boolean;
}

export function stepAnimationFrame(input: FrameStepInput): FrameStepOutput {
  const { d, animating, from, target } = input;
  let { k, swapped } = input;
  let y = 0;
  let s = 0;
  let dip = 0;
  let k2 = k;
  let justSwapped = false;
  let done = false;

  if (animating) {
    if (d < SINK) {
      const x = d / SINK;
      y = x * x * (3 - 2 * x) * DEPTH;
    } else {
      if (!swapped) {
        swapped = true;
        justSwapped = true;
      }
      const x = clamp((d - SINK) / RISE);
      y = Math.pow(1 - x, 3.4) * DEPTH;
    }
    s = smooth(0, SINK * 0.92, d) * (1 - smooth(SINK + 70, SINK + RISE * 0.92, d));
    dip = smooth(30, 190, d) * (1 - smooth(330, 720, d));
    k = from + (target - from) * smooth(120, 520, d);
    k2 = from + (target - from) * smooth(340, 760, d);

    if (d >= SINK + RISE) {
      done = true;
      k = target;
      k2 = target;
      y = 0;
      s = 0;
      dip = 0;
    }
  }

  return { y, s, dip, k, k2, swapped, justSwapped, done };
}

export interface GermanRegionYield {
  id: string;
  name: string;
  yieldPerKwp: number;
  gridPriceCent: number;
}

export const GERMAN_REGIONS: Record<string, GermanRegionYield> = {
  by: { id: 'by', name: 'Bayern', yieldPerKwp: 1180, gridPriceCent: 34.5 },
  bw: { id: 'bw', name: 'Baden-Württemberg', yieldPerKwp: 1160, gridPriceCent: 35.2 },
  he: { id: 'he', name: 'Hessen & Rheinland-Pfalz', yieldPerKwp: 1090, gridPriceCent: 35.8 },
  nrw: { id: 'nrw', name: 'Nordrhein-Westfalen', yieldPerKwp: 1030, gridPriceCent: 36.1 },
  bb: { id: 'bb', name: 'Berlin, Brandenburg & Sachsen', yieldPerKwp: 1070, gridPriceCent: 37.4 },
  ni: { id: 'ni', name: 'Niedersachsen & Norddeutschland', yieldPerKwp: 1010, gridPriceCent: 36.8 },
};

export interface SolarQuoteResult {
  kwp: number;
  annualYieldKwh: number;
  annualSavingsEur: number;
  sevenYearGuaranteeEur: number;
  autarkyPercent: number;
  feedInRevenueEur: number;
}

export function calculateGermanSolarYield(params: {
  regionId: string;
  roofAreaSqm: number;
  baseUsageKwh: number;
  hasHeatPump: boolean;
  hasWallbox: boolean;
}): SolarQuoteResult {
  const region = GERMAN_REGIONS[params.regionId] || GERMAN_REGIONS.by;
  const kwp = Math.round(params.roofAreaSqm * 0.215 * 10) / 10;
  const totalDemandKwh =
    params.baseUsageKwh +
    (params.hasHeatPump ? 3200 : 0) +
    (params.hasWallbox ? 2400 : 0);

  const annualYieldKwh = Math.round(kwp * region.yieldPerKwp);
  const previousGridBillEur = Math.round(totalDemandKwh * (region.gridPriceCent / 100));
  // § 8 EEG Einspeisevergütung (~8.03 ct/kWh) + EPEX Spot Smart-Controller Bonus
  const surplusKwh = Math.max(0, annualYieldKwh - totalDemandKwh * 0.78);
  const feedInRevenueEur = Math.round(surplusKwh * 0.112);
  const annualSavingsEur = previousGridBillEur + feedInRevenueEur;
  const sevenYearGuaranteeEur = annualSavingsEur * 7;
  const autarkyPercent = Math.min(96, Math.max(68, Math.round((annualYieldKwh / totalDemandKwh) * 76)));

  return {
    kwp,
    annualYieldKwh,
    annualSavingsEur,
    sevenYearGuaranteeEur,
    autarkyPercent,
    feedInRevenueEur,
  };
}

export function isValidGermanPlz(plz: string): boolean {
  return /^(0[1-9]|[1-9]\d)\d{3}$/.test(plz.trim());
}
