export type GermanRegionId = 'munich' | 'berlin' | 'hamburg' | 'frankfurt';

export type GardenArchetypeId =
  | 'naturgarten'
  | 'alpine_courtyard'
  | 'rooftop_sanctuary'
  | 'villa_estate';

export interface GermanRegionInfo {
  id: GermanRegionId;
  label: string;
  germanState: string;
  hardinessZone: string;
  minTempRange: string;
  soilProfile: string;
  signaturePlants: string[];
}

export interface GardenArchetypeInfo {
  id: GardenArchetypeId;
  title: string;
  germanTitle: string;
  baseRatePerSqmEur: number;
  baseWeeks: number;
  speciesDensityFactor: number;
  description: string;
}

export interface GardenEstimateResult {
  region: GermanRegionInfo;
  archetype: GardenArchetypeInfo;
  areaSqm: number;
  hardinessZone: string;
  nativeSpeciesCount: number;
  estimatedWeeks: number;
  estimatedBudgetEur: {
    min: number;
    max: number;
  };
  co2SequesteredKgPerYear: number;
  signaturePlants: string[];
}

export interface InquiryFormInput {
  name: string;
  email: string;
  city: string;
  notes: string;
}

export interface InquiryValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    email?: string;
    city?: string;
  };
}

export const GERMAN_REGIONS: Record<GermanRegionId, GermanRegionInfo> = {
  munich: {
    id: 'munich',
    label: 'München',
    germanState: 'Bayern',
    hardinessZone: 'Zone 6b',
    minTempRange: '-18°C',
    soilProfile: 'Alpine gravel & limestone',
    signaturePlants: ['Mountain Pine', 'Gentian', 'Moor Grass', 'Yew'],
  },
  berlin: {
    id: 'berlin',
    label: 'Berlin',
    germanState: 'Berlin',
    hardinessZone: 'Zone 7a',
    minTempRange: '-15°C',
    soilProfile: 'Sandy woodland soil',
    signaturePlants: ['Feather Grass', 'Coneflower', 'Silver Birch', 'Sage'],
  },
  hamburg: {
    id: 'hamburg',
    label: 'Hamburg',
    germanState: 'Hamburg',
    hardinessZone: 'Zone 7b',
    minTempRange: '-12°C',
    soilProfile: 'Moist coastal soil',
    signaturePlants: ['Hydrangea', 'Wood Fern', 'Beech', 'Forest Grass'],
  },
  frankfurt: {
    id: 'frankfurt',
    label: 'Frankfurt',
    germanState: 'Hessen',
    hardinessZone: 'Zone 8a',
    minTempRange: '-10°C',
    soilProfile: 'Warm slate & loam',
    signaturePlants: ['Lavender', 'Hornbeam', 'Feather Grass', 'Juneberry'],
  },
};

export const GARDEN_ARCHETYPES: Record<GardenArchetypeId, GardenArchetypeInfo> = {
  naturgarten: {
    id: 'naturgarten',
    title: 'Natural Garden',
    germanTitle: 'Naturgarten',
    baseRatePerSqmEur: 190,
    baseWeeks: 5,
    speciesDensityFactor: 1.4,
    description: 'Native perennials, wild grasses, and natural stone paths.',
  },
  alpine_courtyard: {
    id: 'alpine_courtyard',
    title: 'City Courtyard',
    germanTitle: 'Hofgarten',
    baseRatePerSqmEur: 260,
    baseWeeks: 6,
    speciesDensityFactor: 1.0,
    description: 'Limestone terrace, shade trees, and a quiet water basin.',
  },
  rooftop_sanctuary: {
    id: 'rooftop_sanctuary',
    title: 'Rooftop Terrace',
    germanTitle: 'Dachgarten',
    baseRatePerSqmEur: 310,
    baseWeeks: 6,
    speciesDensityFactor: 0.9,
    description: 'Wind-hardy grasses, custom planters, and automatic watering.',
  },
  villa_estate: {
    id: 'villa_estate',
    title: 'Villa & Bio-Pool',
    germanTitle: 'Villengarten',
    baseRatePerSqmEur: 280,
    baseWeeks: 8,
    speciesDensityFactor: 1.6,
    description: 'Large garden with natural swimming pond and outdoor lighting.',
  },
};

export function calculateGardenEstimate(
  regionId: GermanRegionId,
  archetypeId: GardenArchetypeId,
  rawAreaSqm: number
): GardenEstimateResult {
  const areaSqm = Math.max(25, Math.min(2500, Math.round(rawAreaSqm)));
  const region = GERMAN_REGIONS[regionId];
  const archetype = GARDEN_ARCHETYPES[archetypeId];

  const baseCost = areaSqm * archetype.baseRatePerSqmEur;
  const minBudget = Math.round((baseCost * 0.9) / 500) * 500;
  const maxBudget = Math.round((baseCost * 1.15) / 500) * 500;

  const estimatedWeeks = Math.max(
    4,
    Math.min(16, Math.round(archetype.baseWeeks + Math.sqrt(areaSqm) / 9))
  );

  const nativeSpeciesCount = Math.max(
    18,
    Math.round(16 + Math.sqrt(areaSqm) * 2.2 * archetype.speciesDensityFactor)
  );

  const co2SequesteredKgPerYear = Math.round(
    areaSqm * 3.8 * archetype.speciesDensityFactor
  );

  return {
    region,
    archetype,
    areaSqm,
    hardinessZone: `${region.hardinessZone} (${region.minTempRange})`,
    nativeSpeciesCount,
    estimatedWeeks,
    estimatedBudgetEur: {
      min: minBudget,
      max: maxBudget,
    },
    co2SequesteredKgPerYear,
    signaturePlants: region.signaturePlants,
  };
}

export function validateInquiryForm(
  input: InquiryFormInput
): InquiryValidationResult {
  const errors: InquiryValidationResult['errors'] = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!input.city || input.city.trim().length < 2) {
    errors.city = 'Please enter your German city or postal code (PLZ).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
