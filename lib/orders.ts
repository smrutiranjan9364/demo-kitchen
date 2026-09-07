// Order vocabulary and pricing. Plain data + arithmetic with no server imports,
// so the storefront and the orders API share one definition of what an order
// costs. The server always recomputes totals from DB prices — a subtotal that
// arrived from the browser is a suggestion, never a charge.

// Only what actually works. UPI and Card were listed before but recorded a
// label and nothing else — a promise the site couldn't keep. Add a method here
// only once its payment is really collected (see IMPLEMENTATION-PLAN.md, M6).
export const PAYMENT_METHODS = ["Cash on Delivery"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Dispatched",
  "Delivered",
  "Cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Colour cue per stage, shared by the admin queue and the customer's order page.
export const STATUS_STYLE: Record<string, string> = {
  Placed: "bg-cream text-brand",
  Confirmed: "bg-blue-50 text-blue-700",
  Preparing: "bg-amber-50 text-amber-700",
  Dispatched: "bg-indigo-50 text-indigo-700",
  Delivered: "bg-rating/10 text-rating",
  Cancelled: "bg-red-50 text-red-700",
};

export type DeliveryRates = { deliveryFee: number; freeDeliveryOver: number };

export function priceOrder(
  lines: readonly { price: number; qty: number }[],
  rates: DeliveryRates,
) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const delivery =
    subtotal === 0 || subtotal >= rates.freeDeliveryOver ? 0 : rates.deliveryFee;
  return { subtotal, delivery, total: subtotal + delivery };
}

// We deliver within India only. The check is on the *delivery contact* — an
// Indian mobile number and an Indian state — not on where the shopper is
// browsing from, so someone abroad can still order for family back home.
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union territories
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export function isIndianState(state: string): boolean {
  return (INDIAN_STATES as readonly string[]).includes(state);
}

// Indian mobile: ten digits starting 6–9, with an optional +91 / 91 / 0 prefix
// and any spacing or dashes. "9163706493" is a valid number, so the country
// code is only stripped when the length says it must be a prefix.
export function isIndianMobile(phone: string): boolean {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits);
}

// Loose match on the last ten digits so "+91 63706 49364" equals "6370649364".
export function samePhone(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "").slice(-10);
  const db = b.replace(/\D/g, "").slice(-10);
  return da.length === 10 && da === db;
}

// Serviceable area. `list` is the admin's comma/space-separated pincode
// prefixes ("751, 752, 7530"). An empty list means "deliver everywhere", so an
// unconfigured store behaves exactly as before.
export function parsePincodePrefixes(list: string): string[] {
  return list
    .split(/[\s,]+/)
    .map((p) => p.replace(/\D/g, ""))
    .filter(Boolean);
}

export function isServiceable(pincode: string, list: string): boolean {
  const prefixes = parsePincodePrefixes(list);
  if (prefixes.length === 0) return true;
  const code = pincode.replace(/\D/g, "");
  return prefixes.some((prefix) => code.startsWith(prefix));
}

export const MAX_QTY = 50; // per product — a home kitchen isn't shipping pallets
export const MAX_LINES = 50; // distinct products in one order

export type CartRequestLine = { id: string; qty: number };

// Validates the `[{id, qty}]` a browser posted and merges repeated ids. Merging
// happens *before* the per-product cap so splitting one product across several
// lines cannot multiply it. Returns an error message fit to show the shopper.
export function parseCartRequest(
  raw: unknown,
): { error: string } | { lines: CartRequestLine[] } {
  if (!Array.isArray(raw) || raw.length === 0) return { error: "Your cart is empty." };
  if (raw.length > MAX_LINES) return { error: "That order has too many different items." };

  const merged = new Map<string, number>();
  for (const entry of raw) {
    const item = entry as { id?: unknown; qty?: unknown };
    const id = typeof item?.id === "string" ? item.id.trim() : "";
    const qty = typeof item?.qty === "number" ? item.qty : Number(item?.qty);
    if (!id || id.length > 100 || !Number.isInteger(qty) || qty < 1) {
      return { error: "Your cart looks invalid. Please review it and try again." };
    }
    merged.set(id, (merged.get(id) ?? 0) + qty);
  }

  for (const qty of merged.values()) {
    if (qty > MAX_QTY) return { error: `You can order at most ${MAX_QTY} of any one item.` };
  }
  return { lines: [...merged].map(([id, qty]) => ({ id, qty })) };
}
