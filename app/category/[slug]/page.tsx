import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import { CATEGORIES, getCategoryBySlug, categorySlug } from "@/data/site";
import { getProductsByCategory } from "@/data/products";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: categorySlug(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category not found — Rosy's Kitchen" };
  return {
    title: `${category.label} — Rosy's Kitchen`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = getProductsByCategory(slug);

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
            <Link href="/categories" className="hover:text-white">
              Categories
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">{category.label}</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">{category.label}</h1>
          {category.description ? (
            <p className="mt-2 max-w-xl text-sm text-cream/80">{category.description}</p>
          ) : null}
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="mb-6 text-sm text-gray-500">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>

        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">
            No products in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
