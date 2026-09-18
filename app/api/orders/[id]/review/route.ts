import { sql } from "@/lib/db";
import { api, ApiError, body, integer, required, sameOrigin } from "@/lib/api";
import { customerRequired } from "@/lib/platform";
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    sameOrigin(request);
    const customer = await customerRequired(),
      { id } = await ctx.params,
      input = await body(request);
    const [order] =
      await sql`SELECT restaurant_id FROM orders WHERE id=${id} AND customer_id=${customer} AND status='Delivered'`;
    if (!order)
      throw new ApiError("Only your delivered orders can be reviewed.", 403);
    const rating = integer(input.restaurantRating, "restaurant rating", 1, 5),
      delivery = integer(input.deliveryRating, "delivery rating", 1, 5),
      comment = required(input.comment, "review", 1000);
    await sql`INSERT INTO order_reviews(order_id,customer_id,restaurant_id,restaurant_rating,delivery_rating,comment) VALUES(${id},${customer},${order.restaurant_id},${rating},${delivery},${comment}) ON CONFLICT(order_id) DO UPDATE SET restaurant_rating=EXCLUDED.restaurant_rating,delivery_rating=EXCLUDED.delivery_rating,comment=EXCLUDED.comment,updated_at=now()`;
    return Response.json({ ok: true });
  });
}
export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    sameOrigin(request);
    const customer = await customerRequired(),
      { id } = await ctx.params;
    await sql`DELETE FROM order_reviews WHERE order_id=${id} AND customer_id=${customer}`;
    return Response.json({ ok: true });
  });
}
