import { createMetadata, isSearchVariant, seoPage } from "@/lib/seo";
import { PageJsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import ShopClient from "@/components/shop/ShopClient";
import { getProducts, getCategories } from "@/lib/store";

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return createMetadata({ ...seoPage("/shop"), noindex: isSearchVariant(await searchParams) });
}

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <div className="bg-cream-soft">
      <PageJsonLd page={seoPage("/shop")} />
      {/* Page header */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Shop</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">Shop All Products</h1>
          <p className="mt-2 max-w-xl text-sm text-cream/80">
            Everything from Odia Kitchen in one place — filter by category,
            search, and sort to find your favourites.
          </p>
        </div>
      </div>

      {/* Shop */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <ShopClient products={products} categories={categories} />
      </div>
    </div>
  );
}
