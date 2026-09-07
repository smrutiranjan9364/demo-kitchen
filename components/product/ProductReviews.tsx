"use client";

import { useState } from "react";
import type { StoredReview } from "@/lib/store";
import LoginButton from "@/components/auth/LoginButton";

// What the server knows about the visitor's right to review this product.
export type Reviewer = { name: string; purchased: boolean; reviewed: boolean };

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`text-amber-400 ${className}`} aria-label={`${rating} out of 5`}>
      {"★★★★★".split("").map((s, i) => (
        <span key={i} className={i < Math.round(rating) ? "" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

// Clickable star input for choosing a rating.
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="inline-flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`px-0.5 text-2xl leading-none transition ${
            n <= shown ? "text-amber-400" : "text-gray-300 hover:text-amber-300"
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

// Fixed zone so server and browser render the same string (no hydration diff).
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

// Shows approved reviews only. A new review goes to the moderation queue and
// appears here once the kitchen approves it — so nothing is appended locally.
export default function ProductReviews({
  productId,
  initialReviews,
  reviewer,
}: {
  productId: string;
  initialReviews: StoredReview[];
  reviewer: Reviewer | null;
}) {
  const reviews = initialReviews;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return setError("Please choose a star rating.");
    if (comment.trim().length < 3) return setError("Please write a short review.");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not submit your review. Please try again.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your review.");
    } finally {
      setBusy(false);
    }
  }

  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  return (
    <section id="reviews" className="mt-14">
      <h2 className="font-serif text-2xl text-gray-900">Customer Reviews</h2>

      {/* Summary */}
      <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        {count > 0 ? (
          <div className="text-center">
            <p className="font-serif text-4xl text-gray-900">{avg.toFixed(1)}</p>
            <Stars rating={avg} className="text-lg" />
            <p className="mt-1 text-xs text-gray-500">
              {count} verified review{count === 1 ? "" : "s"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No reviews yet. Reviews come from customers who have bought this item.</p>
        )}
      </div>

      {/* Write a review — gated to verified buyers */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h3 className="font-serif text-lg text-gray-900">Write a review</h3>
        {submitted ? (
          <p className="mt-3 rounded-md bg-rating/10 px-3 py-2 text-sm font-medium text-rating">
            Thank you! Your review will appear here once we&apos;ve checked it.
          </p>
        ) : !reviewer ? (
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              Reviews are open to customers who have bought this item. Log in to leave yours.
            </p>
            <LoginButton
              label="LOG IN"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-dark"
            />
          </div>
        ) : !reviewer.purchased ? (
          <p className="mt-3 text-sm text-gray-600">
            Reviews are open to customers who have bought this item. Once you&apos;ve ordered it, come back and tell us what you thought.
          </p>
        ) : reviewer.reviewed ? (
          <p className="mt-3 text-sm text-gray-600">You&apos;ve already reviewed this item — thank you!</p>
        ) : (
          <form onSubmit={submit} className="mt-2">
            <p className="text-xs text-gray-400">Posting as {reviewer.name}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Your rating</span>
              <StarInput value={rating} onChange={setRating} />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of this product?"
              rows={3}
              maxLength={1000}
              className="mt-4 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )}
      </div>

      {/* Review list */}
      {count > 0 ? (
        <>
          <h3 className="mt-8 font-serif text-lg text-gray-900">Latest reviews</h3>
          <div className="mt-4 space-y-4">
            {reviews.slice(0, 10).map((r) => (
              <div key={r.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-sm font-bold text-brand">
                      {r.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {r.name} <span className="ml-1 text-[10px] font-medium uppercase tracking-wide text-rating">Verified buyer</span>
                      </p>
                      <Stars rating={r.rating} className="text-xs" />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{fmtDate(r.createdAt)}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
