"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/data/products";

type UserReview = Review & { id: string };

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
function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
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

export default function ProductReviews({
  productId,
  productName,
  baseRating,
  baseCount,
  sampleReviews,
}: {
  productId: string;
  productName?: string;
  baseRating: number;
  baseCount: number;
  sampleReviews: Review[];
}) {
  const storageKey = `reviews:${productId}`;
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  // Load saved reviews for this product.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setUserReviews(JSON.parse(raw));
    } catch {
      /* ignore unavailable/corrupt storage */
    }
    setHydrated(true);
  }, [storageKey]);

  // Persist whenever the list changes (after initial load).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(userReviews));
    } catch {
      /* ignore */
    }
  }, [userReviews, hydrated, storageKey]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return setError("Please choose a star rating.");
    if (!comment.trim()) return setError("Please write a short review.");
    setError("");
    const review: UserReview = {
      id: `${Date.now()}`,
      name: name.trim() || "Anonymous",
      rating,
      comment: comment.trim(),
      date: "Just now",
    };
    setUserReviews((prev) => [review, ...prev]);
    setName("");
    setRating(0);
    setComment("");

    // Also send to the server so it shows in the admin panel (best-effort).
    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        productName,
        name: review.name,
        rating: review.rating,
        comment: review.comment,
      }),
    }).catch(() => {
      /* offline / storage-only is fine */
    });
  }

  // Live average includes the customer's own submitted reviews.
  const userSum = userReviews.reduce((s, r) => s + r.rating, 0);
  const totalCount = baseCount + userReviews.length;
  const avg =
    totalCount > 0
      ? (baseRating * baseCount + userSum) / totalCount
      : baseRating;

  // Newest first (customer submissions, then samples); show only the latest 5.
  const latestReviews: Review[] = [...userReviews, ...sampleReviews].slice(0, 5);

  return (
    <section className="mt-14">
      <h2 className="font-serif text-2xl text-gray-900">Customer Reviews</h2>

      {/* Summary */}
      <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="text-center">
          <p className="font-serif text-4xl text-gray-900">{avg.toFixed(1)}</p>
          <Stars rating={avg} className="text-lg" />
          <p className="mt-1 text-xs text-gray-500">{totalCount} reviews</p>
        </div>
        <div className="flex-1 border-l border-black/5 pl-6 text-sm text-gray-600">
          Most customers love the authentic taste and careful packaging. Share
          your own experience below to help other shoppers.
        </div>
      </div>

      {/* Write a review */}
      <form
        onSubmit={submit}
        className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <h3 className="font-serif text-lg text-gray-900">Write a review</h3>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Your rating</span>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you think of this product?"
          rows={3}
          className="mt-4 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          Submit review
        </button>
      </form>

      {/* Review list — latest 5 */}
      <h3 className="mt-8 font-serif text-lg text-gray-900">Latest reviews</h3>
      <div className="mt-4 space-y-4">
        {latestReviews.map((r, i) => (
          <div
            key={(r as UserReview).id ?? `sample-${i}`}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-sm font-bold text-brand">
                  {r.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                  <Stars rating={r.rating} className="text-xs" />
                </div>
              </div>
              <span className="text-xs text-gray-400">{r.date}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
