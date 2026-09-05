"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/data/site";

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [categories, query]);

  return (
    <div>
      {/* Search filter */}
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-brand sm:max-w-md">
        <SearchIcon className="h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          aria-label="Search categories"
        />
        {query ? (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="text-gray-400 hover:text-brand"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">
          No categories match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((cat, index) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="(min-width: 1280px) 290px, (min-width: 1024px) calc(25vw - 30px), (min-width: 640px) calc(50vw - 36px), calc(100vw - 32px)"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : undefined}
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                {cat.count ? (
                  <span className="absolute left-3 top-3 rounded-full bg-brand/90 px-2.5 py-1 text-[10px] font-semibold text-cream shadow">
                    {cat.count} items
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl text-gray-900">{cat.label}</h2>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-brand transition group-hover:bg-brand group-hover:text-cream">
                    <ArrowIcon className="h-4 w-4" />
                  </span>
                </div>
                {cat.description ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                    {cat.description}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
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

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
