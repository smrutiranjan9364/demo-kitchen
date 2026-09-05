"use client";

import { useState } from "react";
import Image from "next/image";

import type { AdminDistrict } from "@/lib/store";
import SlideOver from "./SlideOver";
import { useAdminUI } from "./AdminUI";

type FormState = {
  name: string;
  slug: string;
  region: string;
  headquarter: string;
  description: string;
  image: string;
  sortOrder: string;
};
const EMPTY: FormState = {
  name: "",
  slug: "",
  region: "",
  headquarter: "",
  description: "",
  image: "",
  sortOrder: "0",
};

export default function DistrictsAdmin({
  initialDistricts,
}: {
  initialDistricts: AdminDistrict[];
}) {
  const { toast, confirm } = useAdminUI();
  const [districts, setDistricts] = useState<AdminDistrict[]>(initialDistricts);
  const [editing, setEditing] = useState<string | null>(null); // null closed, "new", or slug
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(districts.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const paged = districts.slice(start, start + PAGE_SIZE);

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function openAdd() {
    setForm(EMPTY);
    setEditing("new");
    setError("");
  }
  function openEdit(d: AdminDistrict) {
    setForm({
      name: d.name,
      slug: d.slug,
      region: d.region ?? "",
      headquarter: d.headquarter ?? "",
      description: d.description ?? "",
      image: d.image ?? "",
      sortOrder: String(d.sortOrder ?? 0),
    });
    setEditing(d.slug);
    setError("");
  }
  function close() {
    setEditing(null);
    setError("");
  }

  function sortDistricts(list: AdminDistrict[]) {
    return [...list].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("District name is required.");
    setBusy(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      region: form.region.trim() || undefined,
      headquarter: form.headquarter.trim() || undefined,
      description: form.description.trim() || undefined,
      image: form.image.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editing === "new") {
        const res = await fetch("/api/admin/districts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, slug: form.slug.trim() || undefined }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Could not add district");
        }
        const created: AdminDistrict = await res.json();
        setDistricts((prev) => sortDistricts([...prev, created]));
        toast("District added");
      } else if (editing) {
        const res = await fetch(`/api/admin/districts/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Could not update district");
        const updated: AdminDistrict = await res.json();
        setDistricts((prev) =>
          sortDistricts(prev.map((d) => (d.slug === editing ? updated : d))),
        );
        toast("District updated");
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

  async function remove(d: AdminDistrict) {
    const ok = await confirm({
      title: "Delete district",
      message: `Delete "${d.name}"? It will be removed from the storefront menu.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/districts/${d.slug}`, { method: "DELETE" });
    if (res.ok) {
      setDistricts((prev) => prev.filter((x) => x.slug !== d.slug));
      toast("District deleted");
    } else {
      toast("Could not delete district", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">Districts</h1>
          <p className="mt-1 text-sm text-gray-500">{districts.length} districts</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          + Add district
        </button>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Headquarter</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No districts yet. Click “Add district” to create one.
                </td>
              </tr>
            ) : (
              paged.map((d) => (
                <tr key={d.slug} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {d.image ? (
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-cream-soft">
                          <Image src={d.image} alt={d.name} fill sizes="40px" className="object-cover" />
                        </span>
                      ) : null}
                      <div>
                        <p className="font-medium text-gray-800">{d.name}</p>
                        {d.description ? (
                          <p className="max-w-xs truncate text-xs text-gray-400">{d.description}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{d.region ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{d.headquarter ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">/{d.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{d.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-cream-soft"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(d)}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-gray-500">
          {districts.length === 0
            ? "0 districts"
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, districts.length)} of ${districts.length}`}
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
        title={editing === "new" ? "New district" : "Edit district"}
      >
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="grid flex-1 gap-4">
            <Input label="Name" value={form.name} onChange={(v) => set("name", v)} />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(v) => set("slug", v)}
              placeholder="auto from name"
              disabled={editing !== "new"}
            />
            <Input label="Region" value={form.region} onChange={(v) => set("region", v)} placeholder="Coastal / Western / …" />
            <Input label="Headquarter" value={form.headquarter} onChange={(v) => set("headquarter", v)} />
            <Input label="Image URL" value={form.image} onChange={(v) => set("image", v)} />
            <Input
              label="Sort order"
              value={form.sortOrder}
              onChange={(v) => set("sortOrder", v.replace(/[^0-9-]/g, ""))}
              placeholder="0"
            />
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
