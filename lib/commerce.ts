// Shared, side-effect-free commerce rules. All amounts are integer rupees.
export type ActorRole = "customer" | "restaurant" | "rider" | "admin";
export const FLOW = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Ready for Pickup",
  "Rider Assigned",
  "Picked Up",
  "Dispatched",
  "Delivered",
] as const;
export const TERMINAL = ["Delivered", "Cancelled", "Rejected"];
const transitions: Record<string, string[]> = {
  Placed: ["Confirmed", "Cancelled", "Rejected"],
  Confirmed: ["Preparing", "Cancelled"],
  Preparing: ["Ready for Pickup", "Cancelled"],
  "Ready for Pickup": ["Rider Assigned", "Cancelled"],
  "Rider Assigned": ["Picked Up", "Ready for Pickup"],
  "Picked Up": ["Dispatched"],
  Dispatched: ["Delivered"],
};
export function canTransition(
  from: string,
  to: string,
  role: ActorRole,
): boolean {
  if (!transitions[from]?.includes(to)) return false;
  if (role === "customer") return from === "Placed" && to === "Cancelled";
  if (role === "restaurant")
    return (
      [
        "Confirmed",
        "Preparing",
        "Ready for Pickup",
        "Cancelled",
        "Rejected",
      ].includes(to) && from !== "Rider Assigned"
    );
  if (role === "rider")
    return [
      "Picked Up",
      "Dispatched",
      "Delivered",
      "Ready for Pickup",
    ].includes(to);
  return true;
}
export type Coupon = {
  code: string;
  kind: "flat" | "percent" | "delivery";
  value: number;
  minimum: number;
  maximum: number;
  firstOrder: boolean;
  expiresAt: string;
  active: boolean;
};
export function couponDiscount(
  c: Coupon,
  subtotal: number,
  delivery: number,
  previousOrders: number,
  now = Date.now(),
): number {
  if (!c.active || new Date(c.expiresAt).getTime() <= now)
    throw new Error("This coupon has expired or is unavailable.");
  if (subtotal < c.minimum)
    throw new Error(`This coupon requires an order of ₹${c.minimum}.`);
  if (c.firstOrder && previousOrders > 0)
    throw new Error("This offer is for your first order only.");
  if (c.kind === "delivery") return delivery;
  return Math.max(
    0,
    Math.min(
      subtotal,
      c.maximum,
      c.kind === "flat" ? c.value : Math.floor((subtotal * c.value) / 100),
    ),
  );
}
export function checkoutTotal(
  subtotal: number,
  delivery: number,
  packaging: number,
  platform: number,
  taxBps: number,
  discount: number,
  tip: number,
) {
  for (const n of [
    subtotal,
    delivery,
    packaging,
    platform,
    taxBps,
    discount,
    tip,
  ]) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid amount.");
  }
  if (taxBps > 10000 || tip > 10000 || discount > subtotal + delivery)
    throw new Error("Invalid amount.");
  const tax = Math.round((subtotal * taxBps) / 10000);
  return {
    subtotal,
    delivery,
    packaging,
    platform,
    tax,
    discount,
    tip,
    total: subtotal + delivery + packaging + platform + tax + tip - discount,
  };
}
export function isOpen(
  open: string,
  close: string,
  enabled: boolean,
  now = new Date(),
): boolean {
  if (!enabled) return false;
  const current = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return (
    open === close ||
    (open < close
      ? current >= open && current < close
      : current >= open || current < close)
  );
}
export function csvCell(value: unknown) {
  const raw = String(value ?? "");
  return (
    '"' +
    (/^[=+@\-\t\r]/.test(raw) ? "'" : "") +
    raw.replaceAll('"', '""') +
    '"'
  );
}
