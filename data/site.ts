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

export type Category = {
  label: string;
  href: string;
  image: string;
  description?: string;
  count?: number;
};

const catImg = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

// All categories shown on the /categories page and used as homepage circles.
export const CATEGORIES: Category[] = [
  {
    label: "Snacks",
    href: "/category/snacks",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cofresh_Bombay_Mix.jpg/960px-Cofresh_Bombay_Mix.jpg",
    description: "Cuttack chanachur, mudhi mixture, chuda bhaja and ganthia.",
    count: 24,
  },
  {
    label: "Sweets",
    href: "/category/sweets",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Bhubaneswar_Odia_Meetup_2013Jan29-23.JPG/960px-Bhubaneswar_Odia_Meetup_2013Jan29-23.JPG",
    description: "Chhena poda, pahala rasgulla, chhena jhili and puri khaja.",
    count: 18,
  },
  {
    label: "Spices",
    href: "/category/spices",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Turmeric_Powder_Spelled_Out.jpg/960px-Turmeric_Powder_Spelled_Out.jpg",
    description: "Panch phutana, Kandhamal haladi and dalma masala.",
    count: 12,
  },
  {
    label: "Pickles & Chutneys",
    href: "/category/pickles",
    image: catImg("1600271886742-f049cd451bba"),
    description: "Amba, ou khatta, tentuli and rasuna achar.",
    count: 16,
  },
  {
    label: "Papad & Badi",
    href: "/category/papad-badi",
    image: catImg("1631452180519-c014fe946bc7"),
    description: "Sun-dried papad and homestyle lentil badi.",
    count: 9,
  },
  {
    label: "Pitha",
    href: "/category/pitha",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/SIJHA_MANDA.jpg/960px-SIJHA_MANDA.jpg",
    description: "Manda, arisa, kakara, enduri and poda pitha.",
    count: 11,
  },
  {
    label: "Rice & Grains",
    href: "/category/rice-grains",
    image: catImg("1447279506476-3faec8071eee"),
    description: "Aromatic rice, millets and wholesome grains.",
    count: 8,
  },
  {
    label: "Beverages",
    href: "/category/beverages",
    image: catImg("1547514701-42782101795e"),
    description: "Sharbat, herbal mixes and refreshing drinks.",
    count: 7,
  },
  {
    label: "Bakery",
    href: "/category/bakery",
    image: catImg("1509440159596-0249088772ff"),
    description: "Freshly baked biscuits, rusks and cakes.",
    count: 10,
  },
  {
    label: "Dry Fruits & Nuts",
    href: "/category/dry-fruits",
    image: catImg("1610832958506-aa56368176cf"),
    description: "Premium nuts, seeds and dried fruit.",
    count: 13,
  },
  {
    label: "Gift Hampers",
    href: "/category/gift-hampers",
    image: catImg("1626074353765-517a681e40be"),
    description: "Curated festive boxes packed with tradition.",
    count: 6,
  },
];

// Circles/marquee on the homepage — the same real categories (no "All").
export const CATEGORY_CIRCLES: Category[] = CATEGORIES;

export const categorySlug = (c: Category) => c.href.replace("/category/", "");

export const getCategoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => categorySlug(c) === slug);

export const FOOTER_MENU = [
  { label: "HOME", href: "/" },
  { label: "MENU", href: "/menu" },
  { label: "SHOP", href: "/shop" },
  { label: "ORDERS", href: "/orders" },
  { label: "CART", href: "/cart" },
  { label: "GALLERY", href: "/gallery" },
  { label: "CONTACT", href: "/contact" },
  { label: "COMPLAINT", href: "/complaint" },
];

export const FOOTER_LEGAL = [
  { label: "About Us", href: "/about" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Return Policy", href: "/returns" },
  { label: "Sourcing", href: "/sourcing" },
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "FAQ", href: "/faq" },
  { label: "Accessibility", href: "/accessibility" },
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
