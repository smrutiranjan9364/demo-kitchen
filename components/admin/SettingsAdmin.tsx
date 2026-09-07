"use client";

import { useState } from "react";
import type { Settings } from "@/lib/store";
import { useAdminUI } from "./AdminUI";

export default function SettingsAdmin({ initial }: { initial: Settings }) {
  const { toast } = useAdminUI();
  const [form, setForm] = useState({
    storeName: initial.storeName,
    email: initial.email,
    phone: initial.phone,
    deliveryFee: String(initial.deliveryFee),
    freeDeliveryOver: String(initial.freeDeliveryOver),
    fssai: initial.fssai,
    deliveryPincodes: initial.deliveryPincodes,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.storeName,
          email: form.email,
          phone: form.phone,
          deliveryFee: Number(form.deliveryFee),
          freeDeliveryOver: Number(form.freeDeliveryOver),
          fssai: form.fssai,
          deliveryPincodes: form.deliveryPincodes,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      toast("Settings saved");
    } catch {
      setError("Could not save settings.");
      toast("Could not save settings", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Store details and delivery options.</p>

      <form onSubmit={save} className="mt-6 space-y-6">
        <fieldset className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <legend className="px-2 font-semibold text-gray-900">Store details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Store name" value={form.storeName} onChange={(v) => set("storeName", v)} />
            </div>
            <Input label="Contact email" type="email" value={form.email} onChange={(v) => set("email", v)} />
            <Input label="Contact phone" value={form.phone} onChange={(v) => set("phone", v)} />
            <div className="sm:col-span-2">
              <Input label="FSSAI licence number" value={form.fssai} onChange={(v) => set("fssai", v)} />
              <p className="mt-1 text-xs text-gray-400">
                Required on any site selling food in India. Shown in the storefront footer once filled in.
              </p>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <legend className="px-2 font-semibold text-gray-900">Delivery</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Delivery fee (₹)" type="number" value={form.deliveryFee} onChange={(v) => set("deliveryFee", v)} />
            <Input label="Free delivery over (₹)" type="number" value={form.freeDeliveryOver} onChange={(v) => set("freeDeliveryOver", v)} />
            <div className="sm:col-span-2">
              <Input label="Serviceable pincodes" value={form.deliveryPincodes} onChange={(v) => set("deliveryPincodes", v)} />
              <p className="mt-1 text-xs text-gray-400">
                Comma-separated prefixes, e.g. <code className="rounded bg-cream-soft px-1">751, 752, 7530</code>.
                Checkout rejects anything else. Leave blank to deliver everywhere.
              </p>
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          {saved ? <span className="text-sm font-medium text-rating">✓ Saved</span> : null}
          {error ? <span className="text-sm text-red-600">{error}</span> : null}
        </div>
      </form>
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
