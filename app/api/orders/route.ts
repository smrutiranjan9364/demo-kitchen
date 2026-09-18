import { api, body, rateLimit, sameOrigin } from "@/lib/api";
import { getCustomerId, orderTrackingPath } from "@/lib/auth";
import { submitOrder } from "@/lib/platform";
import { getOrder, getSettings } from "@/lib/store";
import { notifyOrderPlaced } from "@/lib/mail";
import { after } from "next/server";
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = await body(request);
    const customer = await getCustomerId();
    await rateLimit(
      `order:${customer ?? String(input.email).toLowerCase()}`,
      20,
      3600,
    );
    const order = await submitOrder(input, customer);
    if (!order.duplicate)
      after(async () => {
        const saved = await getOrder(order.id);
        if (saved) await notifyOrderPlaced(saved, await getSettings());
      });
    return Response.json(
      { ...order, trackUrl: orderTrackingPath(order.id) },
      { status: order.duplicate ? 200 : 201 },
    );
  });
}
