"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Guest order lookup. Posts id + phone to the API (so the phone never appears
// in a URL) and navigates to the signed tracking link it returns.
export default function OrderLookupForm({ orderId = "" }: { orderId?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const fd = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fd.get("id"), phone: fd.get("phone") }),
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Could not find that order.");
      router.push(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find that order.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Order number</span>
        <input
          name="id"
          defaultValue={orderId}
          placeholder="ord_…"
          required
          className="w-full rounded-md border border-black/10 px-3 py-2.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Phone used on the order</span>
        <input
          name="phone"
          type="tel"
          placeholder="6370649364"
          required
          className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="self-end bg-brand px-5 py-2.5 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "CHECKING…" : "TRACK"}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-red-600 sm:col-span-3">
          {error}
        </p>
      ) : null}
    </form>
  );
}
