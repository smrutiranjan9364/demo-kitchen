import crypto from "node:crypto";
import { sql } from "@/lib/db";
import { api, ApiError, body, required, sameOrigin } from "@/lib/api";
import { customerRequired, deliveryContact } from "@/lib/platform";
import { clearCustomerSession, verifyPassword } from "@/lib/auth";
export async function GET() {
  return api(async () => {
    const id = await customerRequired();
    const [profile, addresses, favorites, notifications, tickets, coupons] =
      await Promise.all([
        sql`SELECT name,email,phone,verified_at FROM customers WHERE id=${id}`,
        sql`SELECT * FROM addresses WHERE customer_id=${id} ORDER BY created_at DESC`,
        sql`SELECT p.id,p.name,p.price,p.image FROM favorites f JOIN products p ON p.id=f.product_id WHERE f.customer_id=${id}`,
        sql`SELECT * FROM notifications WHERE customer_id=${id} ORDER BY created_at DESC LIMIT 50`,
        sql`SELECT * FROM support_tickets WHERE customer_id=${id} ORDER BY created_at DESC LIMIT 50`,
        sql`SELECT c.*,EXISTS(SELECT 1 FROM coupon_uses u WHERE u.code=c.code AND u.customer_id=${id}) AS used FROM coupons c WHERE active AND expires_at>now() ORDER BY expires_at LIMIT 50`,
      ]);
    return Response.json({
      profile: profile[0],
      addresses,
      favorites,
      notifications,
      tickets,
      coupons,
    });
  });
}
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const id = await customerRequired();
    const input = await body(request);
    if (input.action === "address") {
      const [customer] = await sql`SELECT email FROM customers WHERE id=${id}`;
      const contact = deliveryContact({ ...input, email: customer.email });
      const label = required(input.label, "address label");
      if (!["Home", "Work", "Other"].includes(label))
        throw new ApiError("Choose Home, Work or Other.");
      const addressId =
        typeof input.id === "string" ? input.id : crypto.randomUUID();
      await sql.begin(async (tx) => {
        await tx`SELECT id FROM customers WHERE id=${id} FOR UPDATE`;
        const [count] =
          await tx`SELECT count(*)::int AS n FROM addresses WHERE customer_id=${id}`;
        if (!input.id && count.n >= 20)
          throw new ApiError("You can save up to 20 addresses.");
        if (input.id) {
          const rows =
            await tx`UPDATE addresses SET label=${label},name=${contact.name},phone=${contact.phone},address=${contact.address},city=${contact.city},state=${contact.state},pincode=${contact.pincode},landmark=${contact.landmark} WHERE id=${addressId} AND customer_id=${id} RETURNING id`;
          if (!rows.length) throw new ApiError("Address not found.", 404);
        } else
          await tx`INSERT INTO addresses(id,customer_id,label,name,phone,address,city,state,pincode,landmark) VALUES(${addressId},${id},${label},${contact.name},${contact.phone},${contact.address},${contact.city},${contact.state},${contact.pincode},${contact.landmark})`;
      });
    } else if (input.action === "delete-address") {
      await sql`DELETE FROM addresses WHERE id=${required(input.id, "address")} AND customer_id=${id}`;
    } else if (input.action === "profile") {
      const name = required(input.name, "name", 100),
        phone = required(input.phone, "phone", 20);
      if (!/^[6-9]\d{9}$/.test(phone))
        throw new ApiError("Use a ten-digit Indian mobile number.");
      await sql`UPDATE customers SET name=${name},phone=${phone} WHERE id=${id}`;
    } else if (input.action === "favorite") {
      const product = required(input.productId, "product");
      if (input.remove === true)
        await sql`DELETE FROM favorites WHERE customer_id=${id} AND product_id=${product}`;
      else {
        const [exists] = await sql`SELECT id FROM products WHERE id=${product}`;
        if (!exists) throw new ApiError("Product not found.", 404);
        await sql`INSERT INTO favorites(customer_id,product_id) VALUES(${id},${product}) ON CONFLICT DO NOTHING`;
      }
    } else if (input.action === "read-notifications") {
      await sql`UPDATE notifications SET read_at=now() WHERE customer_id=${id} AND read_at IS NULL`;
    } else if (input.action === "ticket") {
      const orderId =
        typeof input.orderId === "string" && input.orderId
          ? input.orderId
          : null;
      if (orderId) {
        const [order] =
          await sql`SELECT id FROM orders WHERE id=${orderId} AND customer_id=${id}`;
        if (!order) throw new ApiError("Order not found in your account.", 404);
      }
      const subject = required(input.subject, "subject", 120),
        message = required(input.message, "message", 3000);
      await sql`INSERT INTO support_tickets(id,customer_id,order_id,subject,body) VALUES(${crypto.randomUUID()},${id},${orderId},${subject},${message})`;
    } else if (input.action === "delete-account") {
      const [customer] =
        await sql`SELECT password_hash,salt FROM customers WHERE id=${id}`;
      if (
        !verifyPassword(
          required(input.password, "password", 128),
          customer.password_hash,
          customer.salt,
        )
      )
        throw new ApiError("Incorrect password.", 403);
      const [active] =
        await sql`SELECT id FROM orders WHERE customer_id=${id} AND status NOT IN ('Delivered','Cancelled','Rejected') LIMIT 1`;
      if (active)
        throw new ApiError(
          "Please resolve active orders before closing your account.",
          409,
        );
      await sql.begin(async (tx) => {
        await tx`UPDATE customers SET blocked=true,session_version=session_version+1,name='Closed account',phone='',email=${`closed-${id}@invalid.local`} WHERE id=${id}`;
        await tx`DELETE FROM addresses WHERE customer_id=${id}`;
        await tx`DELETE FROM favorites WHERE customer_id=${id}`;
        await tx`UPDATE restaurants SET enabled=false,approval='suspended' WHERE owner_id=${id}`;
        await tx`UPDATE riders SET online=false,approval='suspended' WHERE id=${id}`;
      });
      await clearCustomerSession();
    } else throw new ApiError("Unknown action.");
    return Response.json({ ok: true });
  });
}
