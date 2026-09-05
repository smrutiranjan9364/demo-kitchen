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

CREATE TABLE IF NOT EXISTS categories (
  slug        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  image       TEXT NOT NULL,
  description TEXT
);

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
