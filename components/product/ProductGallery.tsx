"use client";

import { useState } from "react";
import Image from "next/image";

// The catalog carries one authentic photo per product. To give a Flipkart-style
// multi-thumbnail gallery without inventing images of the wrong dish, we present
// that same real photo in four different framings (full, top, bottom, close-up).
const VIEWS = [
  { label: "Full view", className: "object-center" },
  { label: "Top", className: "object-top" },
  { label: "Bottom", className: "object-bottom" },
  { label: "Close-up", className: "object-center scale-[1.6]" },
];

export default function ProductGallery({
  image,
  alt,
  discount,
}: {
  image?: string;
  alt: string;
  discount?: number;
}) {
  const [active, setActive] = useState(0);

  if (!image) {
    return (
      <div className="aspect-square rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />
    );
  }

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {/* Thumbnail rail */}
      <div className="flex gap-3 sm:flex-col">
        {VIEWS.map((view, i) => (
          <button
            key={view.label}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`${alt} — ${view.label}`}
            aria-current={i === active}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white ring-1 transition sm:h-20 sm:w-20 ${
              i === active
                ? "ring-2 ring-brand"
                : "ring-black/10 hover:ring-brand/50"
            }`}
          >
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 640px) 80px, 64px"
              className={`object-cover ${view.className}`}
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="group relative aspect-square flex-1 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 500px, (min-width: 1024px) calc(50vw - 140px), (min-width: 640px) calc(100vw - 144px), calc(100vw - 32px)"
          loading="eager"
          fetchPriority="high"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${VIEWS[active].className}`}
        />
        {discount ? (
          <span className="absolute left-4 top-4 rounded bg-brand px-2.5 py-1 text-xs font-bold text-cream">
            {discount}% OFF
          </span>
        ) : null}
      </div>
    </div>
  );
}
