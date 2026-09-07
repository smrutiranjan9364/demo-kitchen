export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  discount?: number;
  image?: string;
  category?: string;
  district?: string;
  veg?: boolean; // undefined = vegetarian (matches the DB default)
  stock?: number; // undefined = not tracked; 0 = sold out
  weight?: string; // pack size label, e.g. "500 g"
  description?: string; // per-product copy; falls back to productDescription()
  ingredients?: string;
  allergens?: string;
  shelfLife?: string;
  storage?: string;
};

export const isSoldOut = (p: Product) => p.stock != null && p.stock <= 0;

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

// Authentic dish photos, sourced from Wikimedia Commons (freely licensed) and
// self-hosted under public/images/wm/ — hotlinking upload.wikimedia.org got the
// Next.js image optimizer rate-limited (429). Used where a real photo of the
// specific Odia dish is available; other pantry staples fall back to generic
// stock photos via img().
const wm = "/images/wm";
const W = {
  chhenaPoda: `${wm}/chhena-poda.jpg`,
  rasgulla: `${wm}/rasgulla.jpg`,
  chhenaJhili: `${wm}/chhena-jhili.jpg`,
  chhenaGaja: `${wm}/chhena-gaja.jpg`,
  rasabali: `${wm}/rasabali.jpg`,
  khaja: `${wm}/khaja.jpg`,
  manda: `${wm}/manda.jpg`,
  arisa: `${wm}/arisa.jpg`,
  kakara: `${wm}/kakara.jpg`,
  chakuli: `${wm}/chakuli.jpg`,
  enduri: `${wm}/enduri.jpg`,
  podaPitha: `${wm}/poda-pitha.jpg`,
  chanachur: `${wm}/chanachur.jpg`,
  chuda: `${wm}/chuda.jpg`,
  ganthia: `${wm}/ganthia.jpg`,
  peanut: `${wm}/peanut.jpg`,
  mudhi: `${wm}/mudhi.jpg`,
  turmeric: `${wm}/turmeric.jpg`,
  mustard: `${wm}/mustard.jpg`,
  dalma: `${wm}/dalma.jpg`,
  santula: `${wm}/santula.jpg`,
  pakhala: `${wm}/pakhala.jpg`,
  garlicPickle: `${wm}/garlic-pickle.jpg`,
  ragi: `${wm}/ragi.jpg`,
  belaPana: `${wm}/bela-pana.jpg`,
  chhatua: `${wm}/chhatua.jpg`,
  ravaCake: `${wm}/rava-cake.jpg`,
  nankhatai: `${wm}/nankhatai.jpg`,
  almonds: `${wm}/almonds.jpg`,
};

// Resolve an image reference: a full URL or a root-relative path (e.g. a
// self-hosted /images/... asset) is used as-is, otherwise it is treated as an
// Unsplash photo id.
const pic = (ref: string) =>
  ref.startsWith("http") || ref.startsWith("/") ? ref : img(ref);

export const BEST_SELLERS: Product[] = [
  { id: "cuttack-chanachur", name: "Cuttack Chanachur", price: 160, rating: 4.8, reviews: 124, image: pic(W.chanachur) },
  { id: "chhena-poda", name: "Chhena Poda", price: 240, rating: 4.9, reviews: 210, image: pic(W.chhenaPoda) },
  { id: "puri-khaja", name: "Puri Khaja", price: 260, rating: 4.9, reviews: 188, image: pic(W.khaja) },
  { id: "manda-pitha", name: "Manda Pitha", price: 190, rating: 4.7, reviews: 89, image: pic(W.manda) },
  { id: "pahala-rasgulla", name: "Pahala Rasgulla", price: 220, rating: 5.0, reviews: 142, image: pic(W.rasgulla) },
];

export type FestivalFood = {
  id: string;
  name: string;
  festival: string;
  image: string;
};

export const FESTIVAL_FOODS: FestivalFood[] = [
  { id: "chhena-poda", name: "Chhena Poda", festival: "Raja Parba", image: pic(W.chhenaPoda) },
  { id: "arisa-pitha", name: "Arisa Pitha", festival: "Makar Sankranti", image: pic(W.arisa) },
  { id: "rasabali", name: "Rasabali", festival: "Kartik Purnima", image: pic(W.rasabali) },
  { id: "enduri-pitha", name: "Enduri Pitha", festival: "Prathamastami", image: pic(W.enduri) },
];

export const TOP_DEALS: Product[] = [
  { id: "puri-khaja-box", name: "Puri Khaja Box", price: 442, oldPrice: 520, rating: 4.9, reviews: 89, discount: 15, image: pic(W.khaja) },
  { id: "namkeen-family-combo", name: "Namkeen Family Combo", price: 256, oldPrice: 320, rating: 4.7, reviews: 124, discount: 20, image: pic(W.chanachur) },
  { id: "kandhamal-spice-set", name: "Kandhamal Spice Set", price: 396, oldPrice: 440, rating: 4.6, reviews: 215, discount: 10, image: pic(W.turmeric) },
  { id: "biri-badi-pack", name: "Biri Badi Pack", price: 152, oldPrice: 190, rating: 4.5, reviews: 76, discount: 20, image: pic("1631452180519-c014fe946bc7") },
  { id: "odia-thali-hamper", name: "Odia Thali Hamper", price: 585, oldPrice: 650, rating: 4.8, reviews: 63, discount: 10, image: pic("1585937421612-70a008356fbe") },
];

// Per-category catalog. Each entry: [name, price, rating, reviews, imageRef].
// imageRef is either a full URL (authentic dish photo) or an Unsplash photo id.
type CatalogItem = [string, number, number, number, string];

const CATALOG: Record<string, CatalogItem[]> = {
  // Namkeen — Odia savoury snacks
  snacks: [
    ["Cuttack Chanachur", 160, 4.8, 124, W.chanachur],
    ["Mudhi Mixture", 120, 4.6, 98, W.mudhi],
    ["Chuda Bhaja", 140, 4.6, 84, W.chuda],
    ["Ganthia Sev", 130, 4.5, 76, W.ganthia],
    ["Roasted Badam Chur", 150, 4.7, 92, W.peanut],
    ["Nimki (Salted Crisps)", 110, 4.5, 61, "1565557623262-b51c2513a641"],
  ],
  // Sweets — traditional Odia mithai
  sweets: [
    ["Chhena Poda", 240, 4.9, 210, W.chhenaPoda],
    ["Pahala Rasgulla", 220, 5.0, 142, W.rasgulla],
    ["Chhena Jhili", 260, 4.8, 118, W.chhenaJhili],
    ["Chhena Gaja", 230, 4.7, 96, W.chhenaGaja],
    ["Rasabali", 210, 4.8, 88, W.rasabali],
    ["Puri Khaja", 260, 4.9, 188, W.khaja],
  ],
  spices: [
    ["Panch Phutana Mix", 130, 4.5, 64, "1596040033229-a9821ebd058d"],
    ["Kandhamal Haladi (Turmeric)", 160, 4.8, 112, W.turmeric],
    ["Dalma Masala", 140, 4.6, 78, "1414235077428-338989a2e8c0"],
    ["Besara Mustard Blend", 120, 4.5, 54, W.mustard],
  ],
  pickles: [
    ["Ambula Amba Achar (Mango)", 150, 4.7, 132, "1600271886742-f049cd451bba"],
    ["Ou Khatta (Elephant Apple)", 160, 4.6, 74, "1567620905732-2d1ec7ab7445"],
    ["Tentuli Khatta (Tamarind)", 120, 4.5, 61, "1482049016688-2d3e1b311543"],
    ["Rasuna Achar (Garlic)", 140, 4.6, 77, W.garlicPickle],
  ],
  "papad-badi": [
    ["Biri Badi (Urad Dal)", 152, 4.5, 76, "1631452180519-c014fe946bc7"],
    ["Chaula Papad (Rice)", 85, 4.3, 39, "1540189549336-e6e99c3679fe"],
    ["Sabu Papad (Sago)", 100, 4.5, 45, "1490645935967-10de6ba17061"],
    ["Saru Badi (Colocasia)", 110, 4.4, 52, "1631452180519-c014fe946bc7"],
  ],
  // Pitha — traditional Odia rice cakes
  pitha: [
    ["Manda Pitha", 190, 4.8, 84, W.manda],
    ["Arisa Pitha", 175, 4.7, 66, W.arisa],
    ["Kakara Pitha", 180, 4.6, 58, W.kakara],
    ["Chakuli Pitha", 130, 4.5, 47, W.chakuli],
    ["Enduri Pitha", 200, 4.8, 72, W.enduri],
    ["Poda Pitha", 210, 4.7, 55, W.podaPitha],
  ],
  "rice-grains": [
    ["Kalajeera Aromatic Rice", 220, 4.7, 96, "1447279506476-3faec8071eee"],
    ["Chuda (Flattened Rice)", 90, 4.4, 74, W.chuda],
    ["Mandia / Ragi Flour", 200, 4.6, 51, W.ragi],
    ["Gobindobhog Rice", 180, 4.5, 63, "1447279506476-3faec8071eee"],
  ],
  beverages: [
    ["Bela Pana Mix", 130, 4.6, 58, W.belaPana],
    ["Chhatua Sattu Drink", 150, 4.5, 44, W.chhatua],
    ["Torani Rice Drink", 120, 4.4, 51, "1547514701-42782101795e"],
    ["Ragi Malt Drink", 160, 4.6, 39, "1565958011703-44f9829ba187"],
  ],
  bakery: [
    ["Suji Cake", 180, 4.7, 47, W.ravaCake],
    ["Nankhatai", 130, 4.6, 55, W.nankhatai],
    ["Coconut Biscuit", 110, 4.5, 62, "1509440159596-0249088772ff"],
    ["Butter Biscuit", 120, 4.6, 88, "1509440159596-0249088772ff"],
  ],
  "dry-fruits": [
    ["Premium Cashews (Kaju)", 380, 4.8, 142, "1610832958506-aa56368176cf"],
    ["Almonds (Badam)", 420, 4.8, 118, W.almonds],
    ["Roasted Makhana", 240, 4.6, 73, "1565299624946-b28f40a0ae38"],
    ["Mixed Dry Fruits", 520, 4.7, 96, "1610832958506-aa56368176cf"],
  ],
  "gift-hampers": [
    ["Chhena Sweets Box", 650, 4.9, 54, "1519676867240-f03562e64548"],
    ["Namkeen Lover's Box", 480, 4.7, 41, "1626074353765-517a681e40be"],
    ["Pitha Festival Hamper", 560, 4.8, 38, W.manda],
    ["Grand Odia Hamper", 890, 4.9, 29, "1585937421612-70a008356fbe"],
  ],
};

export const ALL_PRODUCTS: Product[] = Object.entries(CATALOG).flatMap(
  ([category, list]) =>
    list.map(([name, price, rating, reviews, imageRef], i) => ({
      id: `${category}-${i + 1}`,
      name,
      price,
      rating,
      reviews,
      image: pic(imageRef),
      category,
    })),
);

export function getProductsByCategory(slug: string): Product[] {
  return ALL_PRODUCTS.filter((p) => p.category === slug);
}

// Every product across the site, de-duplicated by id.
export const CATALOG_PRODUCTS: Product[] = (() => {
  const map = new Map<string, Product>();
  for (const p of [...ALL_PRODUCTS, ...BEST_SELLERS, ...TOP_DEALS]) {
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return Array.from(map.values());
})();

export function getProductById(id: string): Product | undefined {
  return CATALOG_PRODUCTS.find((p) => p.id === id);
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  return CATALOG_PRODUCTS.filter(
    (p) => p.id !== product.id && p.category && p.category === product.category,
  ).slice(0, limit);
}

// A generic, human-sounding description used on detail pages.
export function productDescription(p: Product): string {
  return `${p.name} from Odia Kitchen — prepared the traditional Odia way, in small batches, using time-honoured recipes and honest ingredients. Freshly made and carefully packed so it reaches you tasting just like home.`;
}
