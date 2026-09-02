"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/home/ProductCard";
import type { Product } from "@/data/products";
import type { Category } from "@/data/site";
import { categorySlug } from "@/data/site";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
];

export default function ShopClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      const matchesCat = activeCat === "all" || p.category === activeCat;
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });

    list = [...list];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [products, query, activeCat, sort]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-brand sm:max-w-xs sm:flex-1">
          <SearchIcon className="h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            aria-label="Search products"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Category chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
          All
        </Chip>
        {categories.map((c) => {
          const slug = categorySlug(c);
          return (
            <Chip key={slug} active={activeCat === slug} onClick={() => setActiveCat(slug)}>
              {c.label}
            </Chip>
          );
        })}
      </div>

      {/* Results */}
      <p className="mb-4 text-sm text-gray-500">
        {filtered.length} {filtered.length === 1 ? "product" : "products"}
      </p>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">
          No products match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition ${
        active
          ? "bg-brand text-cream"
          : "border border-black/10 bg-white text-gray-600 hover:border-brand/40 hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
