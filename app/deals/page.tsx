import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/home/ProductCard";
import { TOP_DEALS } from "@/data/products";

export const metadata: Metadata = {
  title: "Deals — Odia Kitchen",
  description: "Grab the best offers on authentic Odisha food at Odia Kitchen.",
};

export default function DealsPage() {
  const maxDiscount = Math.max(...TOP_DEALS.map((d) => d.discount ?? 0));

  return (
    <div className="bg-cream-soft">
      {/* Hero */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <nav className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Deals</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold tracking-widest">
                LIMITED TIME
              </span>
              <h1 className="mt-3 font-serif text-3xl sm:text-5xl">Top Deals</h1>
              <p className="mt-2 max-w-xl text-sm text-cream/85">
                Save on festive boxes, snack combos and spice sets — freshly packed,
                heavily discounted.
              </p>
            </div>
            <div className="rounded-xl bg-cream/10 px-6 py-4 text-center">
              <p className="font-serif text-4xl">{maxDiscount}%</p>
              <p className="text-xs tracking-widest text-cream/80">UP TO OFF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deals grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="mb-6 text-sm text-gray-500">
          {TOP_DEALS.length} {TOP_DEALS.length === 1 ? "deal" : "deals"} available
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TOP_DEALS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <h2 className="font-serif text-2xl text-gray-900">Looking for more?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Browse the full range across every category.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
          >
            SHOP ALL PRODUCTS
          </Link>
        </div>
      </section>
    </div>
  );
}
