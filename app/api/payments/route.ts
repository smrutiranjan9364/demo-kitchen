import { sql } from "@/lib/db";
import { getCustomerId, verifyOrderTrackingToken } from "@/lib/auth";
import {
  api,
  ApiError,
  body,
  rateLimit,
  required,
  sameOrigin,
} from "@/lib/api";
import { initiatePayment, recordPayment, validSignature } from "@/lib/payments";
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = await body(request),
      id = required(input.orderId, "order");
    const customer = await getCustomerId();
    const [order] =
      await sql`SELECT customer_id,provider_order_id FROM orders WHERE id=${id}`;
    if (
      !order ||
      (!(customer && order.customer_id === customer) &&
        !verifyOrderTrackingToken(
          id,
          typeof input.token === "string" ? input.token : undefined,
        ))
    )
      throw new ApiError("Order not found.", 404);
    await rateLimit(`payment:${id}`, 30, 900);
    if (input.action === "verify") {
      const paymentId = required(input.paymentId, "payment"),
        signature = required(input.signature, "signature");
      if (
        !order.provider_order_id ||
        !validSignature(
          `${order.provider_order_id}|${paymentId}`,
          signature,
          process.env.RAZORPAY_KEY_SECRET ?? "",
        )
      )
        throw new ApiError("Payment verification failed.", 400);
      return Response.json(await recordPayment(paymentId));
    }
    return Response.json(await initiatePayment(id));
  });
}
