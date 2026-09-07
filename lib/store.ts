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
import { cache } from "react";
import type { TransactionSql } from "postgres";
import { sql } from "@/lib/db";
import {
  BEST_SELLERS,
  TOP_DEALS,
  CATALOG_PRODUCTS,
  type Product,
} from "@/data/products";
import {
  CONTACT,
  DISTRICTS as STATIC_DISTRICTS,
  type Category,
  type District,
} from "@/data/site";
import { ALL_RIGHTS, type Right } from "@/lib/permissions";
import type { OrderStatus } from "@/lib/orders";

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
  district: string | null;
  image: string | null;
  old_price: number | null;
  discount: number | null;
  veg: boolean;
  stock: number | null;
  weight: string | null;
  description: string | null;
  ingredients: string | null;
  allergens: string | null;
  shelf_life: string | null;
  storage: string | null;
};

function toProduct(r: ProductRow): AdminProduct {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    rating: r.rating,
    reviews: r.reviews,
    category: r.category ?? undefined,
    district: r.district ?? undefined,
    image: r.image ?? undefined,
    oldPrice: r.old_price ?? undefined,
    discount: r.discount ?? undefined,
    veg: r.veg,
    stock: r.stock ?? undefined,
    weight: r.weight ?? undefined,
    description: r.description ?? undefined,
    ingredients: r.ingredients ?? undefined,
    allergens: r.allergens ?? undefined,
    shelfLife: r.shelf_life ?? undefined,
    storage: r.storage ?? undefined,
  };
}

// React.cache shares reads between metadata, layouts and pages within one
// request. It never keeps inventory or prices stale across requests.
export const getProducts = cache(async (): Promise<AdminProduct[]> => {
  const rows = await sql<ProductRow[]>`SELECT * FROM products ORDER BY name`;
  return rows.map(toProduct);
});

export const getProduct = cache(async (id: string): Promise<AdminProduct | undefined> => {
  const rows = await sql<ProductRow[]>`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
  if (rows[0]) return toProduct(rows[0]);
  // Fall back to curated static items (best-sellers / deals) whose detail
  // pages are linked by their own ids and aren't part of the editable set.
  // A deleted DB catalog item must stay deleted. Only the explicitly curated
  // homepage/deal products exist independently of the editable DB catalog.
  const curated = [...BEST_SELLERS, ...TOP_DEALS].find((product) => product.id === id);
  if (!curated) return undefined;
  // Its seeded rating is demo data; overlay the real one from approved reviews.
  return withLiveRating(curated, await getRatingSummary([curated.id]));
});

export const getProductsByCategory = cache(async (slug: string): Promise<AdminProduct[]> => {
  const rows = await sql<ProductRow[]>`
    SELECT * FROM products WHERE category = ${slug} ORDER BY name`;
  return rows.map(toProduct);
});

export const getProductsByDistrict = cache(async (slug: string): Promise<AdminProduct[]> => {
  const rows = await sql<ProductRow[]>`
    SELECT * FROM products WHERE district = ${slug} ORDER BY name`;
  return rows.map(toProduct);
});

export const getRelated = cache(async (product: AdminProduct, limit = 4): Promise<AdminProduct[]> => {
  if (!product.category) return [];
  const rows = await sql<ProductRow[]>`
    SELECT * FROM products
    WHERE category = ${product.category} AND id <> ${product.id}
    ORDER BY name
    LIMIT ${limit}`;
  return rows.map(toProduct);
});

export type ProductInput = {
  name: string;
  price: number;
  category?: string;
  district?: string;
  image?: string;
  oldPrice?: number;
  discount?: number;
  veg?: boolean;
  stock?: number | null; // null clears tracking
  weight?: string | null;
  description?: string | null;
  ingredients?: string | null;
  allergens?: string | null;
  shelfLife?: string | null;
  storage?: string | null;
};

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const id = `${slugify(input.name)}-${Date.now().toString(36)}`;
  const rows = await sql<ProductRow[]>`
    INSERT INTO products (id, name, price, rating, reviews, category, district, image, old_price, discount, veg, stock, weight,
                          description, ingredients, allergens, shelf_life, storage)
    VALUES (${id}, ${input.name}, ${input.price}, 0, 0,
            ${input.category ?? null}, ${input.district ?? null}, ${input.image ?? null},
            ${input.oldPrice ?? null}, ${input.discount ?? null}, ${input.veg ?? true},
            ${input.stock ?? null}, ${input.weight?.trim() || null},
            ${input.description?.trim() || null}, ${input.ingredients?.trim() || null},
            ${input.allergens?.trim() || null}, ${input.shelfLife?.trim() || null},
            ${input.storage?.trim() || null})
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
      category  = ${patch.category ?? cur.category},
      district  = ${patch.district ?? cur.district},
      image     = ${patch.image ?? cur.image},
      old_price = ${patch.oldPrice ?? cur.old_price},
      discount  = ${patch.discount ?? cur.discount},
      veg       = ${patch.veg ?? cur.veg},
      stock     = ${patch.stock !== undefined ? patch.stock : cur.stock},
      weight    = ${patch.weight !== undefined ? patch.weight?.trim() || null : cur.weight},
      description = ${patch.description !== undefined ? patch.description?.trim() || null : cur.description},
      ingredients = ${patch.ingredients !== undefined ? patch.ingredients?.trim() || null : cur.ingredients},
      allergens   = ${patch.allergens !== undefined ? patch.allergens?.trim() || null : cur.allergens},
      shelf_life  = ${patch.shelfLife !== undefined ? patch.shelfLife?.trim() || null : cur.shelf_life},
      storage     = ${patch.storage !== undefined ? patch.storage?.trim() || null : cur.storage}
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
  customerId?: string; // undefined = guest checkout
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
  customer_id: string | null;
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
    customerId: r.customer_id ?? undefined,
  };
}

export async function getOrders(): Promise<Order[]> {
  const rows = await sql<OrderRow[]>`SELECT * FROM orders ORDER BY created_at DESC`;
  return rows.map(toOrder);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const rows = await sql<OrderRow[]>`SELECT * FROM orders WHERE id = ${id} LIMIT 1`;
  return rows[0] ? toOrder(rows[0]) : undefined;
}

export async function getOrdersForCustomer(customerId: string): Promise<Order[]> {
  const rows = await sql<OrderRow[]>`
    SELECT * FROM orders WHERE customer_id = ${customerId} ORDER BY created_at DESC`;
  return rows.map(toOrder);
}

type OrderInput = Omit<Order, "id" | "createdAt" | "status"> & { status?: string };

export async function createOrder(
  data: OrderInput,
  db: typeof sql | TransactionSql = sql,
): Promise<Order> {
  const id = `ord_${Date.now().toString(36)}`;
  const rows = await db<OrderRow[]>`
    INSERT INTO orders (id, name, phone, email, address, city, state, pincode,
                        payment, items, subtotal, delivery, total, status, customer_id)
    VALUES (${id}, ${data.name}, ${data.phone}, ${data.email},
            ${data.address ?? null}, ${data.city ?? null}, ${data.state ?? null},
            ${data.pincode ?? null}, ${data.payment},
            ${db.json(data.items)}, ${data.subtotal}, ${data.delivery},
            ${data.total}, ${data.status ?? "Placed"}, ${data.customerId ?? null})
    RETURNING *`;
  return toOrder(rows[0]);
}

export class OutOfStock extends Error {
  constructor(productName: string, left: number) {
    super(
      left > 0
        ? `Only ${left} of ${productName} left — please reduce the quantity in your cart.`
        : `${productName} is sold out — please remove it from your cart.`,
    );
    this.name = "OutOfStock";
  }
}

// Reserves stock for every line and saves the order in ONE transaction: a
// sold-out item rolls the whole order back, and two shoppers racing for the
// last unit can't both win. The conditional UPDATE is the whole trick — no
// read-then-write. `stock IS NULL` (untracked) always passes and stays NULL.
export async function placeOrder(data: OrderInput): Promise<Order> {
  return sql.begin(async (tx) => {
    for (const line of data.items) {
      const reserved = await tx`
        UPDATE products SET stock = stock - ${line.qty}
        WHERE id = ${line.id} AND (stock IS NULL OR stock >= ${line.qty})
        RETURNING id`;
      if (reserved.length === 0) {
        // No row updated: either genuinely short, or a curated static product
        // with no DB row at all (nothing to reserve — let it through).
        const [row] = await tx<{ stock: number | null }[]>`
          SELECT stock FROM products WHERE id = ${line.id}`;
        if (row) throw new OutOfStock(line.name, row.stock ?? 0);
      }
    }
    return createOrder(data, tx);
  }) as Promise<Order>;
}

// Moves an order along the fulfilment flow. `status` is validated against
// ORDER_STATUSES in the route before it reaches here.
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | undefined> {
  const rows = await sql<OrderRow[]>`
    UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *`;
  return rows[0] ? toOrder(rows[0]) : undefined;
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
  approved: boolean; // only approved reviews are shown on the storefront
  customerId?: string; // the verified buyer who wrote it
};

type ReviewRow = {
  id: string;
  product_id: string;
  product_name: string | null;
  name: string;
  rating: number;
  comment: string;
  created_at: Date;
  approved: boolean;
  customer_id: string | null;
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
    approved: r.approved,
    customerId: r.customer_id ?? undefined,
  };
}

export async function getReviews(): Promise<StoredReview[]> {
  const rows = await sql<ReviewRow[]>`SELECT * FROM reviews ORDER BY created_at DESC`;
  return rows.map(toReview);
}

// Approved only, newest first. Shown publicly on the product page.
export const getReviewsForProduct = cache(async (productId: string): Promise<StoredReview[]> => {
  const rows = await sql<ReviewRow[]>`
    SELECT * FROM reviews WHERE product_id = ${productId} AND approved
    ORDER BY created_at DESC`;
  return rows.map(toReview);
});

export async function createReview(
  data: Omit<StoredReview, "id" | "createdAt" | "approved">,
): Promise<StoredReview> {
  const id = `rev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const rows = await sql<ReviewRow[]>`
    INSERT INTO reviews (id, product_id, product_name, name, rating, comment, customer_id)
    VALUES (${id}, ${data.productId}, ${data.productName ?? null},
            ${data.name}, ${data.rating}, ${data.comment}, ${data.customerId ?? null})
    RETURNING *`;
  return toReview(rows[0]);
}

// products.rating / products.reviews cache the approved-review aggregate so
// every product read stays a plain SELECT. Called whenever approval changes.
async function refreshProductRating(productId: string): Promise<void> {
  await sql`
    UPDATE products SET
      rating  = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = ${productId} AND approved), 0),
      reviews = (SELECT count(*) FROM reviews WHERE product_id = ${productId} AND approved)
    WHERE id = ${productId}`;
}

export async function setReviewApproved(
  id: string,
  approved: boolean,
): Promise<StoredReview | undefined> {
  const rows = await sql<ReviewRow[]>`
    UPDATE reviews SET approved = ${approved} WHERE id = ${id} RETURNING *`;
  if (!rows[0]) return undefined;
  await refreshProductRating(rows[0].product_id);
  return toReview(rows[0]);
}

export async function deleteReview(id: string): Promise<boolean> {
  const rows = await sql<{ product_id: string }[]>`
    DELETE FROM reviews WHERE id = ${id} RETURNING product_id`;
  if (!rows[0]) return false;
  await refreshProductRating(rows[0].product_id);
  return true;
}

// Has this customer got a non-cancelled order containing the product?
// `items` is a JSONB array of {id, ...}; containment does the lookup.
export async function hasPurchased(customerId: string, productId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM orders
    WHERE customer_id = ${customerId} AND status <> 'Cancelled'
      AND items @> ${sql.json([{ id: productId }])}
    LIMIT 1`;
  return rows.length > 0;
}

export async function hasReviewed(customerId: string, productId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM reviews WHERE customer_id = ${customerId} AND product_id = ${productId} LIMIT 1`;
  return rows.length > 0;
}

// Live aggregates for products that have no DB row (curated static items), so
// their seeded demo ratings never reach the page.
export type RatingSummary = Map<string, { rating: number; reviews: number }>;

export async function getRatingSummary(ids: string[]): Promise<RatingSummary> {
  if (ids.length === 0) return new Map();
  const rows = await sql<{ product_id: string; rating: number; n: number }[]>`
    SELECT product_id, AVG(rating)::real AS rating, count(*)::int AS n
    FROM reviews WHERE approved AND product_id = ANY(${ids})
    GROUP BY product_id`;
  return new Map(rows.map((r) => [r.product_id, { rating: r.rating, reviews: r.n }]));
}

export function withLiveRating(product: Product, live: RatingSummary): Product {
  const r = live.get(product.id);
  return { ...product, rating: r?.rating ?? 0, reviews: r?.reviews ?? 0 };
}

/* ----------------------------- Customers ---------------------------- */

// A shopper with an account. Never carries the password hash — that only
// leaves the store through findCustomerForLogin, for the login route.
export type Customer = {
  id: string;
  email: string;
  phone: string;
  name: string;
  createdAt: string;
};

type CustomerRow = {
  id: string;
  email: string;
  phone: string;
  name: string;
  password_hash: string;
  salt: string;
  created_at: Date;
};

function toCustomer(r: CustomerRow): Customer {
  return {
    id: r.id,
    email: r.email,
    phone: r.phone,
    name: r.name,
    createdAt: r.created_at.toISOString(),
  };
}

export const getCustomer = cache(async (id: string): Promise<Customer | undefined> => {
  const rows = await sql<CustomerRow[]>`SELECT * FROM customers WHERE id = ${id} LIMIT 1`;
  return rows[0] ? toCustomer(rows[0]) : undefined;
});

export async function findCustomerForLogin(
  email: string,
): Promise<(Customer & { passwordHash: string; salt: string }) | undefined> {
  const rows = await sql<CustomerRow[]>`SELECT * FROM customers WHERE email = ${email} LIMIT 1`;
  const r = rows[0];
  return r ? { ...toCustomer(r), passwordHash: r.password_hash, salt: r.salt } : undefined;
}

// Returns null when the email is already registered.
export async function createCustomer(data: {
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  salt: string;
}): Promise<Customer | null> {
  const existing = await sql`SELECT 1 FROM customers WHERE email = ${data.email} LIMIT 1`;
  if (existing.length > 0) return null;
  const id = `cus_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const rows = await sql<CustomerRow[]>`
    INSERT INTO customers (id, email, phone, name, password_hash, salt)
    VALUES (${id}, ${data.email}, ${data.phone}, ${data.name}, ${data.passwordHash}, ${data.salt})
    RETURNING *`;
  return toCustomer(rows[0]);
}

/* ----------------------------- Messages ----------------------------- */

// A contact-form submission.
export type Message = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  handled: boolean;
};

type MessageRow = {
  id: string;
  created_at: Date;
  name: string;
  email: string;
  subject: string;
  body: string;
  handled: boolean;
};

function toMessage(r: MessageRow): Message {
  return {
    id: r.id,
    createdAt: r.created_at.toISOString(),
    name: r.name,
    email: r.email,
    subject: r.subject,
    body: r.body,
    handled: r.handled,
  };
}

export async function getMessages(): Promise<Message[]> {
  const rows = await sql<MessageRow[]>`SELECT * FROM messages ORDER BY created_at DESC`;
  return rows.map(toMessage);
}

export async function createMessage(
  data: Omit<Message, "id" | "createdAt" | "handled">,
): Promise<Message> {
  const id = `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const rows = await sql<MessageRow[]>`
    INSERT INTO messages (id, name, email, subject, body)
    VALUES (${id}, ${data.name}, ${data.email}, ${data.subject}, ${data.body})
    RETURNING *`;
  return toMessage(rows[0]);
}

export async function updateMessageHandled(
  id: string,
  handled: boolean,
): Promise<Message | undefined> {
  const rows = await sql<MessageRow[]>`
    UPDATE messages SET handled = ${handled} WHERE id = ${id} RETURNING *`;
  return rows[0] ? toMessage(rows[0]) : undefined;
}

/* ---------------------------- Categories ---------------------------- */

// Stored shape (raw). The public getters return the frontend `Category`
// shape (with `href` and a computed product `count`) so existing components
// work unchanged.
type RawCategory = {
  slug: string;
  label: string;
  image: string;
  emoji?: string;
  description?: string;
};

type CategoryRow = {
  slug: string;
  label: string;
  image: string;
  emoji: string | null;
  description: string | null;
};

const DEFAULT_CATEGORY_IMAGE = "/images/wm/chanachur.jpg";

// Returns categories in the frontend `Category` shape, with a live product count.
export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await sql<(CategoryRow & { count: number })[]>`
    SELECT c.slug, c.label, c.image, c.emoji, c.description,
           count(p.id)::int AS count
    FROM categories c
    LEFT JOIN products p ON p.category = c.slug
    GROUP BY c.slug, c.label, c.image, c.emoji, c.description
    ORDER BY c.label`;
  return rows.map((c) => ({
    label: c.label,
    href: `/category/${c.slug}`,
    image: c.image || undefined,
    emoji: c.emoji ?? undefined,
    description: c.description ?? undefined,
    count: c.count,
  }));
});

export const getCategory = cache(async (slug: string): Promise<Category | undefined> => {
  return (await getCategories()).find((c) => c.href === `/category/${slug}`);
});

export type CategoryInput = {
  label: string;
  slug?: string;
  image?: string;
  emoji?: string;
  description?: string;
};

// Returns the created category, or null if the slug already exists.
export async function createCategory(input: CategoryInput): Promise<RawCategory | null> {
  const slug = (input.slug?.trim() || slugify(input.label)).replace(/[^a-z0-9-]/g, "");
  if (!slug) return null;
  const existing = await sql`SELECT 1 FROM categories WHERE slug = ${slug} LIMIT 1`;
  if (existing.length > 0) return null;
  const rows = await sql<CategoryRow[]>`
    INSERT INTO categories (slug, label, image, emoji, description)
    VALUES (${slug}, ${input.label.trim()},
            ${input.image?.trim() || (input.emoji?.trim() ? "" : DEFAULT_CATEGORY_IMAGE)},
            ${input.emoji?.trim() || null},
            ${input.description?.trim() || null})
    RETURNING *`;
  const r = rows[0];
  return {
    slug: r.slug,
    label: r.label,
    image: r.image,
    emoji: r.emoji ?? undefined,
    description: r.description ?? undefined,
  };
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
      emoji       = ${patch.emoji?.trim() ?? cur.emoji},
      description = ${patch.description?.trim() ?? cur.description}
    WHERE slug = ${slug}
    RETURNING *`;
  const r = rows[0];
  return {
    slug: r.slug,
    label: r.label,
    image: r.image,
    emoji: r.emoji ?? undefined,
    description: r.description ?? undefined,
  };
}

export async function deleteCategory(slug: string): Promise<boolean> {
  const rows = await sql`DELETE FROM categories WHERE slug = ${slug} RETURNING slug`;
  return rows.length > 0;
}

/* ----------------------------- Districts ---------------------------- */

// A district of Odisha. Managed in the admin and shown as a storefront nav
// submenu + landing page (/district/<slug>).
export type AdminDistrict = {
  slug: string;
  name: string;
  region?: string;
  headquarter?: string;
  description?: string;
  image?: string;
  sortOrder: number;
};

type DistrictRow = {
  slug: string;
  name: string;
  region: string | null;
  headquarter: string | null;
  description: string | null;
  image: string | null;
  sort_order: number;
};

function toDistrict(r: DistrictRow): AdminDistrict {
  return {
    slug: r.slug,
    name: r.name,
    region: r.region ?? undefined,
    headquarter: r.headquarter ?? undefined,
    description: r.description ?? undefined,
    image: r.image ?? undefined,
    sortOrder: r.sort_order,
  };
}

export const getDistricts = cache(async (): Promise<AdminDistrict[]> => {
  const rows = await sql<DistrictRow[]>`
    SELECT * FROM districts ORDER BY sort_order, name`;
  return rows.map(toDistrict);
});

export const getDistrict = cache(async (slug: string): Promise<AdminDistrict | undefined> => {
  const rows = await sql<DistrictRow[]>`SELECT * FROM districts WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? toDistrict(rows[0]) : undefined;
});

export type DistrictInput = {
  name: string;
  slug?: string;
  region?: string;
  headquarter?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
};

// Returns the created district, or null if the slug already exists / is empty.
export async function createDistrict(input: DistrictInput): Promise<AdminDistrict | null> {
  const slug = (input.slug?.trim() || slugify(input.name)).replace(/[^a-z0-9-]/g, "");
  if (!slug) return null;
  const existing = await sql`SELECT 1 FROM districts WHERE slug = ${slug} LIMIT 1`;
  if (existing.length > 0) return null;
  const rows = await sql<DistrictRow[]>`
    INSERT INTO districts (slug, name, region, headquarter, description, image, sort_order)
    VALUES (${slug}, ${input.name.trim()}, ${input.region?.trim() || null},
            ${input.headquarter?.trim() || null}, ${input.description?.trim() || null},
            ${input.image?.trim() || null}, ${input.sortOrder ?? 0})
    RETURNING *`;
  return toDistrict(rows[0]);
}

export async function updateDistrict(
  slug: string,
  patch: Partial<DistrictInput>,
): Promise<AdminDistrict | undefined> {
  const existing = await sql<DistrictRow[]>`SELECT * FROM districts WHERE slug = ${slug} LIMIT 1`;
  if (!existing[0]) return undefined;
  const cur = existing[0];
  const rows = await sql<DistrictRow[]>`
    UPDATE districts SET
      name        = ${patch.name?.trim() ?? cur.name},
      region      = ${patch.region?.trim() ?? cur.region},
      headquarter = ${patch.headquarter?.trim() ?? cur.headquarter},
      description = ${patch.description?.trim() ?? cur.description},
      image       = ${patch.image?.trim() ?? cur.image},
      sort_order  = ${patch.sortOrder ?? cur.sort_order}
    WHERE slug = ${slug}
    RETURNING *`;
  return toDistrict(rows[0]);
}

export async function deleteDistrict(slug: string): Promise<boolean> {
  const rows = await sql`DELETE FROM districts WHERE slug = ${slug} RETURNING slug`;
  return rows.length > 0;
}

// Nav-shaped list for the storefront header/mobile menus. Falls back to the
// static seed list if the table is empty or unreachable.
export const getDistrictNav = cache(async (): Promise<District[]> => {
  try {
    const rows = await getDistricts();
    if (rows.length > 0) {
      return rows.map((d) => ({ label: d.name, href: `/district/${d.slug}` }));
    }
  } catch {
    /* fall through to static list */
  }
  return STATIC_DISTRICTS;
});

/* ---------------------------- Investments --------------------------- */

// A spending / investment entry — where money went, with full details.
// `amount` is whole rupees (₹), matching the products.price convention.
export type Investment = {
  id: string;
  item: string;
  category?: string;
  amount: number;
  spentOn?: string; // ISO date "YYYY-MM-DD"
  paidTo?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
};

type InvestmentRow = {
  id: string;
  item: string;
  category: string | null;
  amount: number;
  spent_on: string | null;
  paid_to: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: Date;
};

function toInvestment(r: InvestmentRow): Investment {
  return {
    id: r.id,
    item: r.item,
    category: r.category ?? undefined,
    amount: r.amount,
    spentOn: r.spent_on ?? undefined,
    paidTo: r.paid_to ?? undefined,
    paymentMethod: r.payment_method ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at.toISOString(),
  };
}

// Newest spending first (by the date the money was spent, then entry time).
export const getInvestments = cache(async (): Promise<Investment[]> => {
  const rows = await sql<InvestmentRow[]>`
    SELECT * FROM investments ORDER BY spent_on DESC NULLS LAST, created_at DESC`;
  return rows.map(toInvestment);
});

export type InvestmentInput = {
  item: string;
  category?: string;
  amount: number;
  spentOn?: string;
  paidTo?: string;
  paymentMethod?: string;
  notes?: string;
};

export async function createInvestment(input: InvestmentInput): Promise<Investment> {
  const id = `inv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const rows = await sql<InvestmentRow[]>`
    INSERT INTO investments (id, item, category, amount, spent_on, paid_to, payment_method, notes)
    VALUES (${id}, ${input.item.trim()}, ${input.category?.trim() || null},
            ${Math.round(input.amount) || 0}, ${input.spentOn?.trim() || null},
            ${input.paidTo?.trim() || null}, ${input.paymentMethod?.trim() || null},
            ${input.notes?.trim() || null})
    RETURNING *`;
  return toInvestment(rows[0]);
}

export async function updateInvestment(
  id: string,
  patch: Partial<InvestmentInput>,
): Promise<Investment | undefined> {
  const existing = await sql<InvestmentRow[]>`SELECT * FROM investments WHERE id = ${id} LIMIT 1`;
  if (!existing[0]) return undefined;
  const cur = existing[0];
  const rows = await sql<InvestmentRow[]>`
    UPDATE investments SET
      item           = ${patch.item?.trim() ?? cur.item},
      category       = ${patch.category?.trim() ?? cur.category},
      amount         = ${patch.amount != null ? Math.round(patch.amount) : cur.amount},
      spent_on       = ${patch.spentOn?.trim() ?? cur.spent_on},
      paid_to        = ${patch.paidTo?.trim() ?? cur.paid_to},
      payment_method = ${patch.paymentMethod?.trim() ?? cur.payment_method},
      notes          = ${patch.notes?.trim() ?? cur.notes}
    WHERE id = ${id}
    RETURNING *`;
  return toInvestment(rows[0]);
}

export async function deleteInvestment(id: string): Promise<boolean> {
  const rows = await sql`DELETE FROM investments WHERE id = ${id} RETURNING id`;
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

export const getFestivalFoods = cache(async (): Promise<FestivalFood[]> => {
  const rows = await sql<FestivalRow[]>`SELECT * FROM festival_foods ORDER BY name`;
  return rows.map(toFestival);
});

export const getFestivalFood = cache(async (id: string): Promise<FestivalFood | undefined> => {
  const rows = await sql<FestivalRow[]>`SELECT * FROM festival_foods WHERE id = ${id} LIMIT 1`;
  return rows[0] ? toFestival(rows[0]) : undefined;
});

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
  fssai: string; // FSSAI licence number; "" until the owner enters it
  deliveryPincodes: string; // pincode prefixes, "" = deliver everywhere
};

type SettingsRow = {
  store_name: string;
  email: string;
  phone: string;
  delivery_fee: number;
  free_delivery_over: number;
  fssai: string | null;
  delivery_pincodes: string | null;
};

const DEFAULT_SETTINGS: Settings = {
  storeName: "Odia Kitchen",
  email: CONTACT.email,
  phone: CONTACT.phone,
  deliveryFee: 40,
  freeDeliveryOver: 500,
  fssai: "",
  deliveryPincodes: "",
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
    fssai: r.fssai ?? "",
    deliveryPincodes: r.delivery_pincodes ?? "",
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
    // Unlike the others, an empty string is a valid value here (clears it).
    fssai: typeof patch.fssai === "string" ? patch.fssai.trim() : current.fssai,
    deliveryPincodes:
      typeof patch.deliveryPincodes === "string"
        ? patch.deliveryPincodes.trim()
        : current.deliveryPincodes,
  };
  await sql`
    UPDATE settings SET
      store_name         = ${next.storeName},
      email              = ${next.email},
      phone              = ${next.phone},
      delivery_fee       = ${next.deliveryFee},
      free_delivery_over = ${next.freeDeliveryOver},
      fssai              = ${next.fssai || null},
      delivery_pincodes  = ${next.deliveryPincodes || null}
    WHERE id = 1`;
  return next;
}

// Kept for callers that want the full de-duplicated catalog (e.g. lookups).
export const ALL_CATALOG = CATALOG_PRODUCTS;
