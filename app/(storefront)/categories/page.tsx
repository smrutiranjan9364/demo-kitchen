import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/store";
import CategoryGrid from "@/components/categories/CategoryGrid";

export const metadata: Metadata = {
  title: "All Categories — Odia Kitchen",
  description: "Browse and search every category of authentic Odisha food at Odia Kitchen.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();
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
            <span className="text-cream">Categories</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">Shop by Category</h1>
          <p className="mt-2 max-w-xl text-sm text-cream/80">
            Explore Odisha&apos;s authentic flavours — from comforting classics to
            festive delicacies.
          </p>
        </div>
      </div>

      {/* Searchable grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <CategoryGrid categories={categories} />
      </div>
    </div>
  );
}
