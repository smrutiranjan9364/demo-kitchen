"use client";

import { useState } from "react";
import { useServerData } from "./useServerData";
import Image from "next/image";
import type { FestivalFood } from "@/lib/store";
import SlideOver from "./SlideOver";
import { useAdminUI } from "./AdminUI";

type FormState = { name: string; festival: string; image: string; note: string };
const EMPTY: FormState = { name: "", festival: "", image: "", note: "" };

export default function FestivalAdmin({
  initialFoods,
}: {
  initialFoods: FestivalFood[];
}) {
  const { toast, confirm } = useAdminUI();
  const [foods, setFoods] = useServerData<FestivalFood[]>(initialFoods);
  const [editing, setEditing] = useState<string | null>(null); // null | "new" | id
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function openAdd() {
    setForm(EMPTY);
    setEditing("new");
    setError("");
  }
  function openEdit(f: FestivalFood) {
    setForm({ name: f.name, festival: f.festival, image: f.image ?? "", note: f.note ?? "" });
    setEditing(f.id);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.festival.trim()) {
      return setError("Name and festival are required.");
    }
    setBusy(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      festival: form.festival.trim(),
      image: form.image.trim() || undefined,
      note: form.note.trim() || undefined,
    };
    try {
      if (editing === "new") {
        const res = await fetch("/api/admin/festival", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created: FestivalFood = await res.json();
        setFoods((prev) => [...prev, created]);
        toast("Festival item added");
      } else if (editing) {
        const res = await fetch(`/api/admin/festival/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const updated: FestivalFood = await res.json();
        setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        toast("Festival item updated");
      }
      setEditing(null);
    } catch {
      setError("Could not save. Please try again.");
      toast("Could not save festival item", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(f: FestivalFood) {
    const ok = await confirm({
      title: "Delete festival item",
      message: `"${f.name}" will be removed from the festival page.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/festival/${f.id}`, { method: "DELETE" });
    if (res.ok) {
      setFoods((prev) => prev.filter((x) => x.id !== f.id));
      toast("Festival item deleted");
    } else {
      toast("Could not delete item", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">Festival Menu</h1>
          <p className="mt-1 text-sm text-gray-500">
            {foods.length} items shown on the storefront festival page.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          + Add festival item
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Festival</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {foods.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                  No festival items yet.
                </td>
              </tr>
            ) : null}
            {foods.map((f) => (
              <tr key={f.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-cream-soft">
                      {f.image ? (
                        <Image src={f.image} alt={f.name} fill sizes="40px" className="object-cover" />
                      ) : null}
                    </span>
                    <span className="font-medium text-gray-800">{f.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-cream-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
                    {f.festival}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="line-clamp-1 max-w-xs text-xs text-gray-500">{f.note ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(f)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-cream-soft"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(f)}
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

      <SlideOver
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New festival item" : "Edit festival item"}
      >
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="grid flex-1 gap-4">
            <Input label="Name" value={form.name} onChange={(v) => set("name", v)} />
            <Input
              label="Festival / occasion"
              value={form.festival}
              onChange={(v) => set("festival", v)}
              placeholder="e.g. Raja Parba, Makar Sankranti"
            />
            <Input label="Image URL" value={form.image} onChange={(v) => set("image", v)} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Note / description</span>
              <textarea
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
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
              onClick={() => setEditing(null)}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}
