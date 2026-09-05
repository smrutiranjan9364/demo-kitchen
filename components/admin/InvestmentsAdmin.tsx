"use client";

import { useMemo, useState } from "react";

import type { Investment } from "@/lib/store";
import SlideOver from "./SlideOver";
import { useAdminUI } from "./AdminUI";
import { useServerData } from "./useServerData";

const CATEGORY_SUGGESTIONS = [
  "Ingredients",
  "Raw Material",
  "Equipment",
  "Packaging",
  "Marketing",
  "Rent",
  "Salaries",
  "Utilities",
  "Transport",
  "Maintenance",
  "Licenses & Fees",
  "Other",
];

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Other"];

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const today = () => new Date().toISOString().slice(0, 10);

type FormState = {
  item: string;
  category: string;
  amount: string;
  spentOn: string;
  paidTo: string;
  paymentMethod: string;
  notes: string;
};

const EMPTY: FormState = {
  item: "",
  category: "",
  amount: "",
  spentOn: today(),
  paidTo: "",
  paymentMethod: "",
  notes: "",
};

export default function InvestmentsAdmin({
  initialInvestments,
}: {
  initialInvestments: Investment[];
}) {
  const { toast, confirm } = useAdminUI();
  const [items, setItems] = useServerData<Investment[]>(initialInvestments);
  const [editing, setEditing] = useState<string | null>(null); // null closed, "new", or id
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.item.toLowerCase().includes(q) ||
        (i.category ?? "").toLowerCase().includes(q) ||
        (i.paidTo ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  // Summary tiles — computed over the current (filtered) view.
  const totalSpent = useMemo(() => filtered.reduce((s, i) => s + i.amount, 0), [filtered]);
  const thisMonthSpent = useMemo(() => {
    const prefix = today().slice(0, 7); // YYYY-MM
    return filtered
      .filter((i) => (i.spentOn ?? "").startsWith(prefix))
      .reduce((s, i) => s + i.amount, 0);
  }, [filtered]);

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function openAdd() {
    setForm({ ...EMPTY, spentOn: today() });
    setEditing("new");
    setError("");
  }
  function openEdit(i: Investment) {
    setForm({
      item: i.item,
      category: i.category ?? "",
      amount: String(i.amount),
      spentOn: i.spentOn ?? "",
      paidTo: i.paidTo ?? "",
      paymentMethod: i.paymentMethod ?? "",
      notes: i.notes ?? "",
    });
    setEditing(i.id);
    setError("");
  }
  function close() {
    setEditing(null);
    setError("");
  }

  function sortItems(list: Investment[]) {
    return [...list].sort(
      (a, b) =>
        (b.spentOn ?? "").localeCompare(a.spentOn ?? "") ||
        b.createdAt.localeCompare(a.createdAt),
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.item.trim()) return setError("Item is required.");
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount < 0) {
      return setError("Enter a valid amount.");
    }
    setBusy(true);
    setError("");
    const payload = {
      item: form.item.trim(),
      category: form.category.trim() || undefined,
      amount,
      spentOn: form.spentOn.trim() || undefined,
      paidTo: form.paidTo.trim() || undefined,
      paymentMethod: form.paymentMethod.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editing === "new") {
        const res = await fetch("/api/admin/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Could not add entry");
        }
        const created: Investment = await res.json();
        setItems((prev) => sortItems([created, ...prev]));
        toast("Investment added");
      } else if (editing) {
        const res = await fetch(`/api/admin/investments/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Could not update entry");
        const updated: Investment = await res.json();
        setItems((prev) => sortItems(prev.map((i) => (i.id === editing ? updated : i))));
        toast("Investment updated");
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

  async function remove(i: Investment) {
    const ok = await confirm({
      title: "Delete entry",
      message: `Delete "${i.item}" (${rupees(i.amount)})? This cannot be undone.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/investments/${i.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x.id !== i.id));
      toast("Investment deleted");
    } else {
      toast("Could not delete entry", "error");
    }
  }

  const fmtDate = (d?: string) =>
    d
      ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">Investments</h1>
          <p className="mt-1 text-sm text-gray-500">
            {items.length} {items.length === 1 ? "entry" : "entries"} — where money is spent
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          + Add investment
        </button>
      </div>

      {/* Summary tiles */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryTile label="Total spent" value={rupees(totalSpent)} />
        <SummaryTile label="This month" value={rupees(thisMonthSpent)} />
        <SummaryTile label="Entries" value={String(filtered.length)} />
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by item, category or vendor…"
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-md"
        />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Paid to</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No investments yet. Click “Add investment” to record spending.
                </td>
              </tr>
            ) : (
              paged.map((i) => (
                <tr key={i.id} className="border-b border-black/5 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{fmtDate(i.spentOn)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{i.item}</p>
                    {i.notes ? (
                      <p className="max-w-xs truncate text-xs text-gray-400">{i.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{i.category ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{i.paidTo ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{i.paymentMethod ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-800">
                    {rupees(i.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(i)}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-cream-soft"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(i)}
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
          {filtered.length === 0
            ? "0 entries"
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

      {/* Form (slide-over) */}
      <SlideOver
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? "New investment" : "Edit investment"}
      >
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="grid flex-1 gap-4">
            <Input label="Item (what did you spend on?)" value={form.item} onChange={(v) => set("item", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount (₹)"
                type="number"
                value={form.amount}
                onChange={(v) => set("amount", v)}
              />
              <Input label="Date" type="date" value={form.spentOn} onChange={(v) => set("spentOn", v)} />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Category</span>
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                list="investment-categories"
                placeholder="e.g. Ingredients"
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <datalist id="investment-categories">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <Input label="Paid to (vendor / person)" value={form.paidTo} onChange={(v) => set("paidTo", v)} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Payment method</span>
              <select
                value={form.paymentMethod}
                onChange={(e) => set("paymentMethod", e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-serif text-2xl text-gray-900">{value}</p>
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
