export const NAV_CATEGORIES = [
  { label: "ALL CATEGORIES", href: "/categories", icon: "grid" },
  { label: "SNACKS", href: "/category/snacks" },
  { label: "SWEETS", href: "/category/sweets" },
  { label: "SPICES", href: "/category/spices" },
  { label: "FESTIVAL", href: "/festival" },
  { label: "CONTACT", href: "/contact" },
];

export const MORE_MENU = [
  { label: "About Us", href: "/about" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Return Policy", href: "/returns" },
];

// Full district record (matches the `districts` DB table). Used both to seed
// the database and as a static fallback for the storefront nav.
export type DistrictSeed = {
  slug: string;
  name: string;
  region: string;
  headquarter: string;
  description?: string;
};

// A single nav entry — the shape the header/mobile menus consume.
export type District = { label: string; href: string };

export const districtHref = (slug: string) => `/district/${slug}`;

export const toDistrictSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// All 30 districts of Odisha, with region + headquarter. Seeds the DB and backs
// the DISTRICTS nav submenu when the database has no rows.
export const DISTRICTS_SEED: DistrictSeed[] = [
  { name: "Angul", region: "Central", headquarter: "Angul" },
  { name: "Balangir", region: "Western", headquarter: "Balangir" },
  { name: "Balasore", region: "Coastal", headquarter: "Baleswar" },
  { name: "Bargarh", region: "Western", headquarter: "Bargarh" },
  { name: "Bhadrak", region: "Coastal", headquarter: "Bhadrak" },
  { name: "Boudh", region: "Western", headquarter: "Boudh" },
  { name: "Cuttack", region: "Coastal", headquarter: "Cuttack" },
  { name: "Deogarh", region: "Northern", headquarter: "Deogarh" },
  { name: "Dhenkanal", region: "Central", headquarter: "Dhenkanal" },
  { name: "Gajapati", region: "Southern", headquarter: "Paralakhemundi" },
  { name: "Ganjam", region: "Southern", headquarter: "Chhatrapur" },
  { name: "Jagatsinghpur", region: "Coastal", headquarter: "Jagatsinghpur" },
  { name: "Jajpur", region: "Coastal", headquarter: "Jajpur" },
  { name: "Jharsuguda", region: "Western", headquarter: "Jharsuguda" },
  { name: "Kalahandi", region: "Western", headquarter: "Bhawanipatna" },
  { name: "Kandhamal", region: "Central", headquarter: "Phulbani" },
  { name: "Kendrapara", region: "Coastal", headquarter: "Kendrapara" },
  { name: "Kendujhar", region: "Northern", headquarter: "Kendujhar" },
  { name: "Khordha", region: "Coastal", headquarter: "Khordha" },
  { name: "Koraput", region: "Southern", headquarter: "Koraput" },
  { name: "Malkangiri", region: "Southern", headquarter: "Malkangiri" },
  { name: "Mayurbhanj", region: "Northern", headquarter: "Baripada" },
  { name: "Nabarangpur", region: "Southern", headquarter: "Nabarangpur" },
  { name: "Nayagarh", region: "Central", headquarter: "Nayagarh" },
  { name: "Nuapada", region: "Western", headquarter: "Nuapada" },
  { name: "Puri", region: "Coastal", headquarter: "Puri" },
  { name: "Rayagada", region: "Southern", headquarter: "Rayagada" },
  { name: "Sambalpur", region: "Western", headquarter: "Sambalpur" },
  { name: "Subarnapur", region: "Western", headquarter: "Sonepur" },
  { name: "Sundargarh", region: "Northern", headquarter: "Sundargarh" },
].map((d) => ({ ...d, slug: toDistrictSlug(d.name) }));

// Nav-shaped list used as a static fallback by the header/mobile menus.
export const DISTRICTS: District[] = DISTRICTS_SEED.map((d) => ({
  label: d.name,
  href: districtHref(d.slug),
}));

export const districtSlug = (d: District) => d.href.replace("/district/", "");

export const getDistrictBySlug = (slug: string) =>
  DISTRICTS_SEED.find((d) => d.slug === slug);

export type Category = {
  label: string;
  href: string;
  // Optional product photo. Most categories are represented by an `emoji`
  // tile instead, so this may be absent.
  image?: string;
  emoji?: string;
  description?: string;
  count?: number;
};

// All categories shown on the /categories page and used as homepage circles.
// Represented by emoji tiles (no sourced photography), so `image` is omitted.
export const CATEGORIES: Category[] = [
  {
    label: "Grains & Cereals",
    href: "/category/grains-cereals",
    emoji: "🌾",
    description: "Wholesome wheat, barley and native cereal grains.",
  },
  {
    label: "Pulses & Lentils",
    href: "/category/pulses-lentils",
    emoji: "🫘",
    description: "Toor, moong, biri and harada dals.",
  },
  {
    label: "Spices & Masala",
    href: "/category/spices",
    emoji: "🌶️",
    description: "Panch phutana, Kandhamal haladi and dalma masala.",
  },
  {
    label: "Rice & Rice Products",
    href: "/category/rice-products",
    emoji: "🍚",
    description: "Aromatic rice, chuda, mudhi and rice flour.",
  },
  {
    label: "Millets & Millet Products",
    href: "/category/millets",
    emoji: "🌾",
    description: "Ragi, mandia and wholesome millet staples.",
  },
  {
    label: "Chhatua & Sattu",
    href: "/category/chhatua-sattu",
    emoji: "🥣",
    description: "Roasted multigrain energy flour, ready to mix.",
  },
  {
    label: "Snacks",
    href: "/category/snacks",
    emoji: "🥨",
    description: "Cuttack chanachur, mudhi mixture and ganthia.",
  },
  {
    label: "Pitha & Traditional Foods",
    href: "/category/pitha",
    emoji: "🫓",
    description: "Manda, arisa, kakara and poda pitha.",
  },
  {
    label: "Pickles & Chutneys",
    href: "/category/pickles",
    emoji: "🥫",
    description: "Amba, ou khatta and rasuna achar.",
  },
  {
    label: "Nuts & Dry Fruits",
    href: "/category/nuts-dry-fruits",
    emoji: "🥜",
    description: "Premium almonds, cashews and dried fruit.",
  },
  {
    label: "Honey & Natural Products",
    href: "/category/honey",
    emoji: "🍯",
    description: "Raw forest honey and natural wellness picks.",
  },
  {
    label: "Tea & Coffee",
    href: "/category/tea-coffee",
    emoji: "☕",
    description: "Aromatic garden teas and fresh-ground coffee.",
  },
  {
    label: "Coconut & Coconut Products",
    href: "/category/coconut",
    emoji: "🥥",
    description: "Coconut, oil and freshly grated goodness.",
  },
  {
    label: "Forest & Tribal Products",
    href: "/category/forest-tribal",
    emoji: "🌿",
    description: "Mahua, kendu and tribal-sourced specialities.",
  },
  {
    label: "Sweets & Confectionery",
    href: "/category/sweets",
    emoji: "🍬",
    description: "Chhena poda, rasgulla and puri khaja.",
  },
  {
    label: "Fruits & Fruit Products",
    href: "/category/fruits",
    emoji: "🥭",
    description: "Seasonal fruit, jams and fruit preserves.",
  },
  {
    label: "Dried Vegetables & Food Products",
    href: "/category/dried-vegetables",
    emoji: "🥬",
    description: "Sun-dried vegetables, badi and papad.",
  },
  {
    label: "Dairy & Milk Products",
    href: "/category/dairy",
    emoji: "🥛",
    description: "Fresh chhena, ghee and milk sweets.",
  },
  {
    label: "Salt & Traditional Ingredients",
    href: "/category/salt",
    emoji: "🧂",
    description: "Sendha salt and everyday pantry basics.",
  },
];

// Circles/marquee on the homepage — the same real categories (no "All").
export const CATEGORY_CIRCLES: Category[] = CATEGORIES;

export const categorySlug = (c: Category) => c.href.replace("/category/", "");

export const getCategoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => categorySlug(c) === slug);

export type FooterLink = { label: string; href?: string };

export const FOOTER_MENU: FooterLink[] = [
  { label: "HOME", href: "/" },
  { label: "MENU", href: "/categories" },
  { label: "SHOP", href: "/shop" },
  { label: "ORDERS" },
  { label: "CART", href: "/cart" },
  { label: "GALLERY" },
  { label: "CONTACT", href: "/contact" },
  { label: "COMPLAINT", href: "/contact" },
];

export const FOOTER_LEGAL: FooterLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Return Policy", href: "/returns" },
  { label: "Sourcing", href: "/about#sourcing" },
  { label: "Gift Cards" },
  { label: "FAQ" },
  { label: "Accessibility" },
];

export const CONTACT = {
  email: "odiakitchen@gmail.com",
  phone: "(+91) 6370649364",
};

const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export type Review = {
  quote: string;
  name: string;
  rating: number;
  avatar: string;
  background: string;
};

export const REVIEWS: Review[] = [
  {
    quote:
      "Every bite tasted like home—authentic Odisha flavours, lovingly prepared and beautifully packed.",
    name: "Verified Customer",
    rating: 5,
    avatar: unsplash("1544005313-94ddf0286df2", 160),
    background: unsplash("1543353071-873f17a7a088", 1600),
  },
  {
    quote:
      "The khaja was exactly like my grandmother used to make. Fresh, crisp, and full of tradition.",
    name: "Ananya Mishra",
    rating: 5,
    avatar: unsplash("1494790108377-be9c29b29330", 160),
    background: unsplash("1511909525232-61113c912358", 1600),
  },
  {
    quote:
      "Beautifully packed and delivered on time. The spice blends brought my kitchen to life.",
    name: "Rakesh Sahoo",
    rating: 5,
    avatar: unsplash("1500648767791-00dcc994a43e", 160),
    background: unsplash("1466637574441-749b8f19452f", 1600),
  },
];
