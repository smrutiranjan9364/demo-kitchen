# Odia Kitchen — Implementation Plan

Written 2026-09-07, after the checkout milestone landed (real cart → validated
checkout → server-priced order → admin status updates → honest confirmation).

Each milestone ships something the business can use on its own. Do them in
order; dependencies are noted where they exist. Every milestone lists **Done
when** — if you can't demo that sentence, it isn't finished.

## Status

| Milestone | State | Notes |
|---|---|---|
| Quick wins | ✅ Done 2026-09-07 | Fake reviews removed; product page reads real reviews from the DB. Veg/non-veg mark on cards and detail (`products.veg`, default true). FSSAI number in Settings → footer (`settings.fssai`). |
| M1 | ✅ Done 2026-09-07 | `lib/mail.ts` (nodemailer over SMTP — Gmail App Password works, no domain needed; switched from Resend 2026-09-07). Order-placed mail to kitchen + customer; status mail on Confirmed/Dispatched/Delivered/Cancelled. Contact form → `messages` table + admin inbox with handled toggle + honeypot. **Set `SMTP_HOST/USER/PASS` and `MAIL_FROM` to actually send** — unset, mails are logged to the dev server console. |
| M2 | ✅ Done 2026-09-07 | `products.stock` (NULL = untracked) + `products.weight`. `placeOrder()` reserves stock and inserts the order in one transaction via a conditional `UPDATE`; sold-out → 409 naming the item. Sold-out state on cards, product page and buttons; qty steppers cap at stock. Admin: stock/pack-size fields, stock column, low-stock card on Overview. **Verified:** stock 1, two concurrent orders → exactly one 201, one 409. Skipped: a cart-line stock warning — checkout's 409 message names the item, which covers it. |
| M3 | ✅ Done 2026-09-07 | `customers` table + `orders.customer_id` (NULL = guest). Tokens moved to `lib/token.ts` with a `k: "admin" \| "customer"` discriminator — a customer cookie presented as `ok_admin` is rejected (unit-tested + verified live: 307 to login, 403 on admin API). `/api/account/{register,login,logout}`; LoginModal is real (Google button and dead "forgot password" link removed). `/account` (orders list, or guest lookup by id + phone) and `/account/orders/[id]` (status timeline, Buy again, owner-or-phone access). Checkout prefills from last order; confirmation screen links to tracking. Guest checkout unchanged. **Note:** existing admin sessions were invalidated by the token format change — admins log in once more. |
| M4 | ✅ Done 2026-09-07 | Seeded ratings retired: `products.rating`/`reviews` are now a cache of **approved** reviews, recomputed on every `db:setup` and on each approve/hide/delete; products with none show **NEW**. Curated static items get the same overlay via `getRatingSummary`. Reviews require a signed-in customer with a non-cancelled order containing the product (`items @>` JSONB check), one per product; they land unapproved. Admin Reviews page: approve / hide / delete, pending-count badge. Rating / Reviews-count inputs removed from the product editor; seed no longer writes demo ratings. Guests can't review — that's the spam control. |
| M5 | ✅ Done 2026-09-07 | `products.description / ingredients / allergens / shelf_life / storage` — editable in the product editor, rendered on the product page only when filled (plus "From … district"). A per-product description overrides the generic house sentence, which stays as the fallback so no page goes blank. `settings.delivery_pincodes` (comma-separated prefixes; blank = everywhere): the orders API rejects out-of-area pincodes server-side, checkout shows a live ✓/✗ under the pincode field and disables Place Order, and a "Check delivery" box appears on product and cart pages once an area is configured. `isServiceable` unit-tested. **Nothing is filled in yet** — the owner enters ingredients etc. per product and the pincode list in Settings. |
| M6 | ✅ Option 1 done 2026-09-07 | `PAYMENT_METHODS` is now just Cash on Delivery — UPI and Card recorded a label and collected nothing, so checkout no longer offers them. The orders API rejects them as "Please choose a payment method." Existing orders that say UPI/Card are untouched. **Option 2 (Razorpay) remains deferred** until volume justifies a gateway. A cheaper middle step if you want UPI without a gateway: a "UPI on confirmation" method + `orders.paid` flag + your UPI ID in Settings/the confirmation mail, marked paid from the admin orders page. |

---

## Quick wins — half a day, do before M1

Small, independent, and two of them are currently lying to customers.

| Task | Files | Why now |
|---|---|---|
| Delete `SAMPLE_REVIEWS` from the product page | `app/(storefront)/product/[id]/page.tsx`, `data/products.ts` | The same three fake reviews render on every product. "No reviews yet" beats invented ones. |
| FSSAI licence number in the footer | `lib/store.ts` (settings), `components/layout/Footer.tsx` | Legally required for food sold in India. One settings field, one footer line. |
| Veg / non-veg mark | `db/schema.sql`, `components/home/ProductCard.tsx`, product detail | Also legally required. `ALTER TABLE products ADD COLUMN veg BOOLEAN DEFAULT true` plus the green/brown dot. |

---

## M1 — Know that a sale happened

**Goal:** an order or a message reaches a human without anyone watching a
browser tab. The repo contains zero notification code, so a sale is invisible
until someone refreshes the admin panel.

### Schema

```sql
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
```

### Work

1. **`lib/mail.ts`** — one function, `sendMail({ to, subject, text })`. Resend
   is one dependency and one API key. If you already have a mailbox with SMTP,
   `nodemailer` is the alternative — same interface either way.
2. **Order placed** → mail the kitchen (`settings.email`) and the customer.
   Wire into `app/api/orders/route.ts` *after* the insert succeeds.
3. **Status changed** → mail the customer on Confirmed / Dispatched / Delivered
   only. Wire into `app/api/admin/orders/[id]/route.ts`. Skip the other stages;
   nobody wants five emails per order.
4. **Contact form** → `app/api/contact/route.ts` writes a `messages` row *and*
   mails the kitchen. Rewrite `components/contact/ContactForm.tsx` to await the
   response the way `CheckoutClient` now does — no more fake "Message sent".
5. **Admin inbox** → `app/backend/dashboard/messages/page.tsx` +
   `components/admin/MessagesAdmin.tsx` (copy `OrdersAdmin`), a `messages` entry
   in `lib/permissions.ts`, and a nav item in `AdminShell`.

### Key decision — mail must never break an order

The order is already saved by the time you send. A mail failure is not an order
failure:

```ts
// after createOrder(...) succeeds
await sendMail({ /* ... */ }).catch((err) => console.error("order mail failed", err));
```

Await it so serverless doesn't kill the request early, but swallow the error.
The customer already has their order number; the kitchen still has the admin panel.

### Done when

You place an order on your phone and your inbox pings without you touching the
laptop, and a contact form submission shows up in the admin inbox.

**Deliberately skipped:** HTML email templates, a send queue, retries, WhatsApp.
Plain text first — add HTML when someone complains it looks plain, add WhatsApp
Business API when email proves too slow for a same-day kitchen.

---

## M2 — Don't sell what you don't have

**Goal:** a sold-out item cannot be ordered. This is the failure that causes
refunds and angry phone calls, and there is no stock concept anywhere in the
codebase today.

### Schema

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock  INTEGER;  -- NULL = untracked
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight TEXT;     -- "500 g", "6 pieces"
```

`stock IS NULL` means "don't track this one", so you can switch on inventory for
the ten things that actually run out without setting a number on all sixty
products first.

### Key decision — decrementing stock must be atomic

Two shoppers hitting checkout at once will oversell if you read-then-write. Do it
in one statement, inside the same transaction as the order insert:

```ts
await sql.begin(async (tx) => {
  for (const line of items) {
    const [row] = await tx`
      UPDATE products SET stock = stock - ${line.qty}
      WHERE id = ${line.id} AND (stock IS NULL OR stock >= ${line.qty})
      RETURNING id`;
    if (!row) throw new OutOfStock(line.name);   // rolls the whole order back
  }
  // insert the order on tx, not on the module-level sql
});
```

`NULL - qty` stays `NULL`, so untracked products fall through untouched. Note
this requires `createOrder` in `lib/store.ts` to accept an optional transaction
handle — it currently closes over the module-level `sql`.

### Work

- Storefront: sold-out state on `ProductCard`, `AddToCartButton`,
  `ProductActions`; a warning on the cart line; checkout blocks with the
  server's message.
- Admin: stock and weight fields in `ProductsAdmin`, a low-stock count on the
  dashboard overview.
- Show `weight` next to the price everywhere the price appears. "Almonds ₹420"
  is unanswerable without it.

### Done when

Set a product's stock to 1, order it in two browser windows at once, and exactly
one order succeeds.

**Deliberately skipped:** a real variant system (250 g / 500 g / 1 kg as separate
purchasable options). That needs per-variant SKUs, prices, stock, and cart lines
keyed by variant — much bigger than a `weight` label. Build it when customers ask
for a size they can't get, not before.

---

## M3 — Customers can see their own orders

**Goal:** close the tab after checkout and still be able to check your order.
There is no `/orders` or `/track` route today, and
`components/auth/LoginModal.tsx` is theatre — the Google button just closes the
dialog and Register only flips to the login tab.

### Schema

```sql
CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT;  -- NULL = guest
```

### Key decision — a customer token must never open the admin panel

Reuse the scrypt hashing and HMAC token in `lib/auth.ts`, but the payload needs a
discriminator and `verifyToken` must check it. Without that, the shared signing
secret makes a customer session a structurally valid admin session:

```ts
type Payload = { u: string; r: Role; t: number; k: "admin" | "customer" };
```

Separate cookie name, separate `getCustomer()` helper, and `getSession()` must
reject anything where `k !== "admin"`.

### Work

- `app/api/account/{register,login,logout}/route.ts`.
- Wire `LoginModal` to them. **Remove the Google button** — OAuth is its own
  project, and a button that silently does nothing is worse than no button.
- `/account/orders` (list) and `/account/orders/[id]` (status timeline).
- **Guest lookup:** order id + phone number → status, no account needed. Cheap,
  and it covers everyone who won't sign up.
- **Buy again:** a button on a past order that pushes those lines into the
  existing `CartContext`. Nearly free once the history page exists.
- **Saved address:** prefill checkout from the customer's most recent order. No
  address-book table, no new UI.

### Guard rail

**Guest checkout must keep working.** `orders.customer_id` stays nullable and
checkout must never require an account — forcing signup at checkout is the most
reliable way to lose orders.

### Done when

You register, order, close the browser, come back, log in, see the order with its
current status, and hit "Buy again" to refill the cart.

---

## M4 — Real reviews (depends on M3)

**Goal:** the reviews on a product page are reviews of that product, by people
who bought it. Real reviews currently POST to the database but the storefront
never reads them back — a customer's review is saved to *their own*
`localStorage`, so they are the only person who ever sees it.

### Schema

```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id TEXT;
```

### Work

- `getReviewsForProduct(id)` in `lib/store.ts`, approved rows only.
- Product page reads it. Delete the `localStorage` review store in
  `components/product/ProductReviews.tsx`.
- Rating and count come from `AVG(rating)` / `COUNT(*)` over approved rows.
- `api/reviews/route.ts`: require an order containing that product, under that
  customer or that email. Add a rate limit.
- Admin: approve / reject buttons on the reviews page.

### Decision you need to make

The seeded `rating` and `reviews` numbers on every product are invented. Once
real reviews drive the display, either:

- **wipe the seeded numbers** — honest, but the site looks empty for a few weeks, or
- **keep showing them** until real reviews arrive — the same problem you have today.

I'd wipe them and show a "New" badge instead. An empty review section reads as a
young shop; fake five-stars read as a fake shop.

---

## M5 — Food details and delivery area

**Goal:** the page answers what a food customer actually asks — what's in it, how
long does it keep, and will you even deliver to me. Checkout accepts any valid
6-digit pincode today, so someone in Kerala can order fresh pitha from
Bhubaneswar and you'd find out when you read the address.

### Schema

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life  TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage     TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS delivery_pincodes TEXT;  -- "751,752,753"
```

All nullable, all rendered only when present — no empty "Ingredients: —" rows.

### Work

- Product detail: a details block for the four new fields.
- Replace `productDescription()` (one template sentence with the name swapped in,
  currently identical across the whole catalogue) with a real per-product
  `description` column, editable in the admin.
- Checkout validates `pincode` against the serviceable prefixes and says so
  clearly when it isn't covered.
- A "check delivery" pincode box on the product and cart pages, so people find
  out before filling in a whole address.

**Deliberately skipped:** per-pincode delivery fees and time-slot booking. A
comma-separated prefix list in settings covers a single-city kitchen. Promote it
to its own table when you charge different rates by area.

---

## M6 — Payments (defer until you need it)

UPI and Card record only the selected label, so you are effectively COD-only
while telling customers otherwise. Two honest options:

1. **Cheapest:** remove UPI and Card from checkout until they work. One line in
   `lib/orders.ts`. Stops the site making a promise it can't keep.
2. **Real:** Razorpay — create an order server-side, verify the signature in a
   webhook, and mark the order paid only on the webhook. Never trust the
   browser's "payment succeeded" callback.

If COD works locally, do (1) now and (2) when volume justifies it. A gateway you
don't need is a monthly fee and a compliance surface.

---

## Later — Odia / English

Site-wide i18n is a large change. The lazy 80% is product-level only: `name_or`
and `description_or` columns, a toggle in the header, fall back to English when
the Odia value is empty. Static page copy stays English until the product
catalogue proves people use the toggle.

---

## Explicitly not building

Listed so nobody adds them by reflex:

- Variant / SKU system (see M2)
- OAuth / social login (see M3)
- Address book UI — prefill from last order instead
- Coupons, loyalty points, referrals
- A kitchen display or order queue screen — the admin orders page is the queue
- Email template engine, send queue, retries
- Per-pincode pricing, delivery time slots

---

## Risks worth watching

| Risk | Milestone | Mitigation |
|---|---|---|
| Overselling under concurrent checkout | M2 | Single-statement conditional decrement inside the order transaction |
| A customer session validating as an admin session | M3 | `k` discriminator in the token payload, checked in `getSession()` |
| Guest checkout regressing when accounts land | M3 | `orders.customer_id` nullable; keep a guest path in the test flow |
| A mail outage turning a saved order into a visible failure | M1 | Send after the insert, catch and log |
| Seeded ratings quietly surviving into the real review system | M4 | Decide before building, not after |

---

## Testing

Extend the checkout test flow per milestone. The step worth never skipping is
placing an order with DevTools set to **Offline** — the success screen must not
appear and the cart must survive.

Unit tests live in `tests/` and run with `npm test`. Anything touching money,
stock, or sessions gets one there; `tests/orders.test.ts` is the pattern.
