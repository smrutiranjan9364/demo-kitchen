import type { Metadata } from "next";
import Link from "next/link";
import ShopClient from "@/components/shop/ShopClient";
import { ALL_PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/site";

export const metadata: Metadata = {
  title: "Shop — Rosy's Kitchen",
  description: "Browse and shop all authentic Odisha food products at Rosy's Kitchen.",
};

export default function ShopPage() {
  return (
    <div className="bg-cream-soft">
      {/* Page header */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <nav className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Shop</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">Shop All Products</h1>
          <p className="mt-2 max-w-xl text-sm text-cream/80">
            Everything from Rosy&apos;s Kitchen in one place — filter by category,
            search, and sort to find your favourites.
          </p>
        </div>
      </div>

      {/* Shop */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <ShopClient products={ALL_PRODUCTS} categories={CATEGORIES} />
      </div>
    </div>
  );
}
