// Server-only data store, backed by Postgres (Neon). Products, orders, reviews,
// categories, admin users, festival foods and settings are persisted in the
// database. The static catalog under data/ is only used to *seed* the DB (see
// db/seed.ts); at runtime everything reads/writes SQL.
//
// This module uses the Node Postgres client — import it only from server code
// (server components, route handlers). Never from a "use client" file.
//
// The exported function names and signatures are unchanged from the previous
// file-backed implementation, so no callers needed to change.
import { sql } from "@/lib/db";
import {
  CATALOG_PRODUCTS,
  getProductById as staticGetProductById,
  type Product,
} from "@/data/products";
import { CONTACT, type Category } from "@/data/site";
import { ALL_RIGHTS, type Right } from "@/lib/permissions";

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

// Maps a DB row (snake_case, nulls) to the app's Product shape (camelCase,
// optional fields undefined rather than null).
type ProductRow = {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  category: string | null;
  image: string | null;
  old_price: number | null;
  discount: number | null;
};

function toProduct(r: ProductRow): AdminProduct {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    rating: r.rating,
    reviews: r.reviews,
    category: r.category ?? undefined,
    image: r.image ?? undefined,
    oldPrice: r.old_price ?? undefined,
    discount: r.discount ?? undefined,
  };
}

export async function getProducts(): Promise<AdminProduct[]> {
  const rows = await sql<ProductRow[]>`SELECT * FROM products ORDER BY name`;
  return rows.map(toProduct);
}

export async function getProduct(id: string): Promise<AdminProduct | undefined> {
  const rows = await sql<ProductRow[]>`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
  if (rows[0]) return toProduct(rows[0]);
  // Fall back to curated static items (best-sellers / deals) whose detail
  // pages are linked by their own ids and aren't part of the editable set.
  return staticGetProductById(id);
}

export async function getProductsByCategory(slug: string): Promise<AdminProduct[]> {
  const rows = await sql<ProductRow[]>`
    SELECT * FROM products WHERE category = ${slug} ORDER BY name`;
  return rows.map(toProduct);
}

export async function getRelated(product: AdminProduct, limit = 4): Promise<AdminProduct[]> {
  if (!product.category) return [];
  const rows = await sql<ProductRow[]>`
    SELECT * FROM products
    WHERE category = ${product.category} AND id <> ${product.id}
    ORDER BY name
    LIMIT ${limit}`;
  return rows.map(toProduct);
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
  const id = `${slugify(input.name)}-${Date.now().toString(36)}`;
  const rows = await sql<ProductRow[]>`
    INSERT INTO products (id, name, price, rating, reviews, category, image, old_price, discount)
    VALUES (${id}, ${input.name}, ${input.price}, ${input.rating ?? 4.5}, ${input.reviews ?? 0},
            ${input.category ?? null}, ${input.image ?? null},
            ${input.oldPrice ?? null}, ${input.discount ?? null})
    RETURNING *`;
  return toProduct(rows[0]);
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<AdminProduct | undefined> {
  const existing = await sql<ProductRow[]>`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
  if (!existing[0]) return undefined;
  const cur = existing[0];
  const rows = await sql<ProductRow[]>`
    UPDATE products SET
      name      = ${patch.name ?? cur.name},
      price     = ${patch.price ?? cur.price},
      rating    = ${patch.rating ?? cur.rating},
      reviews   = ${patch.reviews ?? cur.reviews},
      category  = ${patch.category ?? cur.category},
      image     = ${patch.image ?? cur.image},
      old_price = ${patch.oldPrice ?? cur.old_price},
      discount  = ${patch.discount ?? cur.discount}
    WHERE id = ${id}
    RETURNING *`;
  return toProduct(rows[0]);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
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

type OrderRow = {
  id: string;
  created_at: Date;
  name: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  payment: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  status: string;
};

function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    createdAt: r.created_at.toISOString(),
    name: r.name,
    phone: r.phone,
    email: r.email,
    address: r.address ?? undefined,
    city: r.city ?? undefined,
    state: r.state ?? undefined,
    pincode: r.pincode ?? undefined,
    payment: r.payment,
    items: r.items,
    subtotal: r.subtotal,
    delivery: r.delivery,
    total: r.total,
    status: r.status,
  };
}

export async function getOrders(): Promise<Order[]> {
  const rows = await sql<OrderRow[]>`SELECT * FROM orders ORDER BY created_at DESC`;
  return rows.map(toOrder);
}

export async function createOrder(
  data: Omit<Order, "id" | "createdAt" | "status"> & { status?: string },
): Promise<Order> {
  const id = `ord_${Date.now().toString(36)}`;
  const rows = await sql<OrderRow[]>`
    INSERT INTO orders (id, name, phone, email, address, city, state, pincode,
                        payment, items, subtotal, delivery, total, status)
    VALUES (${id}, ${data.name}, ${data.phone}, ${data.email},
            ${data.address ?? null}, ${data.city ?? null}, ${data.state ?? null},
            ${data.pincode ?? null}, ${data.payment},
            ${sql.json(data.items)}, ${data.subtotal}, ${data.delivery},
            ${data.total}, ${data.status ?? "Placed"})
    RETURNING *`;
  return toOrder(rows[0]);
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

type ReviewRow = {
  id: string;
  product_id: string;
  product_name: string | null;
  name: string;
  rating: number;
  comment: string;
  created_at: Date;
};

function toReview(r: ReviewRow): StoredReview {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name ?? undefined,
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at.toISOString(),
  };
}

export async function getReviews(): Promise<StoredReview[]> {
  const rows = await sql<ReviewRow[]>`SELECT * FROM reviews ORDER BY created_at DESC`;
  return rows.map(toReview);
}

export async function createReview(
  data: Omit<StoredReview, "id" | "createdAt">,
): Promise<StoredReview> {
  const id = `rev_${Date.now().toString(36)}`;
  const rows = await sql<ReviewRow[]>`
    INSERT INTO reviews (id, product_id, product_name, name, rating, comment)
    VALUES (${id}, ${data.productId}, ${data.productName ?? null},
            ${data.name}, ${data.rating}, ${data.comment})
    RETURNING *`;
  return toReview(rows[0]);
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

type CategoryRow = {
  slug: string;
  label: string;
  image: string;
  description: string | null;
};

const DEFAULT_CATEGORY_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cofresh_Bombay_Mix.jpg/960px-Cofresh_Bombay_Mix.jpg";

// Returns categories in the frontend `Category` shape, with a live product count.
export async function getCategories(): Promise<Category[]> {
  const rows = await sql<(CategoryRow & { count: number })[]>`
    SELECT c.slug, c.label, c.image, c.description,
           count(p.id)::int AS count
    FROM categories c
    LEFT JOIN products p ON p.category = c.slug
    GROUP BY c.slug, c.label, c.image, c.description
    ORDER BY c.label`;
  return rows.map((c) => ({
    label: c.label,
    href: `/category/${c.slug}`,
    image: c.image,
    description: c.description ?? undefined,
    count: c.count,
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
  const slug = (input.slug?.trim() || slugify(input.label)).replace(/[^a-z0-9-]/g, "");
  if (!slug) return null;
  const existing = await sql`SELECT 1 FROM categories WHERE slug = ${slug} LIMIT 1`;
  if (existing.length > 0) return null;
  const rows = await sql<CategoryRow[]>`
    INSERT INTO categories (slug, label, image, description)
    VALUES (${slug}, ${input.label.trim()},
            ${input.image?.trim() || DEFAULT_CATEGORY_IMAGE},
            ${input.description?.trim() || null})
    RETURNING *`;
  const r = rows[0];
  return { slug: r.slug, label: r.label, image: r.image, description: r.description ?? undefined };
}

export async function updateCategory(
  slug: string,
  patch: Partial<CategoryInput>,
): Promise<RawCategory | undefined> {
  const existing = await sql<CategoryRow[]>`SELECT * FROM categories WHERE slug = ${slug} LIMIT 1`;
  if (!existing[0]) return undefined;
  const cur = existing[0];
  const rows = await sql<CategoryRow[]>`
    UPDATE categories SET
      label       = ${patch.label?.trim() ?? cur.label},
      image       = ${patch.image?.trim() ?? cur.image},
      description = ${patch.description?.trim() ?? cur.description}
    WHERE slug = ${slug}
    RETURNING *`;
  const r = rows[0];
  return { slug: r.slug, label: r.label, image: r.image, description: r.description ?? undefined };
}

export async function deleteCategory(slug: string): Promise<boolean> {
  const rows = await sql`DELETE FROM categories WHERE slug = ${slug} RETURNING slug`;
  return rows.length > 0;
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

type UserRow = {
  username: string;
  password_hash: string;
  salt: string;
  role: string;
  permissions: Right[];
  created_at: Date;
};

function toUser(r: UserRow): AdminUser {
  return {
    username: r.username,
    passwordHash: r.password_hash,
    salt: r.salt,
    role: "admin",
    // Back-fill permissions for any user saved before rights existed.
    permissions: r.permissions ?? ALL_RIGHTS,
    createdAt: r.created_at.toISOString(),
  };
}

export async function getUsers(): Promise<AdminUser[]> {
  const rows = await sql<UserRow[]>`SELECT * FROM users ORDER BY created_at`;
  return rows.map(toUser);
}

export async function findUser(username: string): Promise<AdminUser | undefined> {
  const rows = await sql<UserRow[]>`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
  return rows[0] ? toUser(rows[0]) : undefined;
}

// The rights granted to an admin user (empty if not found).
export async function getUserPermissions(username: string): Promise<Right[]> {
  return (await findUser(username))?.permissions ?? [];
}

export async function createUser(
  data: Omit<AdminUser, "role" | "createdAt" | "permissions"> & { permissions?: Right[] },
): Promise<AdminUser | null> {
  const existing = await sql`SELECT 1 FROM users WHERE username = ${data.username} LIMIT 1`;
  if (existing.length > 0) return null;
  const permissions = (data.permissions ?? ALL_RIGHTS).filter((p) => ALL_RIGHTS.includes(p));
  const rows = await sql<UserRow[]>`
    INSERT INTO users (username, password_hash, salt, role, permissions)
    VALUES (${data.username}, ${data.passwordHash}, ${data.salt}, ${"admin"},
            ${sql.json(permissions)})
    RETURNING *`;
  return toUser(rows[0]);
}

export async function updateUserPermissions(
  username: string,
  permissions: Right[],
): Promise<AdminUser | undefined> {
  const filtered = permissions.filter((p) => ALL_RIGHTS.includes(p));
  const rows = await sql<UserRow[]>`
    UPDATE users SET permissions = ${sql.json(filtered)}
    WHERE username = ${username}
    RETURNING *`;
  return rows[0] ? toUser(rows[0]) : undefined;
}

export async function deleteUser(username: string): Promise<boolean> {
  const rows = await sql`DELETE FROM users WHERE username = ${username} RETURNING username`;
  return rows.length > 0;
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

type FestivalRow = {
  id: string;
  name: string;
  festival: string;
  image: string;
  note: string | null;
};

function toFestival(r: FestivalRow): FestivalFood {
  return {
    id: r.id,
    name: r.name,
    festival: r.festival,
    image: r.image,
    note: r.note ?? undefined,
  };
}

export async function getFestivalFoods(): Promise<FestivalFood[]> {
  const rows = await sql<FestivalRow[]>`SELECT * FROM festival_foods ORDER BY name`;
  return rows.map(toFestival);
}

export async function getFestivalFood(id: string): Promise<FestivalFood | undefined> {
  const rows = await sql<FestivalRow[]>`SELECT * FROM festival_foods WHERE id = ${id} LIMIT 1`;
  return rows[0] ? toFestival(rows[0]) : undefined;
}

export type FestivalInput = {
  name: string;
  festival: string;
  image?: string;
  note?: string;
};

export async function createFestivalFood(input: FestivalInput): Promise<FestivalFood> {
  const id = `${slugify(input.name)}-${Date.now().toString(36)}`;
  const rows = await sql<FestivalRow[]>`
    INSERT INTO festival_foods (id, name, festival, image, note)
    VALUES (${id}, ${input.name.trim()}, ${input.festival.trim()},
            ${input.image?.trim() || DEFAULT_CATEGORY_IMAGE}, ${input.note?.trim() || null})
    RETURNING *`;
  return toFestival(rows[0]);
}

export async function updateFestivalFood(
  id: string,
  patch: Partial<FestivalInput>,
): Promise<FestivalFood | undefined> {
  const existing = await sql<FestivalRow[]>`SELECT * FROM festival_foods WHERE id = ${id} LIMIT 1`;
  if (!existing[0]) return undefined;
  const cur = existing[0];
  const rows = await sql<FestivalRow[]>`
    UPDATE festival_foods SET
      name     = ${patch.name?.trim() ?? cur.name},
      festival = ${patch.festival?.trim() ?? cur.festival},
      image    = ${patch.image?.trim() ?? cur.image},
      note     = ${patch.note?.trim() ?? cur.note}
    WHERE id = ${id}
    RETURNING *`;
  return toFestival(rows[0]);
}

export async function deleteFestivalFood(id: string): Promise<boolean> {
  const rows = await sql`DELETE FROM festival_foods WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

/* ----------------------------- Settings ----------------------------- */

export type Settings = {
  storeName: string;
  email: string;
  phone: string;
  deliveryFee: number;
  freeDeliveryOver: number;
};

type SettingsRow = {
  store_name: string;
  email: string;
  phone: string;
  delivery_fee: number;
  free_delivery_over: number;
};

const DEFAULT_SETTINGS: Settings = {
  storeName: "Odia Kitchen",
  email: CONTACT.email,
  phone: CONTACT.phone,
  deliveryFee: 40,
  freeDeliveryOver: 500,
};

export async function getSettings(): Promise<Settings> {
  const rows = await sql<SettingsRow[]>`SELECT * FROM settings WHERE id = 1 LIMIT 1`;
  if (!rows[0]) {
    // Self-heal if the singleton row is missing (e.g. seed not run yet).
    await sql`
      INSERT INTO settings (id, store_name, email, phone, delivery_fee, free_delivery_over)
      VALUES (1, ${DEFAULT_SETTINGS.storeName}, ${DEFAULT_SETTINGS.email},
              ${DEFAULT_SETTINGS.phone}, ${DEFAULT_SETTINGS.deliveryFee},
              ${DEFAULT_SETTINGS.freeDeliveryOver})
      ON CONFLICT (id) DO NOTHING`;
    return DEFAULT_SETTINGS;
  }
  const r = rows[0];
  return {
    storeName: r.store_name,
    email: r.email,
    phone: r.phone,
    deliveryFee: r.delivery_fee,
    freeDeliveryOver: r.free_delivery_over,
  };
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
  await sql`
    UPDATE settings SET
      store_name         = ${next.storeName},
      email              = ${next.email},
      phone              = ${next.phone},
      delivery_fee       = ${next.deliveryFee},
      free_delivery_over = ${next.freeDeliveryOver}
    WHERE id = 1`;
  return next;
}

// Kept for callers that want the full de-duplicated catalog (e.g. lookups).
export const ALL_CATALOG = CATALOG_PRODUCTS;
