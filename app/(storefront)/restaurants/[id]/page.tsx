import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getProducts, getCategories } from "@/lib/store";
import ShopClient from "@/components/shop/ShopClient";
import { isOpen } from "@/lib/commerce";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [r] =
    await sql`SELECT name,description FROM restaurants WHERE id=${id} AND approval='approved'`;
  return {
    title: r ? `${r.name} — Menu & delivery` : "Restaurant not found",
    description: r?.description,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [r] =
    await sql`SELECT * FROM restaurants WHERE id=${id} AND approval='approved'`;
  if (!r) notFound();
  const reviews =
    await sql`SELECT restaurant_rating,comment,created_at FROM order_reviews WHERE restaurant_id=${id} ORDER BY created_at DESC LIMIT 30`;
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  return (
    <div className="bg-cream-soft">
      <header className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="mb-2 text-sm">{r.cuisine}</p>
          <h1 className="font-serif text-4xl">{r.name}</h1>
          <p className="mt-3 max-w-2xl text-sm text-cream/80">
            {r.description}
          </p>
          <p className="mt-4 text-sm">
            {isOpen(r.opens, r.closes, r.enabled)
              ? "Open now"
              : "Currently closed"}{" "}
            · {r.eta_minutes} minute estimated delivery · ₹{r.delivery_fee}{" "}
            delivery · Minimum order ₹{r.minimum_order}
          </p>
          <p className="mt-2 text-xs">
            Hours: {r.opens}–{r.closes} IST · {r.address}
          </p>
          {r.phone ? (
            <a
              className="mt-3 inline-block text-sm underline"
              href={`tel:${r.phone}`}
            >
              Contact restaurant
            </a>
          ) : null}
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <ShopClient
          products={products.filter(
            (p) => (p.restaurantId ?? "odia-kitchen") === id,
          )}
          categories={categories}
        />
        <section className="mt-10 rounded-xl bg-white p-6">
          <h2 className="mb-4 font-serif text-2xl">Restaurant reviews</h2>
          {reviews.length ? (
            reviews.map((review, i) => (
              <div key={i} className="border-b border-black/5 py-3 text-sm">
                <p className="text-brand">
                  {review.restaurant_rating}/5 · Verified delivered order
                </p>
                <p>{review.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
