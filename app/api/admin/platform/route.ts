import { sql } from "@/lib/db";
import { api, ApiError, body, integer, required, sameOrigin } from "@/lib/api";
import { adminRequired, assignRider } from "@/lib/platform";
import { csvCell } from "@/lib/commerce";
export async function GET(request: Request) {
  return api(async () => {
    await adminRequired();
    const url = new URL(request.url);
    const page = Math.max(
      0,
      Math.min(10000, Number(url.searchParams.get("page")) || 0),
    );
    const [
      restaurants,
      riders,
      customers,
      tickets,
      coupons,
      refunds,
      earnings,
      audit,
    ] = await Promise.all([
      sql`SELECT * FROM restaurants ORDER BY created_at DESC LIMIT 100 OFFSET ${page * 100}`,
      sql`SELECT r.*,c.name,c.phone FROM riders r JOIN customers c ON c.id=r.id ORDER BY r.created_at DESC LIMIT 100 OFFSET ${page * 100}`,
      sql`SELECT id,name,email,phone,blocked,verified_at FROM customers ORDER BY created_at DESC LIMIT 100 OFFSET ${page * 100}`,
      sql`SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 100 OFFSET ${page * 100}`,
      sql`SELECT * FROM coupons ORDER BY expires_at DESC LIMIT 100`,
      sql`SELECT * FROM refunds ORDER BY created_at DESC LIMIT 100 OFFSET ${page * 100}`,
      sql`SELECT * FROM earnings ORDER BY created_at DESC LIMIT 100 OFFSET ${page * 100}`,
      sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100 OFFSET ${page * 100}`,
    ]);
    if (url.searchParams.get("export") === "earnings")
      return new Response(
        [
          [
            "Order",
            "Restaurant",
            "Rider",
            "Restaurant earnings",
            "Rider earnings",
            "Commission",
          ]
            .map(csvCell)
            .join(","),
          ...earnings.map((e) =>
            [
              e.order_id,
              e.restaurant_id,
              e.rider_id,
              e.restaurant_amount,
              e.rider_amount,
              e.commission,
            ]
              .map(csvCell)
              .join(","),
          ),
        ].join("\r\n"),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="earnings.csv"',
          },
        },
      );
    return Response.json({
      restaurants,
      riders,
      customers,
      tickets,
      coupons,
      refunds,
      earnings,
      audit,
      page,
    });
  });
}
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const actor = await adminRequired();
    const input = await body(request);
    const id = typeof input.id === "string" ? input.id : "";
    if (input.action === "approval") {
      const status = required(input.status, "approval status");
      if (!["approved", "rejected", "suspended"].includes(status))
        throw new ApiError("Invalid approval status.");
      if (input.kind === "restaurant")
        await sql`UPDATE restaurants SET approval=${status} WHERE id=${id}`;
      else if (input.kind === "rider")
        await sql`UPDATE riders SET approval=${status},online=false WHERE id=${id}`;
      else throw new ApiError("Invalid partner type.");
    } else if (input.action === "block") {
      await sql.begin(async (tx) => {
        await tx`UPDATE customers SET blocked=${input.blocked === true},session_version=session_version+1 WHERE id=${id}`;
        if (input.blocked === true) {
          await tx`UPDATE riders SET online=false,approval='suspended' WHERE id=${id}`;
          await tx`UPDATE restaurants SET approval='suspended' WHERE owner_id=${id}`;
        }
      });
    } else if (input.action === "assign")
      await assignRider(id, required(input.riderId, "rider"), actor);
    else if (input.action === "ticket") {
      const status = required(input.status, "ticket status");
      if (!["Open", "In progress", "Resolved"].includes(status))
        throw new ApiError("Invalid ticket status.");
      await sql`UPDATE support_tickets SET status=${status},reply=${required(input.reply, "reply", 3000)},updated_at=now() WHERE id=${id}`;
    } else if (input.action === "coupon") {
      const code = required(input.code, "coupon code", 40).toUpperCase(),
        kind = required(input.kind, "coupon type");
      if (
        !/^[A-Z0-9_-]+$/.test(code) ||
        !["flat", "percent", "delivery"].includes(kind)
      )
        throw new ApiError("Invalid coupon.");
      const expires = new Date(required(input.expires_at, "expiry date"));
      if (!Number.isFinite(expires.getTime()))
        throw new ApiError("Invalid expiry date.");
      const value = integer(
          input.value,
          "discount",
          0,
          kind === "percent" ? 100 : 100000,
        ),
        minimum = integer(input.minimum, "minimum"),
        maximum = integer(input.maximum, "maximum");
      await sql`INSERT INTO coupons(code,kind,value,minimum,maximum,first_order,expires_at,active) VALUES(${code},${kind},${value},${minimum},${maximum},${input.first_order === true},${expires},${input.active === true}) ON CONFLICT(code) DO UPDATE SET kind=EXCLUDED.kind,value=EXCLUDED.value,minimum=EXCLUDED.minimum,maximum=EXCLUDED.maximum,first_order=EXCLUDED.first_order,expires_at=EXCLUDED.expires_at,active=EXCLUDED.active`;
    } else if (input.action === "commission")
      await sql`UPDATE restaurants SET commission_bps=${integer(input.commission_bps, "commission basis points", 0, 10000)} WHERE id=${id}`;
    else throw new ApiError("Unknown action.");
    await sql`INSERT INTO audit_logs(actor,action,target) VALUES(${actor},${String(input.action)},${id || String(input.code ?? "")})`;
    return Response.json({ ok: true });
  });
}
