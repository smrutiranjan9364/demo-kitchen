-- Rosy's Kitchen — Postgres schema.
-- Idempotent: safe to run repeatedly (CREATE TABLE IF NOT EXISTS).
-- Applied by `npm run db:setup`.

CREATE TABLE IF NOT EXISTS products (
  id         TEXT PRIMARY KEY,
  name       TEXT    NOT NULL,
  price      INTEGER NOT NULL,
  rating     REAL    NOT NULL DEFAULT 4.5,
  reviews    INTEGER NOT NULL DEFAULT 0,
  category   TEXT,
  image      TEXT,
  old_price  INTEGER,
  discount   INTEGER
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
-- Migration: tag each product with a district (added after initial release).
ALTER TABLE products ADD COLUMN IF NOT EXISTS district TEXT;
CREATE INDEX IF NOT EXISTS products_district_idx ON products (district);
-- Migration: FSSAI veg / non-veg mark. Almost the whole catalogue is
-- vegetarian, so default true and let the admin flag the exceptions.
ALTER TABLE products ADD COLUMN IF NOT EXISTS veg BOOLEAN NOT NULL DEFAULT true;
-- Migration: inventory. NULL stock = not tracked (never sells out); a number is
-- decremented atomically when an order is placed. weight is a free label
-- ("500 g", "6 pieces") shown next to the price.
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock  INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight TEXT;
-- Migration: what a food customer actually asks. All optional; the page only
-- renders the ones that are filled in.
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life  TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage     TEXT;

CREATE TABLE IF NOT EXISTS categories (
  slug        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  image       TEXT NOT NULL,
  description TEXT
);
-- Migration: categories can be represented by an emoji tile instead of a photo.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Investments / spending ledger: where money is spent, with full details.
CREATE TABLE IF NOT EXISTS investments (
  id             TEXT PRIMARY KEY,
  item           TEXT    NOT NULL,
  category       TEXT,
  amount         INTEGER NOT NULL DEFAULT 0,
  spent_on       TEXT,
  paid_to        TEXT,
  payment_method TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS investments_created_idx ON investments (created_at DESC);

CREATE TABLE IF NOT EXISTS districts (
  slug        TEXT PRIMARY KEY,
  name        TEXT    NOT NULL,
  region      TEXT,
  headquarter TEXT,
  description TEXT,
  image       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS districts_sort_idx ON districts (sort_order, name);

CREATE TABLE IF NOT EXISTS orders (
  id         TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name       TEXT    NOT NULL,
  phone      TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  address    TEXT,
  city       TEXT,
  state      TEXT,
  pincode    TEXT,
  payment    TEXT    NOT NULL,
  items      JSONB   NOT NULL DEFAULT '[]'::jsonb,
  subtotal   INTEGER NOT NULL,
  delivery   INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'Placed'
);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
-- Migration: link orders to a customer account. NULL = guest checkout.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT;
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id);

-- Shopper accounts. Distinct from `users` (admin logins) on purpose.
CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id           TEXT PRIMARY KEY,
  product_id   TEXT NOT NULL,
  product_name TEXT,
  name         TEXT NOT NULL,
  rating       INTEGER NOT NULL,
  comment      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews (product_id);
-- Migration: moderation + verified purchase. New reviews wait for approval.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS approved    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_id TEXT;
-- products.rating / products.reviews are a cache of the approved reviews.
-- Recomputed on every setup so they can never drift (this also replaced the
-- original seeded demo numbers the first time it ran).
UPDATE products p SET
  rating  = COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.approved), 0),
  reviews = (SELECT count(*) FROM reviews r WHERE r.product_id = p.id AND r.approved);

-- Contact-form submissions. `handled` is the admin's "dealt with" tick.
CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  handled    BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages (created_at DESC);

CREATE TABLE IF NOT EXISTS users (
  username      TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  permissions   JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS festival_foods (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  festival TEXT NOT NULL,
  image    TEXT NOT NULL,
  note     TEXT
);

-- Single-row settings table (always id = 1).
CREATE TABLE IF NOT EXISTS settings (
  id                 INTEGER PRIMARY KEY DEFAULT 1,
  store_name         TEXT    NOT NULL,
  email              TEXT    NOT NULL,
  phone              TEXT    NOT NULL,
  delivery_fee       INTEGER NOT NULL,
  free_delivery_over INTEGER NOT NULL,
  CONSTRAINT settings_singleton CHECK (id = 1)
);
-- Migration: FSSAI licence number, shown in the storefront footer.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS fssai TEXT;
-- Migration: serviceable pincode prefixes ("751, 752"). NULL = deliver everywhere.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS delivery_pincodes TEXT;
