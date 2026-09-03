"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Product } from "@/data/products";
import type { Category } from "@/data/site";
import SlideOver from "./SlideOver";
import SearchableSelect from "./SearchableSelect";

const slugOf = (c: Category) => c.href.replace("/category/", "");

type FormState = {
  name: string;
  price: string;
  category: string;
  image: string;
  oldPrice: string;
  discount: string;
  rating: string;
  reviews: string;
};

const EMPTY: FormState = {
  name: "",
  price: "",
  category: "",
  image: "",
  oldPrice: "",
  discount: "",
  rating: "4.5",
  reviews: "0",
};

function toForm(p: Product): FormState {
  return {
    name: p.name,
    price: String(p.price),
    category: p.category ?? "",
    image: p.image ?? "",
    oldPrice: p.oldPrice != null ? String(p.oldPrice) : "",
    discount: p.discount != null ? String(p.discount) : "",
    rating: String(p.rating),
    reviews: String(p.reviews),
  };
}

function toPayload(f: FormState) {
  return {
    name: f.name.trim(),
    price: Number(f.price),
    category: f.category || undefined,
    image: f.image.trim() || undefined,
    oldPrice: f.oldPrice ? Number(f.oldPrice) : undefined,
    discount: f.discount ? Number(f.discount) : undefined,
    rating: f.rating ? Number(f.rating) : undefined,
    reviews: f.reviews ? Number(f.reviews) : undefined,
  };
}

export default function ProductsAdmin({
  initialProducts,
  categories,
  heading = "Products",
  lockedCategory,
}: {
  initialProducts: Product[];
  categories: Category[];
  heading?: string;
  // When set, this view is scoped to one category: the category filter is
  // hidden and new products default to (and are locked to) this category.
  lockedCategory?: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null); // null = closed, "new" = add
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Filtering + pagination
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!catFilter || p.category === catFilter) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [products, query, catFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  function openAdd() {
    setForm({ ...EMPTY, category: lockedCategory ?? "" });
    setEditingId("new");
    setError("");
  }
  function openEdit(p: Product) {
    setForm(toForm(p));
    setEditingId(p.id);
    setError("");
  }
  function close() {
    setEditingId(null);
    setError("");
  }
  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price || Number.isNaN(Number(form.price))) {
      return setError("Name and a valid price are required.");
    }
    setBusy(true);
    setError("");
    const payload = toPayload(form);
    try {
      if (editingId === "new") {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created: Product = await res.json();
        setProducts((prev) => [created, ...prev]);
      } else if (editingId) {
        const res = await fetch(`/api/admin/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const updated: Product = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
      close();
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">{heading}</h1>
          <p className="mt-1 text-sm text-gray-500">{products.length} products</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          + Add product
        </button>
      </div>

      {/* Editor (slide-over) */}
      <SlideOver
        open={editingId !== null}
        onClose={close}
        title={editingId === "new" ? "New product" : "Edit product"}
      >
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="grid flex-1 gap-4">
            <Input label="Name" value={form.name} onChange={(v) => set("name", v)} />
            <Input label="Price (₹)" type="number" value={form.price} onChange={(v) => set("price", v)} />
            {!lockedCategory && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Category</span>
                <SearchableSelect
                  value={form.category}
                  onChange={(v) => set("category", v)}
                  options={categories.map((c) => ({ value: slugOf(c), label: c.label }))}
                  placeholder="Select category"
                />
              </label>
            )}
            <Input label="Image URL" value={form.image} onChange={(v) => set("image", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Old price (₹)" type="number" value={form.oldPrice} onChange={(v) => set("oldPrice", v)} />
              <Input label="Discount (%)" type="number" value={form.discount} onChange={(v) => set("discount", v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Rating" type="number" value={form.rating} onChange={(v) => set("rating", v)} />
              <Input label="Reviews count" type="number" value={form.reviews} onChange={(v) => set("reviews", v)} />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <div className="mt-6 flex gap-3 border-t border-black/5 pt-4">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search products…"
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        {!lockedCategory && (
          <select
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.href} value={slugOf(c)}>
                {c.label}
              </option>
            ))}
          </select>
        )}
        {(query || catFilter) && (
          <button
            onClick={() => {
              setQuery("");
              setCatFilter("");
              setPage(1);
            }}
            className="rounded-lg border border-black/10 px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  No products match your filters.
                </td>
              </tr>
            ) : null}
            {paged.map((p) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-cream-soft">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                      ) : null}
                    </span>
                    <span className="font-medium text-gray-800">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.category ?? "—"}</td>
                <td className="px-4 py-3 text-gray-800">₹{p.price}</td>
                <td className="px-4 py-3 text-gray-500">
                  {p.rating} ({p.reviews})
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-cream-soft"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-gray-500">
          {filtered.length === 0
            ? "0 products"
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </p>
        {totalPages > 1 ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current <= 1}
              className="rounded-md border border-black/10 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:text-gray-700"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-md text-xs font-semibold transition ${
                  n === current
                    ? "bg-brand text-cream"
                    : "border border-black/10 text-gray-700 hover:border-brand hover:text-brand"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current >= totalPages}
              className="rounded-md border border-black/10 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:text-gray-700"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === "number" ? "any" : undefined}
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}
