// Server-only fs-backed JSON store. There is no database in this project, so
// products, orders and reviews are persisted as JSON files under data/.store
// (git-ignored). Products are seeded from the static catalog on first read.
//
// This module uses the Node filesystem — import it only from server code
// (server components, route handlers). Never from a "use client" file.
import { promises as fs } from "fs";
import path from "path";
import {
  ALL_PRODUCTS,
  CATALOG_PRODUCTS,
  FESTIVAL_FOODS as SEED_FESTIVAL_FOODS,
  getProductById as staticGetProductById,
  type Product,
} from "@/data/products";
import {
  CATEGORIES as SEED_CATEGORIES,
  categorySlug,
  CONTACT,
  type Category,
} from "@/data/site";
import { ALL_RIGHTS, type Right } from "@/lib/permissions";

const DIR = path.join(process.cwd(), "data", ".store");
const file = (name: string) => path.join(DIR, name);

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file(name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(name: string, data: unknown): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(name), JSON.stringify(data, null, 2), "utf8");
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "product"
  );
}

/* ----------------------------- Products ----------------------------- */

export type AdminProduct = Product;

// The catalog products are the editable set. Seeded from ALL_PRODUCTS (the
// per-category catalog) on first read so the storefront and admin share data.
export async function getProducts(): Promise<AdminProduct[]> {
  const existing = await readJson<AdminProduct[] | null>("products.json", null);
  if (existing) return existing;
  const seed = ALL_PRODUCTS.map((p) => ({ ...p }));
  await writeJson("products.json", seed);
  return seed;
}

export async function getProduct(id: string): Promise<AdminProduct | undefined> {
  const found = (await getProducts()).find((p) => p.id === id);
  // Fall back to curated static items (best-sellers / deals) whose detail
  // pages are linked by their own ids and aren't part of the editable set.
  return found ?? staticGetProductById(id);
}

export async function getProductsByCategory(slug: string): Promise<AdminProduct[]> {
  return (await getProducts()).filter((p) => p.category === slug);
}

export async function getRelated(product: AdminProduct, limit = 4): Promise<AdminProduct[]> {
  return (await getProducts())
    .filter((p) => p.id !== product.id && p.category && p.category === product.category)
    .slice(0, limit);
}

export type ProductInput = {
  name: string;
  price: number;
  category?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  oldPrice?: number;
  discount?: number;
};

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const products = await getProducts();
  const product: AdminProduct = {
    id: `${slugify(input.name)}-${Date.now().toString(36)}`,
    name: input.name,
    price: input.price,
    rating: input.rating ?? 4.5,
    reviews: input.reviews ?? 0,
    category: input.category,
    image: input.image,
    oldPrice: input.oldPrice,
    discount: input.discount,
  };
  products.push(product);
  await writeJson("products.json", products);
  return product;
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<AdminProduct | undefined> {
  const products = await getProducts();
  const i = products.findIndex((p) => p.id === id);
  if (i < 0) return undefined;
  products[i] = { ...products[i], ...patch, id };
  await writeJson("products.json", products);
  return products[i];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await getProducts();
  const next = products.filter((p) => p.id !== id);
  if (next.length === products.length) return false;
  await writeJson("products.json", next);
  return true;
}

/* ------------------------------ Orders ------------------------------ */

export type OrderItem = { id: string; name: string; price: number; qty: number };

export type Order = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  payment: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  status: string;
};

export async function getOrders(): Promise<Order[]> {
  return readJson<Order[]>("orders.json", []);
}

export async function createOrder(
  data: Omit<Order, "id" | "createdAt" | "status"> & { status?: string },
): Promise<Order> {
  const orders = await getOrders();
  const order: Order = {
    ...data,
    id: `ord_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    status: data.status ?? "Placed",
  };
  orders.unshift(order);
  await writeJson("orders.json", orders);
  return order;
}

/* ------------------------------ Reviews ----------------------------- */

export type StoredReview = {
  id: string;
  productId: string;
  productName?: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export async function getReviews(): Promise<StoredReview[]> {
  return readJson<StoredReview[]>("reviews.json", []);
}

export async function createReview(
  data: Omit<StoredReview, "id" | "createdAt">,
): Promise<StoredReview> {
  const reviews = await getReviews();
  const review: StoredReview = {
    ...data,
    id: `rev_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(review);
  await writeJson("reviews.json", reviews);
  return review;
}

/* ---------------------------- Categories ---------------------------- */

// Stored shape (raw). The public getters return the frontend `Category`
// shape (with `href` and a computed product `count`) so existing components
// work unchanged.
type RawCategory = {
  slug: string;
  label: string;
  image: string;
  description?: string;
};

const DEFAULT_CATEGORY_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cofresh_Bombay_Mix.jpg/960px-Cofresh_Bombay_Mix.jpg";

async function getRawCategories(): Promise<RawCategory[]> {
  const existing = await readJson<RawCategory[] | null>("categories.json", null);
  if (existing) return existing;
  const seed: RawCategory[] = SEED_CATEGORIES.map((c) => ({
    slug: categorySlug(c),
    label: c.label,
    image: c.image,
    description: c.description,
  }));
  await writeJson("categories.json", seed);
  return seed;
}

// Returns categories in the frontend `Category` shape, with a live product count.
export async function getCategories(): Promise<Category[]> {
  const [raw, products] = await Promise.all([getRawCategories(), getProducts()]);
  return raw.map((c) => ({
    label: c.label,
    href: `/category/${c.slug}`,
    image: c.image,
    description: c.description,
    count: products.filter((p) => p.category === c.slug).length,
  }));
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.href === `/category/${slug}`);
}

export type CategoryInput = {
  label: string;
  slug?: string;
  image?: string;
  description?: string;
};

// Returns the created category, or null if the slug already exists.
export async function createCategory(input: CategoryInput): Promise<RawCategory | null> {
  const raw = await getRawCategories();
  const slug = (input.slug?.trim() || slugify(input.label)).replace(/[^a-z0-9-]/g, "");
  if (!slug || raw.some((c) => c.slug === slug)) return null;
  const category: RawCategory = {
    slug,
    label: input.label.trim(),
    image: input.image?.trim() || DEFAULT_CATEGORY_IMAGE,
    description: input.description?.trim() || undefined,
  };
  raw.push(category);
  await writeJson("categories.json", raw);
  return category;
}

export async function updateCategory(
  slug: string,
  patch: Partial<CategoryInput>,
): Promise<RawCategory | undefined> {
  const raw = await getRawCategories();
  const i = raw.findIndex((c) => c.slug === slug);
  if (i < 0) return undefined;
  raw[i] = {
    slug,
    label: patch.label?.trim() ?? raw[i].label,
    image: patch.image?.trim() ?? raw[i].image,
    description: patch.description?.trim() ?? raw[i].description,
  };
  await writeJson("categories.json", raw);
  return raw[i];
}

export async function deleteCategory(slug: string): Promise<boolean> {
  const raw = await getRawCategories();
  const next = raw.filter((c) => c.slug !== slug);
  if (next.length === raw.length) return false;
  await writeJson("categories.json", next);
  return true;
}

/* ------------------------------ Admins ------------------------------ */

// Additional "admin"-role users created by a super admin. Passwords are stored
// as scrypt hash + salt (hashing is done in the route via lib/auth). Each admin
// carries a set of granted rights.
export type AdminUser = {
  username: string;
  passwordHash: string;
  salt: string;
  role: "admin";
  permissions: Right[];
  createdAt: string;
};

export async function getUsers(): Promise<AdminUser[]> {
  const users = await readJson<AdminUser[]>("users.json", []);
  // Back-fill permissions for any user saved before rights existed.
  return users.map((u) => ({ ...u, permissions: u.permissions ?? ALL_RIGHTS }));
}

export async function findUser(username: string): Promise<AdminUser | undefined> {
  return (await getUsers()).find((u) => u.username === username);
}

// The rights granted to an admin user (empty if not found).
export async function getUserPermissions(username: string): Promise<Right[]> {
  return (await findUser(username))?.permissions ?? [];
}

export async function createUser(
  data: Omit<AdminUser, "role" | "createdAt" | "permissions"> & { permissions?: Right[] },
): Promise<AdminUser | null> {
  const users = await getUsers();
  if (users.some((u) => u.username === data.username)) return null;
  const permissions = (data.permissions ?? ALL_RIGHTS).filter((p) => ALL_RIGHTS.includes(p));
  const user: AdminUser = {
    username: data.username,
    passwordHash: data.passwordHash,
    salt: data.salt,
    role: "admin",
    permissions,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeJson("users.json", users);
  return user;
}

export async function updateUserPermissions(
  username: string,
  permissions: Right[],
): Promise<AdminUser | undefined> {
  const users = await getUsers();
  const i = users.findIndex((u) => u.username === username);
  if (i < 0) return undefined;
  users[i] = { ...users[i], permissions: permissions.filter((p) => ALL_RIGHTS.includes(p)) };
  await writeJson("users.json", users);
  return users[i];
}

export async function deleteUser(username: string): Promise<boolean> {
  const users = await getUsers();
  const next = users.filter((u) => u.username !== username);
  if (next.length === users.length) return false;
  await writeJson("users.json", next);
  return true;
}

/* ----------------------------- Festival ----------------------------- */

// Festival foods shown on the /festival page. Managed like other content.
export type FestivalFood = {
  id: string;
  name: string;
  festival: string;
  image: string;
  note?: string;
};

// Default descriptions for the seeded items (previously hard-coded in the UI).
const SEED_FESTIVAL_NOTES: Record<string, string> = {
  "chhena-poda": "A caramelised cheese dessert, slow-baked to a smoky, golden finish.",
  "arisa-pitha": "Sweet rice-flour cakes fried in ghee — a Sankranti favourite.",
  rasabali: "Soft fried chhena discs soaked in thickened, cardamom-spiced milk.",
  "enduri-pitha": "Rice-and-lentil cakes steamed in fragrant turmeric leaves — the Prathamastami classic.",
};

async function getRawFestival(): Promise<FestivalFood[] | null> {
  return readJson<FestivalFood[] | null>("festival.json", null);
}

export async function getFestivalFoods(): Promise<FestivalFood[]> {
  const existing = await getRawFestival();
  if (existing) return existing;
  const seed: FestivalFood[] = SEED_FESTIVAL_FOODS.map((f) => ({
    id: f.id,
    name: f.name,
    festival: f.festival,
    image: f.image,
    note: SEED_FESTIVAL_NOTES[f.id],
  }));
  await writeJson("festival.json", seed);
  return seed;
}

export async function getFestivalFood(id: string): Promise<FestivalFood | undefined> {
  return (await getFestivalFoods()).find((f) => f.id === id);
}

export type FestivalInput = {
  name: string;
  festival: string;
  image?: string;
  note?: string;
};

export async function createFestivalFood(input: FestivalInput): Promise<FestivalFood> {
  const foods = await getFestivalFoods();
  const food: FestivalFood = {
    id: `${slugify(input.name)}-${Date.now().toString(36)}`,
    name: input.name.trim(),
    festival: input.festival.trim(),
    image: input.image?.trim() || DEFAULT_CATEGORY_IMAGE,
    note: input.note?.trim() || undefined,
  };
  foods.push(food);
  await writeJson("festival.json", foods);
  return food;
}

export async function updateFestivalFood(
  id: string,
  patch: Partial<FestivalInput>,
): Promise<FestivalFood | undefined> {
  const foods = await getFestivalFoods();
  const i = foods.findIndex((f) => f.id === id);
  if (i < 0) return undefined;
  foods[i] = {
    ...foods[i],
    name: patch.name?.trim() ?? foods[i].name,
    festival: patch.festival?.trim() ?? foods[i].festival,
    image: patch.image?.trim() ?? foods[i].image,
    note: patch.note?.trim() ?? foods[i].note,
    id,
  };
  await writeJson("festival.json", foods);
  return foods[i];
}

export async function deleteFestivalFood(id: string): Promise<boolean> {
  const foods = await getFestivalFoods();
  const next = foods.filter((f) => f.id !== id);
  if (next.length === foods.length) return false;
  await writeJson("festival.json", next);
  return true;
}

/* ----------------------------- Settings ----------------------------- */

export type Settings = {
  storeName: string;
  email: string;
  phone: string;
  deliveryFee: number;
  freeDeliveryOver: number;
};

const DEFAULT_SETTINGS: Settings = {
  storeName: "Odia Kitchen",
  email: CONTACT.email,
  phone: CONTACT.phone,
  deliveryFee: 40,
  freeDeliveryOver: 500,
};

export async function getSettings(): Promise<Settings> {
  const existing = await readJson<Partial<Settings> | null>("settings.json", null);
  if (existing) return { ...DEFAULT_SETTINGS, ...existing };
  await writeJson("settings.json", DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = {
    storeName: patch.storeName?.trim() || current.storeName,
    email: patch.email?.trim() || current.email,
    phone: patch.phone?.trim() || current.phone,
    deliveryFee:
      patch.deliveryFee != null && !Number.isNaN(patch.deliveryFee)
        ? patch.deliveryFee
        : current.deliveryFee,
    freeDeliveryOver:
      patch.freeDeliveryOver != null && !Number.isNaN(patch.freeDeliveryOver)
        ? patch.freeDeliveryOver
        : current.freeDeliveryOver,
  };
  await writeJson("settings.json", next);
  return next;
}

// Kept for callers that want the full de-duplicated catalog (e.g. lookups).
export const ALL_CATALOG = CATALOG_PRODUCTS;
