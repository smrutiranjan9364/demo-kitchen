import { getProduct, getSettings, placeOrder, OutOfStock, type OrderItem } from "@/lib/store";
import {
  PAYMENT_METHODS,
  isIndianMobile,
  isIndianState,
  isServiceable,
  parseCartRequest,
  priceOrder,
} from "@/lib/orders";
import { notifyOrderPlaced } from "@/lib/mail";
import { getCustomerId, orderTrackingPath } from "@/lib/auth";

// The browser sends ids and quantities only. Names, prices, delivery charge and
// totals are all resolved here from the database, so a tampered request cannot
// change what the kitchen is owed.

// A trimmed string, or null when it is missing / implausibly long.
function text(value: unknown, max: number): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length > 0 && s.length <= max ? s : null;
}

function bad(error: string) {
  return Response.json({ error }, { status: 400 });
}

// Public: called by checkout when an order is placed.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request");
  }

  const name = text(body.name, 100);
  const phone = text(body.phone, 20);
  const email = text(body.email, 200);
  const address = text(body.address, 300);
  const city = text(body.city, 100);
  const state = text(body.state, 100);
  const pincode = text(body.pincode, 10);

  if (!name) return bad("Please enter your name.");
  if (!address || !city) return bad("Please enter your full delivery address.");
  if (!state || !isIndianState(state)) {
    return bad("Please choose your state — we deliver within India only.");
  }
  if (!phone || !isIndianMobile(phone)) {
    return bad("Please enter a valid Indian mobile number.");
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return bad("Please enter a valid email address.");
  }
  if (!pincode || !/^\d{6}$/.test(pincode)) return bad("Please enter a valid 6-digit pincode.");

  const settings = await getSettings();
  if (!isServiceable(pincode, settings.deliveryPincodes)) {
    return bad(`Sorry, we don't deliver to ${pincode} yet.`);
  }

  const payment = PAYMENT_METHODS.find((method) => method === body.payment);
  if (!payment) return bad("Please choose a payment method.");

  const cart = parseCartRequest(body.items);
  if ("error" in cart) return bad(cart.error);

  const items: OrderItem[] = [];
  for (const line of cart.lines) {
    const product = await getProduct(line.id);
    if (!product) return bad("An item in your cart is no longer available. Please review it.");
    items.push({ id: product.id, name: product.name, price: product.price, qty: line.qty });
  }

  const totals = priceOrder(items, settings);

  let order;
  try {
    order = await placeOrder({
      name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      payment,
      items,
      // From the session cookie, never the body — a guest stays a guest.
      customerId: (await getCustomerId()) ?? undefined,
      ...totals,
    });
  } catch (err) {
    if (err instanceof OutOfStock) return Response.json({ error: err.message }, { status: 409 });
    throw err;
  }

  // The order is saved; a mail failure is logged inside and never fails checkout.
  await notifyOrderPlaced(order, settings);

  return Response.json(
    { ok: true, id: order.id, trackUrl: orderTrackingPath(order.id), ...totals },
    { status: 201 },
  );
}
