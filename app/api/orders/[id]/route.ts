import { sql } from "@/lib/db";
import { api, ApiError, body, required, sameOrigin } from "@/lib/api";
import { getCustomerId, verifyOrderTrackingToken } from "@/lib/auth";
import { customerRequired, transitionOrder } from "@/lib/platform";
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    const { id } = await ctx.params;
    const customer = await getCustomerId();
    const [order] =
      await sql`SELECT o.*,r.name AS restaurant_name,r.phone AS restaurant_phone,c.name AS rider_name,c.phone AS rider_phone FROM orders o JOIN restaurants r ON r.id=o.restaurant_id LEFT JOIN customers c ON c.id=o.rider_id WHERE o.id=${id}`;
    if (
      !order ||
      (!(customer && order.customer_id === customer) &&
        !verifyOrderTrackingToken(
          id,
          new URL(request.url).searchParams.get("t") ?? undefined,
        ))
    )
      throw new ApiError("Order not found.", 404);
    const events =
      await sql`SELECT status,note,created_at FROM order_events WHERE order_id=${id} ORDER BY created_at,id`;
    const refunds =
      await sql`SELECT amount,status,created_at FROM refunds WHERE order_id=${id} ORDER BY created_at DESC`;
    return Response.json({
      id,
      status: order.status,
      payment: order.payment,
      paymentStatus: order.payment_status,
      eta: order.eta_at,
      delayed: order.eta_at
        ? new Date(order.eta_at).getTime() < Date.now()
        : false,
      deliveryCode: order.delivery_code,
      restaurantName: order.restaurant_name,
      restaurantPhone: order.restaurant_phone,
      riderName: order.rider_name,
      riderPhone: order.rider_phone,
      breakdown: order.breakdown,
      landmark: order.landmark,
      instructions: order.instructions,
      events,
      refunds,
      canReview: customer === order.customer_id && order.status === "Delivered",
      canCancel: customer === order.customer_id && order.status === "Placed",
    });
  });
}
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    sameOrigin(request);
    const customer = await customerRequired();
    const { id } = await ctx.params;
    const input = await body(request);
    return Response.json(
      await transitionOrder(
        id,
        "Cancelled",
        { id: customer, role: "customer" },
        required(input.reason, "cancellation reason", 500),
      ),
    );
  });
}
