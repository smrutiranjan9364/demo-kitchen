import type { MenuOption } from "@/lib/menu";
import crypto from "node:crypto";
import type { TransactionSql } from "postgres";
import { sql } from "@/lib/db";
import { getCustomerId, getSession } from "@/lib/auth";
import { hasRight } from "@/lib/guard";
import { ApiError, integer, required } from "@/lib/api";
import {
  canTransition,
  checkoutTotal,
  couponDiscount,
  isOpen,
  type ActorRole,
} from "@/lib/commerce";
import {
  isIndianMobile,
  isIndianState,
  isServiceable,
  parseCartRequest,
} from "@/lib/orders";

type Db = typeof sql | TransactionSql;
export type Restaurant = {
  id: string;
  owner_id: string | null;
  name: string;
  description: string;
  cuisine: string;
  address: string;
  phone: string;
  image: string;
  pincodes: string;
  opens: string;
  closes: string;
  enabled: boolean;
  approval: string;
  minimum_order: number;
  delivery_fee: number;
  packaging_fee: number;
  platform_fee: number;
  tax_bps: number;
  eta_minutes: number;
  commission_bps: number;
};
export async function customerRequired() {
  const id = await getCustomerId();
  if (!id) throw new ApiError("Please log in to continue.", 401);
  return id;
}
export async function restaurantRequired(id?: string) {
  const customer = await customerRequired();
  const rows = id
    ? await sql<
        Restaurant[]
      >`SELECT * FROM restaurants WHERE id=${id} AND owner_id=${customer}`
    : await sql<
        Restaurant[]
      >`SELECT * FROM restaurants WHERE owner_id=${customer} ORDER BY created_at LIMIT 1`;
  if (!rows[0]) throw new ApiError("Restaurant access required.", 403);
  return rows[0];
}
export async function adminRequired() {
  if (!(await hasRight("platform")))
    throw new ApiError("Platform management permission required.", 403);
  return (await getSession())!.username;
}
export function deliveryContact(input: Record<string, unknown>) {
  const contact = {
    name: required(input.name, "name", 100),
    phone: required(input.phone, "phone", 20),
    email: required(input.email, "email", 200).toLowerCase(),
    address: required(input.address, "address", 300),
    city: required(input.city, "city", 100),
    state: required(input.state, "state", 100),
    pincode: required(input.pincode, "pincode", 6),
    landmark:
      typeof input.landmark === "string"
        ? input.landmark.trim().slice(0, 200)
        : "",
    instructions:
      typeof input.instructions === "string"
        ? input.instructions.trim().slice(0, 500)
        : "",
  };
  if (
    !isIndianMobile(contact.phone) ||
    !isIndianState(contact.state) ||
    !/^[1-9]\d{5}$/.test(contact.pincode) ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)
  )
    throw new ApiError(
      "Please enter a valid Indian phone, email, state and six-digit pincode.",
    );
  return contact;
}
export async function quoteOrder(
  input: Record<string, unknown>,
  customerId: string | null,
  db: Db = sql,
  lock = false,
) {
  const cart = parseCartRequest(input.items);
  if ("error" in cart) throw new ApiError(cart.error);
  const ids = [...new Set(cart.lines.map((l) => l.id))].sort();
  const products = lock
    ? await db`SELECT * FROM products WHERE id IN ${db(ids)} ORDER BY id FOR UPDATE`
    : await db`SELECT * FROM products WHERE id IN ${db(ids)} ORDER BY id`;
  if (products.length !== ids.length)
    throw new ApiError(
      "Some items are no longer available. Please update your cart.",
      409,
    );
  const restaurantId = products[0].restaurant_id;
  if (products.some((p) => p.restaurant_id !== restaurantId))
    throw new ApiError(
      "Order from one restaurant at a time. Please clear your cart before switching restaurants.",
      409,
    );
  const [restaurant] = lock
    ? await db<
        Restaurant[]
      >`SELECT * FROM restaurants WHERE id=${restaurantId} FOR UPDATE`
    : await db<
        Restaurant[]
      >`SELECT * FROM restaurants WHERE id=${restaurantId}`;
  if (
    !restaurant ||
    restaurant.approval !== "approved" ||
    !isOpen(restaurant.opens, restaurant.closes, restaurant.enabled)
  )
    throw new ApiError(
      "This restaurant is currently closed or unavailable.",
      409,
    );
  const [settings] =
    await db`SELECT delivery_fee,free_delivery_over,delivery_pincodes FROM settings WHERE id=1`;
  if (restaurantId === "odia-kitchen" && settings) {
    restaurant.delivery_fee = settings.delivery_fee;
    restaurant.pincodes = settings.delivery_pincodes ?? "";
  }
  const pincode = required(input.pincode, "delivery pincode", 6);
  if (
    !/^[1-9]\d{5}$/.test(pincode) ||
    !isServiceable(pincode, restaurant.pincodes)
  )
    throw new ApiError("This restaurant does not deliver to your pincode.");
  const lines = cart.lines.map((line) => {
    const p = products.find((p) => p.id === line.id)!;
    if (
      !p.available ||
      (p.stock !== null &&
        p.stock <
          cart.lines
            .filter((l) => l.id === line.id)
            .reduce((n, l) => n + l.qty, 0))
    )
      throw new ApiError(
        `${p.name} is unavailable in this quantity. Please update your cart.`,
        409,
      );
    const variants = (p.variants ?? []) as MenuOption[],
      addons = (p.addons ?? []) as MenuOption[];
    const variant = variants.find(
      (v) => v.id === (line.variantId ?? variants[0]?.id),
    );
    if ((variants.length && !variant) || (!variants.length && line.variantId))
      throw new ApiError(
        "A portion option changed. Please add the item again.",
        409,
      );
    const selected = (line.addonIds ?? []).map((id) =>
      addons.find((a) => a.id === id),
    );
    if (selected.some((a) => !a))
      throw new ApiError("An add-on changed. Please add the item again.", 409);
    const labels = [variant?.label, ...selected.map((a) => a!.label)].filter(
      Boolean,
    );
    return {
      ...line,
      ...(variant ? { variantId: variant.id } : {}),
      id: p.id as string,
      name: `${p.name}${labels.length ? " · " + labels.join(", ") : ""}`,
      price:
        (p.price as number) +
        (variant?.price ?? 0) +
        selected.reduce((n, a) => n + a!.price, 0),
      qty: line.qty,
    };
  });
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  if (subtotal < restaurant.minimum_order)
    throw new ApiError(
      `Minimum order for ${restaurant.name} is ₹${restaurant.minimum_order}.`,
    );
  const delivery =
    restaurantId === "odia-kitchen" &&
    settings &&
    subtotal >= settings.free_delivery_over
      ? 0
      : restaurant.delivery_fee;
  const code =
    typeof input.coupon === "string"
      ? input.coupon.trim().toUpperCase().slice(0, 40)
      : "";
  let discount = 0;
  if (code) {
    if (!customerId) throw new ApiError("Log in to use a coupon.", 401);
    if (lock)
      await db`SELECT id FROM customers WHERE id=${customerId} FOR UPDATE`;
    const [coupon] = await db`SELECT * FROM coupons WHERE code=${code}`;
    if (!coupon) throw new ApiError("Coupon not found.");
    const [used] =
      await db`SELECT 1 FROM coupon_uses WHERE code=${code} AND customer_id=${customerId}`;
    if (used) throw new ApiError("You have already used this coupon.");
    const [count] =
      await db`SELECT count(*)::int AS n FROM orders WHERE customer_id=${customerId} AND status NOT IN ('Cancelled','Rejected')`;
    try {
      discount = couponDiscount(
        {
          code,
          kind: coupon.kind,
          value: coupon.value,
          minimum: coupon.minimum,
          maximum: coupon.maximum,
          firstOrder: coupon.first_order,
          expiresAt: new Date(coupon.expires_at).toISOString(),
          active: coupon.active,
        },
        subtotal,
        delivery,
        count.n,
      );
    } catch (error) {
      throw new ApiError((error as Error).message);
    }
  }
  const tip = integer(input.tip ?? 0, "tip", 0, 10000);
  const breakdown = checkoutTotal(
    subtotal,
    delivery,
    restaurant.packaging_fee,
    restaurant.platform_fee,
    restaurant.tax_bps,
    discount,
    tip,
  );
  const fingerprint = crypto
    .createHash("sha256")
    .update(JSON.stringify({ lines, breakdown, restaurantId, pincode, code }))
    .digest("hex");
  return {
    lines,
    breakdown,
    restaurantId,
    restaurantName: restaurant.name,
    etaMinutes: restaurant.eta_minutes,
    code,
    fingerprint,
  };
}
export async function submitOrder(
  input: Record<string, unknown>,
  customerId: string | null,
) {
  const contact = deliveryContact(input);
  const key = required(input.requestKey, "order request key", 100);
  if (!/^[a-zA-Z0-9-]{20,100}$/.test(key))
    throw new ApiError("Invalid request key.");
  const payment =
    input.payment === "Online"
      ? "Online"
      : input.payment === "Cash on Delivery"
        ? "Cash on Delivery"
        : null;
  if (!payment) throw new ApiError("Choose a supported payment method.");
  if (
    payment === "Online" &&
    (!process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET ||
      !process.env.RAZORPAY_WEBHOOK_SECRET)
  )
    throw new ApiError("Online payment is not available yet.", 503);
  const hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        contact,
        items: input.items,
        customerId,
        payment,
        coupon: input.coupon,
        tip: input.tip,
        fingerprint: input.fingerprint,
      }),
    )
    .digest("hex");
  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`;
    const [existing] =
      await tx`SELECT id,total,request_hash FROM orders WHERE request_key=${key}`;
    if (existing) {
      if (existing.request_hash !== hash)
        throw new ApiError(
          "This request was already used for another order. Review your cart and try again.",
          409,
        );
      return {
        id: String(existing.id),
        total: Number(existing.total),
        duplicate: true,
      };
    }
    if (customerId)
      await tx`SELECT id FROM customers WHERE id=${customerId} FOR UPDATE`;
    const quote = await quoteOrder(input, customerId, tx, true);
    if (input.fingerprint !== quote.fingerprint)
      throw new ApiError(
        "Your cart price or delivery fee changed. Review the updated total before placing your order.",
        409,
      );
    const id = `ord_${crypto.randomUUID()}`;
    for (const line of quote.lines)
      await tx`UPDATE products SET stock=stock-${line.qty} WHERE id=${line.id} AND stock IS NOT NULL`;
    const otp = String(crypto.randomInt(100000, 1000000));
    await tx`INSERT INTO orders(id,name,phone,email,address,city,state,pincode,payment,items,subtotal,delivery,total,customer_id,restaurant_id,landmark,instructions,breakdown,request_key,request_hash,delivery_code,eta_at,payment_status)
     VALUES(${id},${contact.name},${contact.phone},${contact.email},${contact.address},${contact.city},${contact.state},${contact.pincode},${payment},${tx.json(quote.lines)},${quote.breakdown.subtotal},${quote.breakdown.delivery},${quote.breakdown.total},${customerId},${quote.restaurantId},${contact.landmark},${contact.instructions},${tx.json(quote.breakdown)},${key},${hash},${otp},now()+${quote.etaMinutes}*interval '1 minute',${payment === "Online" ? "pending" : "due"})`;
    if (quote.code && customerId)
      await tx`INSERT INTO coupon_uses(code,customer_id,order_id) VALUES(${quote.code},${customerId},${id})`;
    await tx`INSERT INTO order_events(order_id,status,actor) VALUES(${id},'Placed',${customerId ?? "guest"})`;
    if (customerId)
      await tx`INSERT INTO notifications(id,customer_id,title,href) VALUES(${crypto.randomUUID()},${customerId},'Your order has been placed',${`/account/orders/${id}`})`;
    return { id, total: quote.breakdown.total, duplicate: false };
  });
}
export async function transitionOrder(
  id: string,
  to: string,
  actor: { id: string; role: ActorRole },
  note = "",
  otp = "",
  expectedStatus?: string,
) {
  return sql.begin(async (tx) => {
    const [order] = await tx`SELECT * FROM orders WHERE id=${id} FOR UPDATE`;
    if (!order) throw new ApiError("Order not found.", 404);
    if (expectedStatus && order.status !== expectedStatus)
      throw new ApiError("Order was already updated.", 409);
    if (actor.role === "customer" && order.customer_id !== actor.id)
      throw new ApiError("Order access denied.", 403);
    if (actor.role === "restaurant") {
      const [r] =
        await tx`SELECT id FROM restaurants WHERE id=${order.restaurant_id} AND owner_id=${actor.id} AND approval='approved'`;
      if (!r) throw new ApiError("Order access denied.", 403);
    }
    if (actor.role === "rider") {
      const [r] =
        await tx`SELECT id FROM riders WHERE id=${actor.id} AND approval='approved'`;
      if (!r || order.rider_id !== actor.id)
        throw new ApiError("Delivery access denied.", 403);
    }
    if (to === "Rider Assigned")
      throw new ApiError(
        "Assign an approved online rider through delivery assignment.",
        409,
      );
    if (!canTransition(order.status, to, actor.role))
      throw new ApiError(
        `Cannot change ${order.status} to ${to}. Refresh the order and try again.`,
        409,
      );
    if (
      to === "Confirmed" &&
      order.payment === "Online" &&
      order.payment_status !== "paid"
    )
      throw new ApiError("Payment has not been confirmed.", 409);
    if (
      to === "Delivered" &&
      actor.role === "rider" &&
      otp !== order.delivery_code
    )
      throw new ApiError("The customer's delivery code is incorrect.");
    if (["Cancelled", "Rejected"].includes(to)) {
      if (!note.trim())
        throw new ApiError("Please provide a cancellation reason.");
      for (const line of order.items as { id: string; qty: number }[])
        await tx`UPDATE products SET stock=stock+${line.qty} WHERE id=${line.id} AND stock IS NOT NULL`;
      if (order.payment_status === "paid")
        await tx`INSERT INTO refunds(id,order_id,amount,reason) VALUES(${crypto.randomUUID()},${id},${order.total},${note})`;
    }
    await tx`UPDATE orders SET status=${to}, rider_id=CASE WHEN ${to}='Ready for Pickup' THEN NULL ELSE rider_id END,
     payment_status=CASE WHEN ${to}='Delivered' AND payment='Cash on Delivery' THEN 'paid' ELSE payment_status END WHERE id=${id}`;
    await tx`INSERT INTO order_events(order_id,status,actor,note) VALUES(${id},${to},${actor.id},${note.slice(0, 500)})`;
    await tx`INSERT INTO audit_logs(actor,action,target) VALUES(${actor.id},${`order:${to}`},${id})`;
    if (order.customer_id)
      await tx`INSERT INTO notifications(id,customer_id,title,href) VALUES(${crypto.randomUUID()},${order.customer_id},${`Order ${to.toLowerCase()}`},${`/account/orders/${id}`})`;
    if (to === "Delivered") {
      const [r] =
        await tx`SELECT commission_bps FROM restaurants WHERE id=${order.restaurant_id}`;
      const commission = Math.round(
        (order.subtotal * r.commission_bps) / 10000,
      );
      const b = order.breakdown;
      await tx`INSERT INTO earnings(order_id,restaurant_id,rider_id,restaurant_amount,rider_amount,commission) VALUES(${id},${order.restaurant_id},${order.rider_id},${order.subtotal - commission + (b.packaging ?? 0) + (b.tax ?? 0)},${order.delivery + (b.tip ?? 0)},${commission}) ON CONFLICT DO NOTHING`;
    }
    return { ok: true };
  });
}
export async function assignRider(
  orderId: string,
  riderId: string,
  actor: string,
) {
  return sql.begin(async (tx) => {
    const [rider] =
      await tx`SELECT * FROM riders WHERE id=${riderId} FOR UPDATE`;
    if (!rider || rider.approval !== "approved" || !rider.online)
      throw new ApiError("Rider must be approved and online.", 409);
    const [active] =
      await tx`SELECT id FROM orders WHERE rider_id=${riderId} AND status IN ('Rider Assigned','Picked Up','Dispatched')`;
    if (active)
      throw new ApiError("This rider already has an active delivery.", 409);
    const [order] =
      await tx`UPDATE orders SET rider_id=${riderId},status='Rider Assigned' WHERE id=${orderId} AND status='Ready for Pickup' RETURNING customer_id`;
    if (!order) throw new ApiError("Order is no longer ready for pickup.", 409);
    await tx`INSERT INTO order_events(order_id,status,actor) VALUES(${orderId},'Rider Assigned',${actor})`;
    await tx`INSERT INTO audit_logs(actor,action,target) VALUES(${actor},'rider:assign',${orderId})`;
    if (order.customer_id)
      await tx`INSERT INTO notifications(id,customer_id,title,href) VALUES(${crypto.randomUUID()},${order.customer_id},'A rider has been assigned',${`/account/orders/${orderId}`})`;
    return { ok: true };
  });
}
