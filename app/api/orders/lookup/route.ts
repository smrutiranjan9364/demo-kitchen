import { orderTrackingPath } from "@/lib/auth";
import { samePhone } from "@/lib/orders";
import { getOrder } from "@/lib/store";

// Guest order lookup. The phone number travels in the POST body — never the
// URL — and what comes back is a signed tracking link that carries no personal
// data. One generic answer for "no such order" and "wrong phone".
// ponytail: no rate limit yet; the phone is the secret and there are 10^10 of
// them. Add one if lookup traffic ever looks automated.
export async function POST(request: Request) {
  let body: { id?: unknown; phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const noMatch = () =>
    Response.json(
      { error: "We couldn't match that order number and phone number. Check both against your confirmation." },
      { status: 404 },
    );
  if (!id || !phone) return noMatch();

  const order = await getOrder(id);
  if (!order || !samePhone(phone, order.phone)) return noMatch();

  return Response.json({ url: orderTrackingPath(order.id) });
}
