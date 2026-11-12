export interface Variant {
  id: number;
  a: boolean;
  o: string[];
}

export interface CatalogItem {
  id: string;
  name: string;
  vendor: string;
  type: string;
  price: number;
  priceFormatted: string;
  image: string;
  naturalWidth: number;
  naturalHeight: number;
  mobileWidth: number;
  mobileHeight: number;
  optionLegend: string;
  sizes: string[];
  variants: Variant[];
  url: string;
}

export interface PinData {
  n: number;
  productId: string;
  title: string;
  left: string;
  top: string;
}

export interface LookPieceRef {
  productId: string;
  tag?: string;
}

export interface LookData {
  index: number;
  num: string;
  key: string;
  name: string;
  description: string;
  model640: string;
  model1080: string;
  piecesLabel: string;
  bundleOriginal: string;
  bundlePrice: string;
  pieces: LookPieceRef[];
  pins: PinData[];
}

export interface CatalogData {
  source: string;
  looks: {
    name: string;
    description: string;
    image: string;
    products: string[];
  }[];
  items: CatalogItem[];
}

const ASSET_BASE = 'https://reel-ref-try-the-look.vercel.app/assets';

export const PRODUCTS_MAP: Record<string, CatalogItem> = {
  'tatum-5-orbit-copy': {
    id: 'tatum-5-orbit-copy',
    name: 'Air Jordan 12 Retro',
    vendor: 'Nikey | Password: 1',
    type: 'Aus dem originalen Lookbook',
    price: 149,
    priceFormatted: '$149.00',
    image: `${ASSET_BASE}/source-tatum-5-orbit-copy.webp`,
    naturalWidth: 400,
    naturalHeight: 400,
    mobileWidth: 160,
    mobileHeight: 160,
    optionLegend: 'Schuhgröße',
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    variants: [
      { id: 57015167025457, a: true, o: ['40'] },
      { id: 57015167058225, a: true, o: ['41'] },
      { id: 57015167090993, a: true, o: ['42'] },
      { id: 57015167123761, a: true, o: ['43'] },
      { id: 57015167156529, a: true, o: ['44'] },
      { id: 57015167189297, a: true, o: ['45'] },
      { id: 57015167222065, a: true, o: ['46'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit-copy',
  },
  tshirt: {
    id: 'tshirt',
    name: 'Tshirt',
    vendor: 'Nike',
    type: 'Aus dem originalen Lookbook',
    price: 199,
    priceFormatted: '$199.00',
    image: `${ASSET_BASE}/source-tshirt.webp`,
    naturalWidth: 400,
    naturalHeight: 563,
    mobileWidth: 160,
    mobileHeight: 225,
    optionLegend: 'Größe',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56835911582001, a: true, o: ['S'] },
      { id: 56835911614769, a: true, o: ['L'] },
      { id: 56835911647537, a: true, o: ['M'] },
      { id: 56835911680305, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/tshirt',
  },
  sweatshirt: {
    id: 'sweatshirt',
    name: 'Sweatshirt',
    vendor: 'Nike',
    type: 'Aus dem originalen Lookbook',
    price: 199,
    priceFormatted: '$199.00',
    image: `${ASSET_BASE}/source-sweatshirt.webp`,
    naturalWidth: 400,
    naturalHeight: 581,
    mobileWidth: 160,
    mobileHeight: 232,
    optionLegend: 'Größe',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56835806396721, a: true, o: ['S'] },
      { id: 56835806429489, a: true, o: ['L'] },
      { id: 56835806462257, a: true, o: ['M'] },
      { id: 56835806495025, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt',
  },
  'tatum-5-orbit': {
    id: 'tatum-5-orbit',
    name: 'Tatum 5 Orbit',
    vendor: 'Nikey | Password: 1',
    type: 'Aus dem originalen Lookbook',
    price: 149,
    priceFormatted: '$149.00',
    image: `${ASSET_BASE}/source-tatum-5-orbit.webp`,
    naturalWidth: 400,
    naturalHeight: 400,
    mobileWidth: 160,
    mobileHeight: 160,
    optionLegend: 'Schuhgröße',
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    variants: [
      { id: 57015166730545, a: true, o: ['40'] },
      { id: 57015166763313, a: true, o: ['41'] },
      { id: 57015166796081, a: true, o: ['42'] },
      { id: 57015166828849, a: true, o: ['43'] },
      { id: 57015166861617, a: true, o: ['44'] },
      { id: 57015166894385, a: true, o: ['45'] },
      { id: 57015166927153, a: true, o: ['46'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit',
  },
  'hoodie-black': {
    id: 'hoodie-black',
    name: 'Hoodie Black',
    vendor: 'Nike',
    type: 'Aus dem originalen Lookbook',
    price: 199,
    priceFormatted: '$199.00',
    image: `${ASSET_BASE}/source-hoodie-black.webp`,
    naturalWidth: 400,
    naturalHeight: 536,
    mobileWidth: 160,
    mobileHeight: 214,
    optionLegend: 'Größe',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56836251681073, a: true, o: ['S'] },
      { id: 56836251713841, a: true, o: ['L'] },
      { id: 56836251746609, a: true, o: ['M'] },
      { id: 56836251779377, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/hoodie-black',
  },
  'sweatshirt-plus': {
    id: 'sweatshirt-plus',
    name: 'Sweatshirt Plus',
    vendor: 'Nike',
    type: 'Aus dem originalen Lookbook',
    price: 199,
    priceFormatted: '$199.00',
    image: `${ASSET_BASE}/source-sweatshirt-plus.webp`,
    naturalWidth: 400,
    naturalHeight: 610,
    mobileWidth: 160,
    mobileHeight: 244,
    optionLegend: 'Größe',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56836143743281, a: true, o: ['S'] },
      { id: 56836143776049, a: true, o: ['L'] },
      { id: 56836143808817, a: true, o: ['M'] },
      { id: 56836143841585, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt-plus',
  },
  hoodie: {
    id: 'hoodie',
    name: 'Hoodie',
    vendor: 'Nike',
    type: 'Aus dem originalen Lookbook',
    price: 199,
    priceFormatted: '$199.00',
    image: `${ASSET_BASE}/source-hoodie.webp`,
    naturalWidth: 400,
    naturalHeight: 555,
    mobileWidth: 160,
    mobileHeight: 222,
    optionLegend: 'Größe',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56836002185521, a: true, o: ['S'] },
      { id: 56836002218289, a: true, o: ['L'] },
      { id: 56836002251057, a: true, o: ['M'] },
      { id: 56836002283825, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/hoodie',
  },
  'air-jordan-12-retro-copy': {
    id: 'air-jordan-12-retro-copy',
    name: 'Luka 5',
    vendor: 'Nikey | Password: 1',
    type: 'Aus dem originalen Lookbook',
    price: 149,
    priceFormatted: '$149.00',
    image: `${ASSET_BASE}/source-air-jordan-12-retro-copy.webp`,
    naturalWidth: 400,
    naturalHeight: 400,
    mobileWidth: 160,
    mobileHeight: 160,
    optionLegend: 'Schuhgröße',
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    variants: [
      { id: 57015176364337, a: true, o: ['40'] },
      { id: 57015176397105, a: true, o: ['41'] },
      { id: 57015176429873, a: true, o: ['42'] },
      { id: 57015176462641, a: true, o: ['43'] },
      { id: 57015176495409, a: true, o: ['44'] },
      { id: 57015176528177, a: true, o: ['45'] },
      { id: 57015176560945, a: true, o: ['46'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/air-jordan-12-retro-copy',
  },
};

export const LOOKS: LookData[] = [
  {
    index: 0,
    num: '01',
    key: 'bndthK',
    name: 'Großstadt-Statement',
    description: 'Markanter Strick trifft auf lässiges Denim.',
    model640: `${ASSET_BASE}/model-1-640.webp`,
    model1080: `${ASSET_BASE}/original-look-1.webp`,
    piecesLabel: '3 Pieces',
    bundleOriginal: '$547.00',
    bundlePrice: '$492.30',
    pieces: [
      { productId: 'tatum-5-orbit-copy' },
      { productId: 'tshirt' },
      { productId: 'sweatshirt' },
    ],
    pins: [
      { n: 1, productId: 'tatum-5-orbit-copy', title: 'Air Jordan 12 Retro', left: '47%', top: '27%' },
      { n: 2, productId: 'tshirt', title: 'Tshirt', left: '48%', top: '58%' },
      { n: 3, productId: 'sweatshirt', title: 'Sweatshirt', left: '45%', top: '96%' },
    ],
  },
  {
    index: 1,
    num: '02',
    key: 'XckgG6',
    name: 'Vernissage-Drop',
    description: 'Cleanes Oversized-Shirt und weites Vintage-Denim.',
    model640: `${ASSET_BASE}/model-5-640.webp`,
    model1080: `${ASSET_BASE}/original-look-5.webp`,
    piecesLabel: '3 Pieces',
    bundleOriginal: '$547.00',
    bundlePrice: '$492.30',
    pieces: [
      { productId: 'tatum-5-orbit' },
      { productId: 'hoodie-black', tag: 'Neu' },
      { productId: 'tshirt' },
    ],
    pins: [
      { n: 1, productId: 'tatum-5-orbit', title: 'Tatum 5 Orbit', left: '50%', top: '28%' },
      { n: 2, productId: 'hoodie-black', title: 'Hoodie Black', left: '48%', top: '58%' },
      { n: 3, productId: 'tshirt', title: 'Tshirt', left: '45%', top: '88%' },
    ],
  },
  {
    index: 2,
    num: '03',
    key: 'rLfAhC',
    name: 'Galerie-Avantgarde',
    description: 'Olivgrüner Strukturstrick in erdiger Silhouette.',
    model640: `${ASSET_BASE}/model-4-640.webp`,
    model1080: `${ASSET_BASE}/original-look-4.webp`,
    piecesLabel: '3 Pieces',
    bundleOriginal: '$547.00',
    bundlePrice: '$492.30',
    pieces: [
      { productId: 'sweatshirt-plus' },
      { productId: 'tatum-5-orbit', tag: 'Neu' },
      { productId: 'tshirt' },
    ],
    pins: [
      { n: 1, productId: 'sweatshirt-plus', title: 'Sweatshirt Plus', left: '50%', top: '28%' },
      { n: 2, productId: 'tatum-5-orbit', title: 'Tatum 5 Orbit', left: '48%', top: '58%' },
      { n: 3, productId: 'tshirt', title: 'Tshirt', left: '45%', top: '88%' },
    ],
  },
  {
    index: 3,
    num: '04',
    key: 'FKg67q',
    name: 'Studio-Fokus',
    description: 'Starker Kontrast aus Tiefschwarz und hellem Denim.',
    model640: `${ASSET_BASE}/model-6-640.webp`,
    model1080: `${ASSET_BASE}/original-look-6.webp`,
    piecesLabel: '3 Pieces',
    bundleOriginal: '$547.00',
    bundlePrice: '$492.30',
    pieces: [
      { productId: 'hoodie-black' },
      { productId: 'tatum-5-orbit-copy' },
      { productId: 'tshirt' },
    ],
    pins: [
      { n: 1, productId: 'hoodie-black', title: 'Hoodie Black', left: '50%', top: '28%' },
      { n: 2, productId: 'tatum-5-orbit-copy', title: 'Air Jordan 12 Retro', left: '48%', top: '58%' },
      { n: 3, productId: 'tshirt', title: 'Tshirt', left: '45%', top: '88%' },
    ],
  },
  {
    index: 4,
    num: '05',
    key: '8KREEE',
    name: 'Atelier-Schichten',
    description: 'Burgunder-Layering mit präziser Passform.',
    model640: `${ASSET_BASE}/model-3-640.webp`,
    model1080: `${ASSET_BASE}/original-look-3.webp`,
    piecesLabel: '3 Pieces',
    bundleOriginal: '$547.00',
    bundlePrice: '$492.30',
    pieces: [
      { productId: 'sweatshirt' },
      { productId: 'tatum-5-orbit' },
      { productId: 'tshirt' },
    ],
    pins: [
      { n: 1, productId: 'sweatshirt', title: 'Sweatshirt', left: '50%', top: '28%' },
      { n: 2, productId: 'tatum-5-orbit', title: 'Tatum 5 Orbit', left: '48%', top: '58%' },
      { n: 3, productId: 'tshirt', title: 'Tshirt', left: '45%', top: '88%' },
    ],
  },
  {
    index: 5,
    num: '06',
    key: 'N3bfm9',
    name: 'Street-Ikone',
    description: 'Entspannter Crewneck zum ikonischen Wide-Denim.',
    model640: `${ASSET_BASE}/model-2-640.webp`,
    model1080: `${ASSET_BASE}/original-look-2.webp`,
    piecesLabel: '3 Pieces',
    bundleOriginal: '$547.00',
    bundlePrice: '$492.30',
    pieces: [
      { productId: 'hoodie' },
      { productId: 'air-jordan-12-retro-copy' },
      { productId: 'tshirt' },
    ],
    pins: [
      { n: 1, productId: 'hoodie', title: 'Hoodie', left: '50%', top: '28%' },
      { n: 2, productId: 'air-jordan-12-retro-copy', title: 'Luka 5', left: '48%', top: '58%' },
      { n: 3, productId: 'tshirt', title: 'Tshirt', left: '45%', top: '88%' },
    ],
  },
];

export const NATIVE_CATALOG: CatalogData = {
  source: 'https://nike-makknzjs.myshopify.com/pages/runway',
  looks: LOOKS.map((l) => ({
    name: l.name,
    description: l.description,
    image: l.model640,
    products: l.pieces.map((p) => p.productId),
  })),
  items: [
    PRODUCTS_MAP['tatum-5-orbit-copy'],
    PRODUCTS_MAP['tshirt'],
    PRODUCTS_MAP['sweatshirt'],
    PRODUCTS_MAP['tatum-5-orbit'],
    PRODUCTS_MAP['hoodie-black'],
    PRODUCTS_MAP['sweatshirt-plus'],
    PRODUCTS_MAP['hoodie'],
    PRODUCTS_MAP['air-jordan-12-retro-copy'],
  ],
};
