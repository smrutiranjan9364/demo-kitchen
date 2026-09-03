import Link from "next/link";
import { getProducts, getOrders, getReviews, getCategories } from "@/lib/store";
import BarChart from "@/components/admin/BarChart";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export default async function OverviewPage() {
  const [products, orders, reviews, categories] = await Promise.all([
    getProducts(),
    getOrders(),
    getReviews(),
    getCategories(),
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);

  // Revenue for each of the last 7 days.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const revByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const total = orders
      .filter((o) => {
        const t = new Date(o.createdAt);
        return t >= d && t < next;
      })
      .reduce((s, o) => s + o.total, 0);
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), value: Math.round(total) };
  });

  // Products per category (top 6).
  const topCats = [...categories]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 6);
  const maxCat = Math.max(1, ...topCats.map((c) => c.count ?? 0));

  const stats = [
    { label: "Revenue", value: `₹${revenue.toFixed(0)}`, tint: "text-rating", href: "/backend/dashboard/orders" },
    { label: "Orders", value: orders.length, tint: "text-brand", href: "/backend/dashboard/orders" },
    { label: "Products", value: products.length, tint: "text-gray-900", href: "/backend/dashboard/products" },
    { label: "Categories", value: categories.length, tint: "text-gray-900", href: "/backend/dashboard/categories" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">A snapshot of your store.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{s.label}</p>
            <p className={`mt-2 font-serif text-3xl ${s.tint}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Revenue — last 7 days</h2>
            <span className="text-sm text-gray-400">
              ₹{revByDay.reduce((s, d) => s + d.value, 0).toLocaleString("en-IN")} total
            </span>
          </div>
          <div className="mt-4 text-gray-900">
            <BarChart points={revByDay} prefix="₹" />
          </div>
        </div>

        {/* Products by category */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold text-gray-900">Products by category</h2>
          <ul className="mt-4 space-y-3">
            {topCats.map((c) => (
              <li key={c.href}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-gray-700">{c.label}</span>
                  <span className="text-gray-400">{c.count ?? 0}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-cream-soft">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${((c.count ?? 0) / maxCat) * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {topCats.length === 0 ? (
              <li className="text-sm text-gray-400">No categories yet.</li>
            ) : null}
          </ul>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent orders</h2>
            <Link href="/backend/dashboard/orders" className="text-xs font-semibold text-brand">
              View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-black/5">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{o.name}</p>
                    <p className="text-xs text-gray-400">{fmtDate(o.createdAt)} · {o.payment}</p>
                  </div>
                  <span className="font-semibold text-gray-900">₹{o.total.toFixed(0)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent reviews</h2>
            <Link href="/backend/dashboard/reviews" className="text-xs font-semibold text-brand">
              View all
            </Link>
          </div>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-black/5">
              {reviews.slice(0, 5).map((r) => (
                <li key={r.id} className="py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{r.name}</span>
                    <span className="text-amber-400 text-xs">{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
