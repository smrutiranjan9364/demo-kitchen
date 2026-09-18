-- Additive platform migration. Run with db:setup; existing catalogue is retained.
CREATE TABLE IF NOT EXISTS restaurants (
 id TEXT PRIMARY KEY, owner_id TEXT REFERENCES customers(id), name TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '', cuisine TEXT NOT NULL DEFAULT 'Odia',
 address TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
 pincodes TEXT NOT NULL DEFAULT '', opens TEXT NOT NULL DEFAULT '00:00', closes TEXT NOT NULL DEFAULT '00:00',
 enabled BOOLEAN NOT NULL DEFAULT true, approval TEXT NOT NULL DEFAULT 'pending' CHECK (approval IN ('pending','approved','suspended','rejected')),
 minimum_order INTEGER NOT NULL DEFAULT 0 CHECK(minimum_order >= 0), delivery_fee INTEGER NOT NULL DEFAULT 40 CHECK(delivery_fee >= 0),
 packaging_fee INTEGER NOT NULL DEFAULT 0 CHECK(packaging_fee >= 0), platform_fee INTEGER NOT NULL DEFAULT 0 CHECK(platform_fee >= 0),
 tax_bps INTEGER NOT NULL DEFAULT 0 CHECK(tax_bps BETWEEN 0 AND 10000), eta_minutes INTEGER NOT NULL DEFAULT 45 CHECK(eta_minutes BETWEEN 10 AND 240),
 commission_bps INTEGER NOT NULL DEFAULT 0 CHECK(commission_bps BETWEEN 0 AND 10000), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO restaurants (id,name,approval,pincodes,delivery_fee)
SELECT 'odia-kitchen',store_name,'approved',COALESCE(delivery_pincodes,''),delivery_fee FROM settings WHERE id=1
ON CONFLICT (id) DO NOTHING;
INSERT INTO restaurants (id,name,approval) VALUES ('odia-kitchen','Odia Kitchen','approved') ON CONFLICT DO NOTHING;
ALTER TABLE products ADD COLUMN IF NOT EXISTS restaurant_id TEXT NOT NULL DEFAULT 'odia-kitchen' REFERENCES restaurants(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS products_restaurant_idx ON products(restaurant_id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS addresses (
 id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 label TEXT NOT NULL CHECK(label IN ('Home','Work','Other')), name TEXT NOT NULL, phone TEXT NOT NULL,
 address TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, pincode TEXT NOT NULL,
 landmark TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS addresses_customer_idx ON addresses(customer_id);
CREATE TABLE IF NOT EXISTS riders (
 id TEXT PRIMARY KEY REFERENCES customers(id), vehicle TEXT NOT NULL, approval TEXT NOT NULL DEFAULT 'pending' CHECK(approval IN ('pending','approved','suspended','rejected')),
 online BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_id TEXT NOT NULL DEFAULT 'odia-kitchen' REFERENCES restaurants(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_id TEXT REFERENCES riders(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS landmark TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS instructions TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS breakdown JSONB NOT NULL DEFAULT '{}';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_key TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_hash TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eta_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'due';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_order_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_request_key_idx ON orders(request_key) WHERE request_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_restaurant_status_idx ON orders(restaurant_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS orders_rider_idx ON orders(rider_id,status);
CREATE TABLE IF NOT EXISTS order_events (
 id BIGSERIAL PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), status TEXT NOT NULL,
 actor TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events(order_id,created_at);
CREATE TABLE IF NOT EXISTS coupons (
 code TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('flat','percent','delivery')),
 value INTEGER NOT NULL CHECK(value >= 0), minimum INTEGER NOT NULL DEFAULT 0 CHECK(minimum >= 0),
 maximum INTEGER NOT NULL DEFAULT 1000 CHECK(maximum >= 0), first_order BOOLEAN NOT NULL DEFAULT false,
 expires_at TIMESTAMPTZ NOT NULL, active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS coupon_uses (
 code TEXT NOT NULL REFERENCES coupons(code), customer_id TEXT NOT NULL REFERENCES customers(id),
 order_id TEXT NOT NULL REFERENCES orders(id), PRIMARY KEY(code,customer_id)
);
CREATE TABLE IF NOT EXISTS favorites (
 customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, PRIMARY KEY(customer_id,product_id)
);
CREATE TABLE IF NOT EXISTS notifications (
 id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 title TEXT NOT NULL, href TEXT NOT NULL, read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_customer_idx ON notifications(customer_id,created_at DESC);
CREATE TABLE IF NOT EXISTS support_tickets (
 id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id), order_id TEXT REFERENCES orders(id),
 subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','In progress','Resolved')),
 reply TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_customer_idx ON support_tickets(customer_id,created_at DESC);
CREATE TABLE IF NOT EXISTS auth_challenges (
 id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')), digest TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS challenges_customer_idx ON auth_challenges(customer_id,purpose);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGSERIAL PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS earnings (
 order_id TEXT PRIMARY KEY REFERENCES orders(id), restaurant_id TEXT NOT NULL REFERENCES restaurants(id), rider_id TEXT REFERENCES riders(id),
 restaurant_amount INTEGER NOT NULL, rider_amount INTEGER NOT NULL, commission INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payments (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), provider_payment_id TEXT UNIQUE,
 amount INTEGER NOT NULL CHECK(amount >= 0), status TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS refunds (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), amount INTEGER NOT NULL CHECK(amount > 0),
 reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','processing','completed','rejected')),
 provider_refund_id TEXT UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_reviews (
 order_id TEXT PRIMARY KEY REFERENCES orders(id), customer_id TEXT NOT NULL REFERENCES customers(id),
 restaurant_id TEXT NOT NULL REFERENCES restaurants(id), restaurant_rating INTEGER NOT NULL CHECK(restaurant_rating BETWEEN 1 AND 5),
 delivery_rating INTEGER NOT NULL CHECK(delivery_rating BETWEEN 1 AND 5), comment TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_reviews_restaurant_idx ON order_reviews(restaurant_id,created_at DESC);
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS addons JSONB NOT NULL DEFAULT '[]';
