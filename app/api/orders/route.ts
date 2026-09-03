import { createOrder, type OrderItem } from "@/lib/store";

// Public: called by checkout when an order is placed.
export async function POST(request: Request) {
  let body: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    payment?: string;
    items?: OrderItem[];
    subtotal?: number;
    delivery?: number;
    total?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "No items" }, { status: 400 });
  }

  const order = await createOrder({
    name: body.name || "Guest",
    phone: body.phone || "",
    email: body.email || "",
    address: body.address,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
    payment: body.payment || "Cash on Delivery",
    items: body.items,
    subtotal: body.subtotal ?? 0,
    delivery: body.delivery ?? 0,
    total: body.total ?? 0,
  });

  return Response.json({ ok: true, id: order.id }, { status: 201 });
}
