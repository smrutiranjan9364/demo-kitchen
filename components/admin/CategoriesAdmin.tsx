"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Category } from "@/data/site";
import SlideOver from "./SlideOver";
import { useAdminUI } from "./AdminUI";

// Derive the slug from a category's href (/category/<slug>).
const slugOf = (c: Category) => c.href.replace("/category/", "");

type FormState = { label: string; slug: string; image: string; description: string };
const EMPTY: FormState = { label: "", slug: "", image: "", description: "" };

export default function CategoriesAdmin({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const { toast, confirm } = useAdminUI();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editing, setEditing] = useState<string | null>(null); // null closed, "new", or slug
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const paged = categories.slice(start, start + PAGE_SIZE);

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function openAdd() {
    setForm(EMPTY);
    setEditing("new");
    setError("");
  }
  function openEdit(c: Category) {
    setForm({
      label: c.label,
      slug: slugOf(c),
      image: c.image ?? "",
      description: c.description ?? "",
    });
    setEditing(slugOf(c));
    setError("");
  }
  function close() {
    setEditing(null);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) return setError("Category name is required.");
    setBusy(true);
    setError("");
    try {
      if (editing === "new") {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            slug: form.slug.trim() || undefined,
            image: form.image.trim() || undefined,
            description: form.description.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Could not add category");
        }
        const raw = await res.json();
        setCategories((prev) => [
          ...prev,
          {
            label: raw.label,
            href: `/category/${raw.slug}`,
            image: raw.image,
            description: raw.description,
            count: 0,
          },
        ]);
        toast("Category added");
      } else if (editing) {
        const res = await fetch(`/api/admin/categories/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            image: form.image.trim() || undefined,
            description: form.description.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error("Could not update category");
        const raw = await res.json();
        setCategories((prev) =>
          prev.map((c) =>
            slugOf(c) === editing
              ? { ...c, label: raw.label, image: raw.image, description: raw.description }
              : c,
          ),
        );
        toast("Category updated");
      }
      close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Category) {
    const ok = await confirm({
      title: "Delete category",
      message: `Delete "${c.label}"? Products keep their tag but won't show anywhere.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/categories/${slugOf(c)}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((x) => x.href !== c.href));
      toast("Category deleted");
    } else {
      toast("Could not delete category", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          + Add category
        </button>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => (
              <tr key={c.href} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-cream-soft">
                      {c.image ? (
                        <Image src={c.image} alt={c.label} fill sizes="40px" className="object-cover" />
                      ) : null}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{c.label}</p>
                      {c.description ? (
                        <p className="max-w-xs truncate text-xs text-gray-400">{c.description}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">/{slugOf(c)}</td>
                <td className="px-4 py-3 text-gray-500">{c.count ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/backend/dashboard/categories/${slugOf(c)}`}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      View products
                    </Link>
                    <button
                      onClick={() => openEdit(c)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-cream-soft"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(c)}
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
          {categories.length === 0
            ? "0 categories"
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, categories.length)} of ${categories.length}`}
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

      {/* Form (slide-over) */}
      <SlideOver
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? "New category" : "Edit category"}
      >
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="grid flex-1 gap-4">
            <Input label="Name" value={form.label} onChange={(v) => set("label", v)} />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(v) => set("slug", v)}
              placeholder="auto from name"
              disabled={editing !== "new"}
            />
            <Input label="Image URL" value={form.image} onChange={(v) => set("image", v)} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </label>
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
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-gray-50 disabled:text-gray-400"
      />
    </label>
  );
}
