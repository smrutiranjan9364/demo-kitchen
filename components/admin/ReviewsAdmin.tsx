"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminUI } from "@/components/admin/AdminUI";
import { useServerData } from "@/components/admin/useServerData";
import type { StoredReview } from "@/lib/store";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function ReviewsAdmin({ reviews: serverReviews }: { reviews: StoredReview[] }) {
  const [reviews, setReviews] = useServerData(serverReviews);
  const { toast, confirm } = useAdminUI();
  const [busy, setBusy] = useState<string | null>(null);

  async function setApproved(review: StoredReview, approved: boolean) {
    setBusy(review.id);
    setReviews((list) => list.map((r) => (r.id === review.id ? { ...r, approved } : r)));
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (!response.ok) throw new Error("failed");
      toast(approved ? "Review published" : "Review hidden");
    } catch {
      setReviews((list) => list.map((r) => (r.id === review.id ? { ...r, approved: !approved } : r)));
      toast("Could not update the review", "error");
    } finally {
      setBusy(null);
    }
  }

  async function remove(review: StoredReview) {
    const ok = await confirm({
      title: "Delete this review?",
      message: `${review.name}'s review of ${review.productName ?? review.productId} will be removed permanently.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy(review.id);
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("failed");
      setReviews((list) => list.filter((r) => r.id !== review.id));
      toast("Review deleted");
    } catch {
      toast("Could not delete the review", "error");
    } finally {
      setBusy(null);
    }
  }

  if (reviews.length === 0) {
    return (
      <p className="mt-10 rounded-xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
        No reviews yet. Verified buyers can leave one on the product page; it shows up here for approval.
      </p>
    );
  }

  // Awaiting approval first, newest first within each group.
  const sorted = [...reviews].sort((a, b) => Number(a.approved) - Number(b.approved));

  return (
    <div className="mt-6 space-y-4">
      {sorted.map((r) => (
        <div key={r.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-sm font-bold text-brand">
                {r.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                <span className="text-xs text-amber-400">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>{fmtDate(r.createdAt)}</p>
              <Link href={`/product/${encodeURIComponent(r.productId)}`} className="mt-0.5 block font-medium text-gray-500 hover:text-brand">
                {r.productName ?? r.productId}
              </Link>
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  r.approved ? "bg-rating/10 text-rating" : "bg-amber-50 text-amber-700"
                }`}
              >
                {r.approved ? "Live" : "Awaiting approval"}
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.comment}</p>
          <div className="mt-4 flex justify-end gap-2 border-t border-black/5 pt-3">
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => setApproved(r, !r.approved)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                r.approved
                  ? "border border-black/10 text-gray-700 hover:border-brand hover:text-brand"
                  : "bg-brand text-cream hover:bg-brand-dark"
              }`}
            >
              {r.approved ? "Hide" : "Approve"}
            </button>
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => remove(r)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
