// Razorpay hosted checkout. Card/UPI credentials never pass through this app.
import crypto from "node:crypto";
import { sql } from "@/lib/db";
import { ApiError } from "@/lib/api";
export function paymentConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_WEBHOOK_SECRET,
  );
}
export function validSignature(
  message: string,
  signature: string,
  secret: string,
) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
  return (
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
}
export async function gateway(path: string, data?: Record<string, unknown>) {
  if (!paymentConfigured())
    throw new ApiError("Online payments are not configured.", 503);
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: data ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new ApiError(
      "The payment provider could not complete this request. Please try again or contact support.",
      502,
    );
  return response.json();
}
export async function initiatePayment(orderId: string) {
  await reconcilePayment(orderId);
  return sql.begin(async (tx) => {
    const [order] =
      await tx`SELECT * FROM orders WHERE id=${orderId} FOR UPDATE`;
    if (!order || order.payment !== "Online" || order.status !== "Placed")
      throw new ApiError("This order cannot accept payment.", 409);
    if (order.payment_status === "paid") return { paid: true };
    let providerId = order.provider_order_id;
    if (!providerId) {
      const receipt = crypto
        .createHash("sha256")
        .update(orderId)
        .digest("hex")
        .slice(0, 40);
      const created = await gateway("orders", {
        amount: order.total * 100,
        currency: "INR",
        receipt,
        notes: { order_id: orderId },
      });
      providerId = created.id;
      await tx`UPDATE orders SET provider_order_id=${providerId},payment_status='pending' WHERE id=${orderId}`;
    }
    return {
      paid: false,
      key: process.env.RAZORPAY_KEY_ID,
      orderId: providerId,
      amount: order.total * 100,
      currency: "INR",
      name: order.name,
      email: order.email,
      phone: order.phone,
    };
  });
}
export async function recordPayment(providerPaymentId: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(providerPaymentId))
    throw new ApiError("Invalid payment reference.");
  const payment = await gateway(`payments/${providerPaymentId}`);
  return sql.begin(async (tx) => {
    const [order] =
      await tx`SELECT * FROM orders WHERE provider_order_id=${payment.order_id} FOR UPDATE`;
    if (!order) throw new ApiError("Payment order not found.", 404);
    if (payment.amount !== order.total * 100 || payment.currency !== "INR")
      throw new ApiError("Payment amount does not match the order.", 409);
    const paid = payment.status === "captured";
    await tx`INSERT INTO payments(id,order_id,provider_payment_id,amount,status) VALUES(${crypto.randomUUID()},${order.id},${payment.id},${order.total},${payment.status}) ON CONFLICT(provider_payment_id) DO UPDATE SET status=EXCLUDED.status`;
    if (
      paid &&
      order.payment_status !== "paid" &&
      order.payment_status !== "refunded"
    ) {
      await tx`UPDATE orders SET payment_status='paid' WHERE id=${order.id}`;
      await tx`INSERT INTO order_events(order_id,status,actor) VALUES(${order.id},'Payment confirmed','payment-provider')`;
      if (order.customer_id)
        await tx`INSERT INTO notifications(id,customer_id,title,href) VALUES(${crypto.randomUUID()},${order.customer_id},'Payment confirmed',${`/account/orders/${order.id}`})`;
      if (["Cancelled", "Rejected"].includes(order.status)) {
        const [refund] =
          await tx`SELECT id FROM refunds WHERE order_id=${order.id} AND status!='rejected'`;
        if (!refund)
          await tx`INSERT INTO refunds(id,order_id,amount,reason) VALUES(${crypto.randomUUID()},${order.id},${order.total},'Payment captured after cancellation')`;
      }
    } else if (!paid && !["paid", "refunded"].includes(order.payment_status))
      await tx`UPDATE orders SET payment_status=${payment.status === "failed" ? "failed" : "pending"} WHERE id=${order.id}`;
    return { paid, status: payment.status };
  });
}
export async function requestRefund(
  orderId: string,
  amount: number,
  reason: string,
  actor: string,
) {
  return sql.begin(async (tx) => {
    const [order] =
      await tx`SELECT * FROM orders WHERE id=${orderId} FOR UPDATE`;
    if (!order || order.payment_status !== "paid")
      throw new ApiError("Only paid orders can be refunded.", 409);
    const [sum] =
      await tx`SELECT COALESCE(sum(amount),0)::int AS total FROM refunds WHERE order_id=${orderId} AND status!='rejected'`;
    if (amount > order.total - sum.total)
      throw new ApiError(
        "Refund exceeds the remaining refundable amount. An existing cancellation refund may already be queued.",
        409,
      );
    const id = crypto.randomUUID();
    await tx`INSERT INTO refunds(id,order_id,amount,reason) VALUES(${id},${orderId},${amount},${reason})`;
    await tx`INSERT INTO audit_logs(actor,action,target) VALUES(${actor},'refund:request',${id})`;
    return { id };
  });
}
export async function processRefund(id: string, actor: string) {
  if (!paymentConfigured())
    throw new ApiError("Online payments are not configured.", 503);
  // Persist processing before the network call. An uncertain response must be
  // reconciled with the provider rather than initiating a second refund.
  const result = await sql.begin(async (tx) => {
    const [refund] = await tx`SELECT * FROM refunds WHERE id=${id} FOR UPDATE`;
    if (!refund) throw new ApiError("Refund not found.", 404);
    if (refund.status !== "requested")
      throw new ApiError(
        "Refund already submitted. Reconcile its provider status instead of submitting again.",
        409,
      );
    const [payment] =
      await tx`SELECT provider_payment_id FROM payments WHERE order_id=${refund.order_id} AND status='captured' ORDER BY created_at LIMIT 1`;
    if (!payment)
      throw new ApiError(
        "No captured online payment found. Cash refunds require manual settlement.",
        409,
      );
    await tx`UPDATE refunds SET status='processing' WHERE id=${id}`;
    await tx`INSERT INTO audit_logs(actor,action,target) VALUES(${actor},'refund:submit',${id})`;
    return { refund, payment };
  });
  const provider = await gateway(
    `payments/${result.payment.provider_payment_id}/refund`,
    {
      amount: result.refund.amount * 100,
      speed: "normal",
      notes: { refund_id: id },
    },
  );
  await sql`UPDATE refunds SET provider_refund_id=${provider.id} WHERE id=${id}`;
  if (provider.status === "processed") await completeRefund(id);
  return { ok: true };
}
export async function completeRefund(id: string) {
  await sql.begin(async (tx) => {
    const [refund] =
      await tx`UPDATE refunds SET status='completed' WHERE id=${id} AND status!='completed' RETURNING order_id`;
    if (!refund) return;
    const [order] =
      await tx`SELECT * FROM orders WHERE id=${refund.order_id} FOR UPDATE`;
    const [total] =
      await tx`SELECT COALESCE(sum(amount),0)::int AS amount FROM refunds WHERE order_id=${refund.order_id} AND status='completed'`;
    if (total.amount >= order.total)
      await tx`UPDATE orders SET payment_status='refunded' WHERE id=${order.id}`;
    if (order.customer_id)
      await tx`INSERT INTO notifications(id,customer_id,title,href) VALUES(${crypto.randomUUID()},${order.customer_id},'Your refund has been processed',${`/account/orders/${order.id}`})`;
  });
}

export async function reconcilePayment(orderId: string) {
  const [order] =
    await sql`SELECT provider_order_id,payment_status FROM orders WHERE id=${orderId}`;
  if (
    !order?.provider_order_id ||
    ["paid", "refunded"].includes(order.payment_status)
  )
    return;
  const result = await gateway(
    `orders/${encodeURIComponent(order.provider_order_id)}/payments`,
  );
  const captured = result.items?.find(
    (p: { status: string }) => p.status === "captured",
  );
  if (captured) await recordPayment(captured.id);
}

export async function reconcileRefund(id: string, actor: string) {
  const [refund] =
    await sql`SELECT r.*,p.provider_payment_id FROM refunds r JOIN payments p ON p.order_id=r.order_id AND p.status='captured' WHERE r.id=${id} LIMIT 1`;
  if (!refund) throw new ApiError("Online refund not found.", 404);
  if (refund.status === "completed") return { ok: true, status: "completed" };
  if (refund.status !== "processing")
    throw new ApiError("Only submitted refunds can be reconciled.", 409);
  let provider;
  if (refund.provider_refund_id)
    provider = await gateway(
      `refunds/${encodeURIComponent(refund.provider_refund_id)}`,
    );
  else {
    // Match our durable reference after a timeout or crash, without initiating
    // another transfer. A negative lookup remains uncertain and is not retried.
    for (let skip = 0; skip < 1000; skip += 100) {
      const page = await gateway(
        `payments/${encodeURIComponent(refund.provider_payment_id)}/refunds?count=100&skip=${skip}`,
      );
      provider = page.items?.find(
        (r: { notes?: { refund_id?: string } }) => r.notes?.refund_id === id,
      );
      if (provider || !page.items || page.items.length < 100) break;
    }
  }
  if (!provider)
    throw new ApiError(
      "No matching provider refund found yet. Keep this request pending and check the provider dashboard before taking further action.",
      409,
    );
  if (
    provider.amount !== refund.amount * 100 ||
    provider.payment_id !== refund.provider_payment_id
  )
    throw new ApiError("Refund details do not match.", 409);
  await sql`UPDATE refunds SET provider_refund_id=${provider.id} WHERE id=${id}`;
  if (provider.status === "processed") await completeRefund(id);
  await sql`INSERT INTO audit_logs(actor,action,target) VALUES(${actor},'refund:reconcile',${id})`;
  return { ok: true, status: provider.status };
}
