import crypto from "node:crypto";
import { sql } from "@/lib/db";
import { paymentConfigured, reconcilePayment } from "@/lib/payments";
import { ApiError } from "@/lib/api";
import { transitionOrder } from "@/lib/platform";
export function authorizedScheduler(value: string | null) {
  const secret = process.env.SCHEDULER_SECRET;
  if (!secret || secret.length < 32 || !value) return false;
  const supplied = Buffer.from(value),
    expected = Buffer.from(`Bearer ${secret}`);
  return (
    supplied.length === expected.length &&
    crypto.timingSafeEqual(supplied, expected)
  );
}
export async function expireUnacceptedOrders(actor: string) {
  const candidates =
    await sql`SELECT id,payment,payment_status,provider_order_id FROM orders WHERE status='Placed' AND created_at<now()-interval '45 minutes' ORDER BY created_at LIMIT 100`;
  const results: { id: string; result: string }[] = [];
  for (const order of candidates) {
    try {
      if (
        order.payment === "Online" &&
        order.provider_order_id &&
        !["paid", "refunded"].includes(order.payment_status)
      ) {
        if (!paymentConfigured()) {
          results.push({
            id: order.id,
            result: "Skipped: provider configuration needed to verify payment",
          });
          continue;
        }
        await reconcilePayment(order.id);
      }
      await transitionOrder(
        order.id,
        "Cancelled",
        { id: actor, role: "admin" },
        "Order timed out before restaurant acceptance",
        "",
        "Placed",
      );
      results.push({
        id: order.id,
        result: "Cancelled; stock restored; any paid amount queued for refund",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409)
        results.push({
          id: order.id,
          result: "Already updated by another request",
        });
      else
        results.push({
          id: order.id,
          result:
            "Not expired: payment verification or database request failed",
        });
    }
  }
  await sql`DELETE FROM rate_limits WHERE expires_at<now()-interval '1 day'`;
  await sql`DELETE FROM auth_challenges WHERE expires_at<now()-interval '1 day'`;
  return { processed: results.length, results };
}
