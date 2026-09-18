import { sql } from "@/lib/db";
import { api, ApiError } from "@/lib/api";
import {
  completeRefund,
  gateway,
  recordPayment,
  validSignature,
} from "@/lib/payments";
export async function POST(request: Request) {
  return api(async () => {
    const raw = await request.text(),
      secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (
      raw.length > 100000 ||
      !secret ||
      !validSignature(
        raw,
        request.headers.get("x-razorpay-signature") ?? "",
        secret,
      )
    )
      throw new ApiError("Invalid webhook signature.", 400);
    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      throw new ApiError("Invalid webhook body.");
    }
    const payment = event.payload?.payment?.entity;
    if (
      ["payment.captured", "payment.failed"].includes(event.event) &&
      payment?.id
    )
      await recordPayment(payment.id);
    const refund = event.payload?.refund?.entity;
    if (
      event.event === "refund.processed" &&
      typeof refund?.id === "string" &&
      /^rfnd_[A-Za-z0-9]+$/.test(refund.id)
    ) {
      const verified = await gateway(`refunds/${refund.id}`);
      if (verified.status === "processed") {
        const [stored] =
          await sql`SELECT r.id,r.amount,p.provider_payment_id FROM refunds r JOIN payments p ON p.order_id=r.order_id AND p.status='captured' WHERE r.provider_refund_id=${verified.id} OR r.id=${String(verified.notes?.refund_id ?? "")}`;
        if (
          stored &&
          verified.amount === stored.amount * 100 &&
          verified.payment_id === stored.provider_payment_id
        ) {
          await sql`UPDATE refunds SET provider_refund_id=${verified.id} WHERE id=${stored.id}`;
          await completeRefund(stored.id);
        }
      }
    }
    return Response.json({ ok: true });
  });
}
