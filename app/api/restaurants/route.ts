import { sql } from "@/lib/db";
import { api } from "@/lib/api";
import { isOpen } from "@/lib/commerce";
import { isServiceable } from "@/lib/orders";
export async function GET(request: Request) {
  return api(async () => {
    const q = new URL(request.url).searchParams;
    const term = (q.get("q") ?? "").trim().slice(0, 100),
      pincode = (q.get("pincode") ?? "").slice(0, 6);
    const page = Math.max(1, Math.min(1000, Number(q.get("page")) || 1));
    // Filter service areas before pagination so unserviceable rows never consume a page.
    const rows = await sql<
      {
        id: string;
        name: string;
        description: string;
        cuisine: string;
        address: string;
        image: string;
        delivery_fee: number;
        eta_minutes: number;
        opens: string;
        closes: string;
        enabled: boolean;
        pincodes: string;
        rating: number;
      }[]
    >`SELECT r.id,r.name,r.description,r.cuisine,r.address,r.image,r.delivery_fee,r.eta_minutes,r.opens,r.closes,r.enabled,r.pincodes,
 COALESCE((SELECT avg(v.restaurant_rating) FROM order_reviews v WHERE v.restaurant_id=r.id),0)::float AS rating
 FROM restaurants r WHERE approval='approved' AND (r.name ILIKE ${"%" + term + "%"} OR r.cuisine ILIKE ${"%" + term + "%"} OR EXISTS(SELECT 1 FROM products p WHERE p.restaurant_id=r.id AND p.name ILIKE ${"%" + term + "%"})) ORDER BY r.name`;
    let results = rows
      .filter((r) => !pincode || isServiceable(pincode, r.pincodes))
      .map((r) => ({ ...r, open: isOpen(r.opens, r.closes, r.enabled) }));
    if (q.get("open") === "true") results = results.filter((r) => r.open);
    if (q.get("sort") === "rating") results.sort((a, b) => b.rating - a.rating);
    if (q.get("sort") === "time")
      results.sort((a, b) => a.eta_minutes - b.eta_minutes);
    if (q.get("sort") === "fee")
      results.sort((a, b) => a.delivery_fee - b.delivery_fee);
    return Response.json({
      restaurants: results.slice((page - 1) * 12, page * 12),
      total: results.length,
      page,
    });
  });
}
