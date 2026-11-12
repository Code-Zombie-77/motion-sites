export interface CreatureData {
  id: string;
  no: string;
  era: [number, number];
  eraLabel: string;
  scale: string;
  name: string;
  latin: string;
  family: string;
  image: string;
  model: string;
  yaw: number;
  pitch: number;
  tags: string[];
  lede: string;
  traits: [string, string, string][];
  habitat: string;
  caption: string;
  closeup: string;
  lens: string;
  feature: [string, string];
}

export interface NavItem {
  id: string;
  icon: string;
  label: string;
  sub?: string;
  creatureIndex?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: 'i-home', label: 'Übersicht', creatureIndex: 0 },
  { id: 'featured', icon: 'i-star', label: 'Ausgewählt', creatureIndex: 0 },
  { id: 'fire-birds', icon: 'i-flame', label: 'Feuervögel', sub: '6 Legenden', creatureIndex: 0 },
  { id: 'sea-monsters', icon: 'i-wave', label: 'Seeungeheuer', sub: '14 Legenden', creatureIndex: 1 },
  { id: 'dragons', icon: 'i-claw', label: 'Drachen', sub: '22 Legenden' },
  { id: 'chimeras', icon: 'i-skull', label: 'Chimären', sub: '9 Legenden' },
  { id: 'giants', icon: 'i-peak', label: 'Riesen', sub: '11 Legenden' },
  { id: 'tricksters', icon: 'i-mask', label: 'Gestaltwandler', sub: '8 Legenden' },
];

export const DINOS: CreatureData[] = [
  {
    id: 'phoenix',
    no: 'MA-001',
    era: [-800, -430],
    eraLabel: 'Herodot, 430 v. Chr.',
    scale: '1 m',
    name: 'Phönix',
    latin: 'Phoenix ignis',
    family: 'Feuervögel',
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_020340_4815bb8d-68c3-48c4-ad05-6307d085e896.png&w=900&q=85',
    model:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261031_015714_12c0e407-828a-4b1f-957c-2efe1fe83be1.glb',
    yaw: 3.9,
    pitch: 0.1,
    tags: ['Unsterblich', 'Einzelgänger', 'Feuergeboren'],
    lede: 'Ein majestätischer Sonnenbote in Karmesin und flüssigem Gold, dem fünf Jahrhunderte einsamer Wanderung beschieden sind, ehe er sich auf einem Scheiterhaufen aus Weihrauch und Myrrhe selbst der Flamme übergibt. Aus der erkalteten Glut erhebt sich das Geschöpf zu neuem Dasein – ein ewiges Sinnbild der Wiederkehr, das seit den Tempeln von Heliopolis durch das Gedächtnis der Menschheit zieht.',
    traits: [
      ['t-wing', 'Flügelspannweite', '4 m'],
      ['t-time', 'Lebensspanne', '500 Jahre, stets wiederkehrend'],
      ['t-diet', 'Nahrung', 'Weihrauchharz und edle Myrrhe'],
      ['t-range', 'Überliefert aus', 'Heliopolis, Ägypten'],
    ],
    habitat: 'Sonnenheiligtümer, glühende Wüstendämmerungen und antike Chroniken.',
    caption: 'Einmal im Leben verzehrt ihn die Glut – und gebiert ihn aufs Neue.',
    closeup:
      'Jede Schwanzfeder mündet in eine blassgoldene Spitze, die als einziges Fragment dem läuternden Feuer trotzt.',
    lens: '55% 25%',
    feature: [
      'Ein Feuer, das die Jahrhunderte überdauert.',
      'Karmesinrot, golden und voll stiller Geduld. Der Vogel, der dem Ende trotzt.',
    ],
  },
  {
    id: 'kraken',
    no: 'MA-002',
    era: [1180, 1752],
    eraLabel: 'Pontoppidan, 1752',
    scale: '10 m',
    name: 'Krake',
    latin: 'Architeuthis mythos',
    family: 'Seeungeheuer',
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_020342_3e375b40-2c06-4189-995a-acbc21f06142.png&w=900&q=85',
    model:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261031_013537_0dc2c71f-4f11-4a86-ab93-91a59535d5b7.glb',
    yaw: 0.75,
    pitch: 0.12,
    tags: ['Abgründig', 'Schiffsverschlinger', 'Nordisch'],
    lede: 'Aus den lichtlosen Schluchten des Nordmeeres steigt bisweilen ein Rücken empor, den arglose Seeleute für ein neu entstandenes Eiland hielten – bis sich das Meer in einem brüllenden Malstrom auftat. Bischof Pontoppidan verzeichnete dieses Urwesen 1752 als den gewaltigsten Bewohner der Weltmeere: einen schweigenden Herrscher der Tiefe, vor dessen Schatten selbst stolze Segler erstarrten.',
    traits: [
      ['t-ruler', 'Ausdehnung', 'Eine Seemeile im Durchmesser'],
      ['t-depth', 'Lebensraum', 'Tiefseegräben des Nordmeeres'],
      ['t-diet', 'Beute', 'Fischschwärme, Wale und Segelschiffe'],
      ['t-range', 'Überliefert aus', 'Küstengewässer vor Bergen, Norwegen'],
    ],
    habitat: 'Eisige, schwarze Tiefen zwischen den Fjorden Norwegens und Island.',
    caption: 'Das vermeintliche Eiland atmete schwer, und die Mannschaft ließ die Ruder sinken.',
    closeup:
      'Saugnäpfe vom Umfang eines Fassdeckels, jeder einzelne bewehrt mit einem gezackten Hornring.',
    lens: '30% 45%',
    feature: [
      'Eine atmende Insel aus dem Abgrund.',
      'Acht Fangarme, zwei Greiftentakel und tausend Jahre nordischer Seefahrerfurcht.',
    ],
  },
];

export const ERA_MIN = -800;
export const ERA_MAX = 1900;

export function pct(year: number): number {
  return ((year - ERA_MIN) / (ERA_MAX - ERA_MIN)) * 100;
}

export function getEraMetrics(era: [number, number]): {
  left: number;
  width: number;
  alignLeft: boolean;
} {
  const fromPct = pct(era[0]);
  const toPct = pct(era[1]);
  return {
    left: fromPct,
    width: Math.max(0.6, toPct - fromPct),
    alignLeft: fromPct < 50,
  };
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function inCubic(t: number): number {
  return t * t * t;
}

export function outCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

export function outBack(t: number): number {
  const u = t - 1;
  return 1 + 2.2 * u * u * u + 1.2 * u * u;
}

export function dampFactor(dt: number, rate: number): number {
  const cappedDt = Math.min(Math.max(dt, 0), 0.05);
  return 1 - Math.exp(-cappedDt * rate);
}

export function findCreatureIndexByQuery(query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return -1;
  return DINOS.findIndex(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.latin.toLowerCase().includes(q) ||
      d.family.toLowerCase().includes(q) ||
      d.no.toLowerCase().includes(q) ||
      d.eraLabel.toLowerCase().includes(q) ||
      d.habitat.toLowerCase().includes(q) ||
      d.lede.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q)) ||
      d.traits.some(([, label, val]) => label.toLowerCase().includes(q) || val.toLowerCase().includes(q))
  );
}
