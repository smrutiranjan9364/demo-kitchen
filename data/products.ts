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
};

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

export const BEST_SELLERS: Product[] = [
  { id: "odia-snack-mix", name: "Odia Snack Mix", price: 160, rating: 4.8, reviews: 124, image: img("1601050690597-df0568f70950") },
  { id: "homestyle-badi", name: "Homestyle Badi", price: 190, rating: 4.5, reviews: 89, image: img("1631452180519-c014fe946bc7") },
  { id: "traditional-khaja", name: "Traditional Khaja", price: 260, rating: 4.9, reviews: 210, image: img("1589301760014-d929f3979dbc") },
  { id: "heritage-spice-blend", name: "Heritage Spice Blend", price: 220, rating: 4.7, reviews: 156, image: img("1596040033229-a9821ebd058d") },
  { id: "odia-favourites-bundle", name: "Odia Favourites Bundle", price: 450, rating: 5.0, reviews: 42, image: img("1585937421612-70a008356fbe") },
];

export type FestivalFood = {
  id: string;
  name: string;
  festival: string;
  image: string;
};

export const FESTIVAL_FOODS: FestivalFood[] = [
  { id: "chhena-poda", name: "Chhena Poda", festival: "Raja Parba", image: img("1606491956689-2ea866880c84") },
  { id: "arisa-pitha", name: "Arisa Pitha", festival: "Makar Sankranti", image: img("1589301760014-d929f3979dbc") },
  { id: "rasabali", name: "Rasabali", festival: "Kartik Purnima", image: img("1517244683847-7456b63c5969") },
  { id: "manda-pitha", name: "Manda Pitha", festival: "Prathamastami", image: img("1590080875515-8a3a8dc5735e") },
];

export const TOP_DEALS: Product[] = [
  { id: "festive-khaja-box", name: "Festive Khaja Box", price: 442, oldPrice: 520, rating: 4.9, reviews: 89, discount: 15, image: img("1519676867240-f03562e64548") },
  { id: "family-snack-combo", name: "Family Snack Combo", price: 256, oldPrice: 320, rating: 4.7, reviews: 124, discount: 20, image: img("1626074353765-517a681e40be") },
  { id: "essential-spices-set", name: "Essential Spices Set", price: 396, oldPrice: 440, rating: 4.6, reviews: 215, discount: 10, image: img("1532336414038-cf19250c5757") },
  { id: "homestyle-badi-pack", name: "Homestyle Badi Pack", price: 152, oldPrice: 190, rating: 4.5, reviews: 76, discount: 20, image: img("1631452180519-c014fe946bc7") },
  { id: "odia-thali-hamper", name: "Odia Thali Hamper", price: 585, oldPrice: 650, rating: 4.8, reviews: 63, discount: 10, image: img("1585937421612-70a008356fbe") },
];

// Per-category catalog. Each entry: [name, price, rating, reviews, imageId].
type CatalogItem = [string, number, number, number, string];

const CATALOG: Record<string, CatalogItem[]> = {
  snacks: [
    ["Odia Snack Mix", 160, 4.8, 124, "1601050690597-df0568f70950"],
    ["Spicy Chuda Bhaja", 140, 4.6, 98, "1626074353765-517a681e40be"],
    ["Roasted Peanut Namkeen", 120, 4.5, 76, "1610832958506-aa56368176cf"],
    ["Family Snack Combo", 256, 4.7, 124, "1626074353765-517a681e40be"],
  ],
  sweets: [
    ["Traditional Khaja", 260, 4.9, 210, "1589301760014-d929f3979dbc"],
    ["Chhena Poda", 240, 4.8, 156, "1606491956689-2ea866880c84"],
    ["Rasabali Pack", 220, 4.7, 88, "1517244683847-7456b63c5969"],
    ["Festive Khaja Box", 442, 4.9, 89, "1519676867240-f03562e64548"],
  ],
  spices: [
    ["Heritage Spice Blend", 220, 4.7, 156, "1596040033229-a9821ebd058d"],
    ["Essential Spices Set", 396, 4.6, 215, "1532336414038-cf19250c5757"],
    ["Panch Phutana Mix", 130, 4.5, 64, "1596040033229-a9821ebd058d"],
    ["Roasted Chilli Powder", 110, 4.6, 92, "1532336414038-cf19250c5757"],
  ],
  meals: [
    ["Odia Thali Hamper", 585, 4.8, 63, "1585937421612-70a008356fbe"],
    ["Dalma Ready Mix", 180, 4.6, 71, "1585937421612-70a008356fbe"],
    ["Santula Combo", 210, 4.5, 54, "1447279506476-3faec8071eee"],
    ["Odia Favourites Bundle", 450, 5.0, 42, "1585937421612-70a008356fbe"],
  ],
  pickles: [
    ["Mango Achar", 150, 4.7, 132, "1600271886742-f049cd451bba"],
    ["Mixed Vegetable Pickle", 160, 4.6, 88, "1600271886742-f049cd451bba"],
    ["Tamarind Chutney", 120, 4.5, 61, "1600271886742-f049cd451bba"],
    ["Garlic Pickle", 140, 4.6, 77, "1600271886742-f049cd451bba"],
  ],
  "papad-badi": [
    ["Homestyle Badi Pack", 152, 4.5, 76, "1631452180519-c014fe946bc7"],
    ["Urad Papad", 90, 4.4, 52, "1631452180519-c014fe946bc7"],
    ["Sabudana Papad", 100, 4.5, 45, "1631452180519-c014fe946bc7"],
    ["Rice Papad", 85, 4.3, 39, "1631452180519-c014fe946bc7"],
  ],
  pitha: [
    ["Manda Pitha", 190, 4.8, 84, "1590080875515-8a3a8dc5735e"],
    ["Arisa Pitha", 175, 4.7, 66, "1589301760014-d929f3979dbc"],
    ["Kakara Pitha", 180, 4.6, 58, "1590080875515-8a3a8dc5735e"],
    ["Chakuli Pitha Mix", 130, 4.5, 47, "1590080875515-8a3a8dc5735e"],
  ],
  "rice-grains": [
    ["Aromatic Basmati Rice", 220, 4.7, 96, "1447279506476-3faec8071eee"],
    ["Brown Rice", 180, 4.5, 63, "1447279506476-3faec8071eee"],
    ["Millet Mix", 200, 4.6, 51, "1447279506476-3faec8071eee"],
    ["Flattened Rice (Chuda)", 90, 4.4, 74, "1447279506476-3faec8071eee"],
  ],
  beverages: [
    ["Bela Pana Mix", 130, 4.6, 58, "1547514701-42782101795e"],
    ["Herbal Sharbat", 150, 4.5, 44, "1547514701-42782101795e"],
    ["Ragi Malt Drink", 160, 4.6, 39, "1547514701-42782101795e"],
    ["Rose Sharbat", 140, 4.4, 51, "1547514701-42782101795e"],
  ],
  bakery: [
    ["Butter Biscuits", 120, 4.6, 88, "1509440159596-0249088772ff"],
    ["Coconut Rusk", 110, 4.5, 62, "1509440159596-0249088772ff"],
    ["Suji Cake", 180, 4.7, 47, "1509440159596-0249088772ff"],
    ["Nankhatai", 130, 4.6, 55, "1509440159596-0249088772ff"],
  ],
  "dry-fruits": [
    ["Premium Cashews", 380, 4.8, 142, "1610832958506-aa56368176cf"],
    ["Almonds", 420, 4.8, 118, "1610832958506-aa56368176cf"],
    ["Mixed Dry Fruits", 520, 4.7, 96, "1610832958506-aa56368176cf"],
    ["Roasted Makhana", 240, 4.6, 73, "1610832958506-aa56368176cf"],
  ],
  "gift-hampers": [
    ["Festive Sweet Hamper", 650, 4.9, 54, "1519676867240-f03562e64548"],
    ["Snack Lover's Box", 480, 4.7, 41, "1626074353765-517a681e40be"],
    ["Spice Gift Set", 560, 4.8, 38, "1532336414038-cf19250c5757"],
    ["Grand Odia Hamper", 890, 4.9, 29, "1585937421612-70a008356fbe"],
  ],
};

export const ALL_PRODUCTS: Product[] = Object.entries(CATALOG).flatMap(
  ([category, list]) =>
    list.map(([name, price, rating, reviews, imageId], i) => ({
      id: `${category}-${i + 1}`,
      name,
      price,
      rating,
      reviews,
      image: img(imageId),
      category,
    })),
);

export function getProductsByCategory(slug: string): Product[] {
  return ALL_PRODUCTS.filter((p) => p.category === slug);
}
